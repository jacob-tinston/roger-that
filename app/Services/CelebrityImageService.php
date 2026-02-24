<?php

namespace App\Services;

use App\Models\Celebrity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

class CelebrityImageService
{
    private const MAX_CARICATURE_RETRIES = 4;

    /**
     * Generate images for the given celebrities using the caricature script with retries,
     * then Wikipedia fallback for any still missing. Optionally force regeneration by
     * deleting existing image files first.
     *
     * Returns a map of celebrity id => relative path (e.g. celebrities/slug.png or celebrities/slug.jpg)
     * for each celebrity that got an image saved. The caller should update each celebrity's
     * photo_url from this output path so the correct file (and extension) is used.
     *
     * @return array<int, string> celebrity id => relative path of saved image
     */
    public function generateImagesForCelebrities(Collection $celebrities, bool $forceRegenerate = false): array
    {
        $savedPaths = [];

        if ($celebrities->isEmpty()) {
            return $savedPaths;
        }

        $outputDir = storage_path('app/public/celebrities');
        $node = config('services.node_path', 'node');
        $celebrityMap = $celebrities->keyBy(fn (Celebrity $c) => $c->name.'|'.($c->birth_year));

        if ($forceRegenerate) {
            $extensions = ['png', 'jpg', 'jpeg', 'webp'];
            foreach ($celebrities as $celebrity) {
                $slug = Str::slug($celebrity->name);
                foreach ($extensions as $ext) {
                    $path = $outputDir.DIRECTORY_SEPARATOR.$slug.'.'.$ext;
                    if (is_file($path)) {
                        unlink($path);
                        Log::info('CelebrityImageService: Deleted existing image for regenerate.', [
                            'name' => $celebrity->name,
                            'extension' => $ext,
                        ]);
                    }
                }
            }
        }

        $pending = $celebrities->map(fn (Celebrity $c) => [
            'name' => $c->name,
            'birth_year' => $c->birth_year,
            'tagline' => $c->tagline ?? '',
        ])->values()->all();

        $attempt = 0;
        $lastScriptSuccess = true;

        while ($pending !== []) {
            $attempt++;
            $isRetry = $attempt > 1;
            $promptVariant = $attempt <= 2 ? 1 : 2;

            Log::info($isRetry
                ? 'CelebrityImageService: Caricature retry.'
                : 'CelebrityImageService: Generating caricatures.',
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
                $key = $item['name'].'|'.((int) $item['birth_year']);
                $celebrity = $celebrityMap->get($key);
                if ($celebrity !== null) {
                    $savedPaths[$celebrity->id] = $item['path'];
                }
            }

            if ($isRetry) {
                Log::info('CelebrityImageService: Caricature retry batch complete.', [
                    'attempt' => $attempt,
                    'generated_this_batch' => count($generated),
                    'still_failed' => count($failed),
                    'failed' => $failed,
                ]);
            } else {
                Log::info('CelebrityImageService: Caricatures applied.', [
                    'applied' => count($generated),
                    'failed' => $failed,
                ]);
            }

            if ($failed === [] || $attempt >= self::MAX_CARICATURE_RETRIES) {
                if ($failed !== [] && $attempt >= self::MAX_CARICATURE_RETRIES) {
                    Log::warning('CelebrityImageService: Caricature retries exhausted, some images not generated.', [
                        'attempt' => $attempt,
                        'remaining_failed' => $failed,
                    ]);
                }
                break;
            }

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
                Log::info('CelebrityImageService: Waiting 15 seconds before attempt 3 (prompt variant 2).');
                sleep(15);
            }
        }

        if (! $lastScriptSuccess) {
            Log::warning('CelebrityImageService: Caricature script exited with error (partial results may have been applied).');
        }

        $stillMissingIds = $celebrities->pluck('id')->diff(array_keys($savedPaths))->values()->all();
        $stillMissingPhotos = $celebrities->filter(fn (Celebrity $c) => in_array($c->id, $stillMissingIds, true));

        if ($stillMissingPhotos->isNotEmpty()) {
            Log::info('CelebrityImageService: Wikipedia fallback for celebrities without generated images.', [
                'count' => $stillMissingPhotos->count(),
                'names' => $stillMissingPhotos->pluck('name')->all(),
            ]);
            foreach ($stillMissingPhotos as $celebrity) {
                $path = $this->fetchWikipediaImage($celebrity->name, (int) $celebrity->birth_year, $outputDir);
                if ($path !== null) {
                    $savedPaths[$celebrity->id] = $path;
                    Log::info('CelebrityImageService: Wikipedia image saved.', ['name' => $celebrity->name, 'path' => $path]);
                } else {
                    Log::warning('CelebrityImageService: Wikipedia image not found.', ['name' => $celebrity->name]);
                }
            }
        }

        return $savedPaths;
    }

    /**
     * Run the caricature script for the given celebrities. Returns [generated, failed, process success].
     *
     * @param  int  $promptVariant  1 = primary prompt (attempts 1–2), 2 = alternate prompt (attempts 3–4).
     * @return array{0: array<int, array{name: string, birth_year: int, path: string}>, 1: array<int, array{name: string, birth_year: int, error: string}>, 2: bool}
     */
    public function runCaricatureScript(string $node, array $celebrities, string $outputDir, int $promptVariant = 1): array
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
    public function fetchWikipediaImage(string $name, int $birthYear, string $outputDir): ?string
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
