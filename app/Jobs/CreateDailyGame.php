<?php

namespace App\Jobs;

use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\DailyGame;
use App\Services\CelebrityImageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
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
            app(CelebrityImageService::class)->generateImagesForCelebrities($celebritiesNeedingPhotos, false);
        }

        $game = DailyGame::create([
            'game_date' => $gameDate,
            'type' => $this->type,
            'answer_id' => $answer->id,
        ]);

        $game->subjects()->attach($subjectIds);

        Log::info("CreateDailyGame: Game created for {$gameDate->toDateString()} (answer: {$answer->name}, subjects: 4).");
    }
}
