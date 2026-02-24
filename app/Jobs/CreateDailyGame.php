<?php

namespace App\Jobs;

use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\DailyGame;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use RuntimeException;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    /**
     * Number of seconds the job can run before the worker kills it.
     * Game agent ~2 min + caricatures up to 3 batches × 5 min = allow 15 min.
     */
    public int $timeout = 900;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private ?Carbon $gameDate = null,
        private string $type = 'celebrity_sh*ggers'
    ) {
        $this->gameDate ??= Carbon::today();
    }

    public function handle(): void
    {
        $gameDate = $this->gameDate;

        if (DailyGame::where('game_date', $gameDate)->exists()) {
            Log::info("CreateDailyGame: Game already exists for {$gameDate->toDateString()}, skipping.");

            return;
        }

        Log::info('CreateDailyGame: Running game agent script.');

        $excludedAnswerNames = Celebrity::whereHas('dailyGamesAsAnswer')
            ->distinct()
            ->pluck('name')
            ->values()
            ->all();

        $node = config('services.node_path', 'node');
        $result = Process::path(base_path())
            ->timeout(300)
            ->env([
                'OPENAI_API_KEY' => config('services.openai.api_key'),
                'OPENAI_MODEL' => config('services.openai.model'),
            ])
            ->input(json_encode(['excluded_answer_names' => $excludedAnswerNames]))
            ->run([$node, 'scripts/game-agent/generate.js']);

        if (! $result->successful()) {
            Log::error('CreateDailyGame: Agent script failed', [
                'exit_code' => $result->exitCode(),
                'stdout' => $result->output(),
                'stderr' => $result->errorOutput(),
            ]);
            $message = $result->errorOutput() ?: $result->output() ?: 'Unknown error (exit code '.$result->exitCode().'). Is Node installed and in PATH for the web server? Set NODE_PATH in .env to the full path to node if needed.';
            throw new RuntimeException('Game agent script failed: '.trim($message));
        }

        // Last line of stdout is the JSON (step logs go to stderr)
        $lines = array_filter(explode("\n", trim($result->output())));
        $output = end($lines);
        $data = json_decode($output, true);

        if (json_last_error() !== JSON_ERROR_NONE || ! isset($data['answer'], $data['relationships'])) {
            throw new RuntimeException('Game agent returned invalid JSON or missing answer/relationships: '.$output);
        }

        if (count($data['relationships']) !== 4) {
            throw new RuntimeException('Game agent must return exactly 4 relationships, got: '.count($data['relationships']));
        }

        $answerData = $data['answer'];
        $answer = Celebrity::firstOrCreate(
            [
                'name' => $answerData['name'],
                'birth_year' => (int) $answerData['birth_year'],
            ],
            [
                'gender' => $answerData['gender'] ?? 'male',
                'tagline' => $answerData['tagline'] ?? '',
                'photo_url' => null,
            ]
        );

        Log::info('CreateDailyGame: Answer celebrity saved.', ['name' => $answer->name]);

        $subjectIds = [];
        foreach ($data['relationships'] as $rel) {
            $subject = Celebrity::firstOrCreate(
                [
                    'name' => $rel['name'],
                    'birth_year' => (int) $rel['birth_year'],
                ],
                [
                    'gender' => $rel['gender'] ?? 'female',
                    'tagline' => $rel['tagline'] ?? '',
                    'photo_url' => null,
                ]
            );
            $subjectIds[] = $subject->id;

            CelebrityRelationship::updateOrCreate(
                [
                    'celebrity_1_id' => $answer->id,
                    'celebrity_2_id' => $subject->id,
                ],
                [
                    'citation' => $rel['citation'] ?? null,
                ]
            );
        }

        $celebritiesNeedingPhotos = collect([$answer])
            ->concat(Celebrity::whereIn('id', $subjectIds)->get())
            ->filter(fn (Celebrity $c) => empty($c->photo_url))
            ->values();

        if ($celebritiesNeedingPhotos->isNotEmpty()) {
            $maxCaricatureRetries = 4;
            $pending = $celebritiesNeedingPhotos->map(fn (Celebrity $c) => [
                'name' => $c->name,
                'birth_year' => $c->birth_year,
                'tagline' => $c->tagline ?? '',
            ])->all();
            $attempt = 0;
            $outputDir = storage_path('app/public/celebrities');
            $lastScriptSuccess = true;

            while ($pending !== []) {
                $attempt++;
                $isRetry = $attempt > 1;
                $promptVariant = $attempt <= 2 ? 1 : 2;
                Log::info($isRetry
                    ? 'CreateDailyGame: Caricature retry.'
                    : 'CreateDailyGame: Generating caricatures.',
                    [
                        'attempt' => $attempt,
                        'prompt_variant' => $promptVariant,
                        'count' => count($pending),
                        'names' => array_column($pending, 'name'),
                    ]
                );

                [$generated, $failed, $scriptSuccess] = $this->runCaricatureScript($node, $pending, $outputDir, $promptVariant);
                $lastScriptSuccess = $scriptSuccess;

                foreach ($generated as $item) {
                    if (empty($item['name']) || ! isset($item['birth_year'], $item['path'])) {
                        continue;
                    }
                    $photoUrl = URL::asset('storage/'.$item['path']);
                    Celebrity::where('name', $item['name'])
                        ->where('birth_year', (int) $item['birth_year'])
                        ->update(['photo_url' => $photoUrl]);
                }

                if ($isRetry) {
                    Log::info('CreateDailyGame: Caricature retry batch complete.', [
                        'attempt' => $attempt,
                        'generated_this_batch' => count($generated),
                        'still_failed' => count($failed),
                        'failed' => $failed,
                    ]);
                } else {
                    Log::info('CreateDailyGame: Caricatures applied.', [
                        'applied' => count($generated),
                        'failed' => $failed,
                    ]);
                }

                if ($failed === [] || $attempt >= $maxCaricatureRetries) {
                    if ($failed !== [] && $attempt >= $maxCaricatureRetries) {
                        Log::warning('CreateDailyGame: Caricature retries exhausted, some images not generated.', [
                            'attempt' => $attempt,
                            'remaining_failed' => $failed,
                        ]);
                    }
                    break;
                }

                $celebrityMap = $celebritiesNeedingPhotos->keyBy(fn (Celebrity $c) => $c->name.'|'.($c->birth_year));
                $pending = array_map(function (array $f) use ($celebrityMap) {
                    $key = ($f['name'] ?? '').'|'.($f['birth_year'] ?? 0);
                    $celebrity = $celebrityMap->get($key);

                    return [
                        'name' => $f['name'] ?? '',
                        'birth_year' => (int) ($f['birth_year'] ?? 0),
                        'tagline' => $celebrity ? ($celebrity->tagline ?? '') : '',
                    ];
                }, $failed);

                if ($attempt === 2) {
                    Log::info('CreateDailyGame: Waiting 15 seconds before attempt 3 (prompt variant 2).');
                    sleep(15);
                }
            }

            if (! $lastScriptSuccess) {
                Log::warning('CreateDailyGame: Caricature script exited with error (partial results may have been applied).');
            }

            $stillMissingPhotos = Celebrity::whereIn('id', $celebritiesNeedingPhotos->pluck('id'))
                ->whereNull('photo_url')
                ->get();
            if ($stillMissingPhotos->isNotEmpty()) {
                Log::info('CreateDailyGame: Wikipedia fallback for celebrities without generated images.', [
                    'count' => $stillMissingPhotos->count(),
                    'names' => $stillMissingPhotos->pluck('name')->all(),
                ]);
                foreach ($stillMissingPhotos as $celebrity) {
                    $path = $this->fetchWikipediaImage($celebrity->name, (int) $celebrity->birth_year, $outputDir);
                    if ($path !== null) {
                        $photoUrl = URL::asset('storage/'.$path);
                        $celebrity->update(['photo_url' => $photoUrl]);
                        Log::info('CreateDailyGame: Wikipedia image applied.', ['name' => $celebrity->name]);
                    } else {
                        Log::warning('CreateDailyGame: Wikipedia image not found.', ['name' => $celebrity->name]);
                    }
                }
            }
        }

        $game = DailyGame::create([
            'game_date' => $gameDate,
            'type' => $this->type,
            'answer_id' => $answer->id,
        ]);

        $game->subjects()->attach($subjectIds);

        Log::info("CreateDailyGame: Game created for {$gameDate->toDateString()} (answer: {$answer->name}, subjects: 4).");
    }

    /**
     * Run the caricature script for the given celebrities. Returns [generated, failed, process success].
     *
     * @param  int  $promptVariant  1 = primary prompt (attempts 1–2), 2 = alternate prompt (attempts 3–4).
     * @return array{0: array<int, array{name: string, birth_year: int, path: string}>, 1: array<int, array{name: string, birth_year: int, error: string}>, 2: bool}
     */
    private function runCaricatureScript(string $node, array $celebrities, string $outputDir, int $promptVariant = 1): array
    {
        $input = json_encode([
            'celebrities' => $celebrities,
            'output_dir' => $outputDir,
            'prompt_variant' => $promptVariant,
        ]);

        $result = Process::path(base_path())
            ->timeout(300)
            ->env([
                'OPENAI_API_KEY' => config('services.openai.api_key'),
                'OPENAI_IMAGE_MODEL' => config('services.openai.image_model'),
            ])
            ->input($input)
            ->run([$node, 'scripts/game-agent/generate-caricatures.js']);

        $output = trim($result->output());
        $generated = [];
        $failed = [];

        if ($output !== '') {
            $lines = array_filter(explode("\n", $output));
            foreach (array_reverse($lines) as $line) {
                $decoded = json_decode($line, true);
                if (json_last_error() === JSON_ERROR_NONE && isset($decoded['generated']) && is_array($decoded['generated'])) {
                    $generated = $decoded['generated'];
                    $failed = $decoded['failed'] ?? [];

                    break;
                }
            }
        }

        return [$generated, $failed, $result->successful()];
    }

    /**
     * Fetch the main image from the celebrity's Wikipedia page and save to outputDir.
     * Returns relative path (e.g. celebrities/slug.png) or null if not found.
     */
    private function fetchWikipediaImage(string $name, int $birthYear, string $outputDir): ?string
    {
        $slug = Str::slug($name);

        $search = Http::withHeaders(['User-Agent' => 'RogerThat/1.0 (https://roger-that.test)'])
            ->get('https://en.wikipedia.org/w/api.php', [
                'action' => 'query',
                'list' => 'search',
                'srsearch' => $name,
                'srlimit' => 1,
                'format' => 'json',
            ]);

        if (! $search->successful()) {
            return null;
        }

        $pages = $search->json('query.search') ?? [];
        if ($pages === []) {
            return null;
        }

        $pageId = $pages[0]['pageid'] ?? null;
        if ($pageId === null) {
            return null;
        }

        $image = Http::withHeaders(['User-Agent' => 'RogerThat/1.0 (https://roger-that.test)'])
            ->get('https://en.wikipedia.org/w/api.php', [
                'action' => 'query',
                'pageids' => $pageId,
                'prop' => 'pageimages',
                'pithumbsize' => 1024,
                'format' => 'json',
            ]);

        if (! $image->successful()) {
            return null;
        }

        $thumbnail = $image->json("query.pages.{$pageId}.thumbnail.source")
            ?? $image->json("query.pages.{$pageId}.original.source");
        if (empty($thumbnail) || ! str_starts_with($thumbnail, 'http')) {
            return null;
        }

        $response = Http::withHeaders(['User-Agent' => 'RogerThat/1.0 (https://roger-that.test)'])
            ->timeout(15)
            ->get($thumbnail);

        if (! $response->successful()) {
            return null;
        }

        $contents = $response->body();
        if (strlen($contents) < 100) {
            return null;
        }

        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $ext = pathinfo(parse_url($thumbnail, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
        if (! in_array(strtolower($ext), ['png', 'jpg', 'jpeg', 'webp'], true)) {
            $ext = 'jpg';
        }
        $filenameWithExt = "{$slug}.{$ext}";
        $absolutePathWithExt = $outputDir.DIRECTORY_SEPARATOR.$filenameWithExt;
        file_put_contents($absolutePathWithExt, $contents);

        return 'celebrities/'.$filenameWithExt;
    }
}
