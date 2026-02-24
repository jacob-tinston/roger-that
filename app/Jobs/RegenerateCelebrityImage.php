<?php

namespace App\Jobs;

use App\Models\Celebrity;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class RegenerateCelebrityImage implements ShouldQueue
{
    use Queueable;

    /**
     * Number of seconds the job can run (script timeout ~5 min).
     */
    public int $timeout = 360;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private Celebrity $celebrity
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $celebrity = $this->celebrity->fresh();
        if (! $celebrity) {
            Log::warning('RegenerateCelebrityImage: Celebrity no longer exists.', ['id' => $this->celebrity->id]);

            return;
        }

        $outputDir = storage_path('app/public/celebrities');
        $slug = Str::slug($celebrity->name);
        $existingPath = $outputDir.DIRECTORY_SEPARATOR.$slug.'.png';

        if (is_file($existingPath)) {
            unlink($existingPath);
            Log::info('RegenerateCelebrityImage: Deleted existing image.', ['name' => $celebrity->name]);
        }

        $payload = [
            'name' => $celebrity->name,
            'birth_year' => $celebrity->birth_year,
            'tagline' => $celebrity->tagline ?? '',
        ];

        $node = config('services.node_path', 'node');
        $input = json_encode([
            'celebrities' => [$payload],
            'output_dir' => $outputDir,
            'prompt_variant' => 1,
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

        if ($output !== '') {
            $lines = array_filter(explode("\n", $output));
            foreach (array_reverse($lines) as $line) {
                $decoded = json_decode($line, true);
                if (json_last_error() === JSON_ERROR_NONE && isset($decoded['generated']) && is_array($decoded['generated'])) {
                    $generated = $decoded['generated'];
                    break;
                }
            }
        }

        if ($result->successful() && count($generated) > 0 && isset($generated[0]['path'])) {
            $item = $generated[0];
            $baseUrl = URL::asset('storage/'.$item['path']);
            $photoUrl = $baseUrl.'?v='.time();
            $celebrity->update(['photo_url' => $photoUrl]);
            Log::info('RegenerateCelebrityImage: Image regenerated.', ['name' => $celebrity->name]);
        } else {
            Log::error('RegenerateCelebrityImage: Script failed or no image generated.', [
                'name' => $celebrity->name,
                'exit_code' => $result->exitCode(),
                'output' => $output,
                'stderr' => $result->errorOutput(),
            ]);
            throw new \RuntimeException('RegenerateCelebrityImage failed for '.$celebrity->name);
        }
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return ['celebrity:'.$this->celebrity->id, 'regenerate-image'];
    }
}
