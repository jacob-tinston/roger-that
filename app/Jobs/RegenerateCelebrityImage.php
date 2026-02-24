<?php

namespace App\Jobs;

use App\Models\Celebrity;
use App\Services\CelebrityImageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RegenerateCelebrityImage implements ShouldQueue
{
    use Queueable;

    /**
     * Number of seconds the job can run (caricature retries + Wikipedia fallback).
     */
    public int $timeout = 900;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private Celebrity $celebrity
    ) {}

    /**
     * Execute the job.
     */
    public function handle(CelebrityImageService $service): void
    {
        $celebrity = $this->celebrity->fresh();
        if (! $celebrity) {
            Log::warning('RegenerateCelebrityImage: Celebrity no longer exists.', ['id' => $this->celebrity->id]);

            return;
        }

        $service->generateImagesForCelebrities(collect([$celebrity]), true);

        $celebrity->refresh();
        if ($celebrity->photo_url !== null) {
            $baseUrl = str_contains($celebrity->photo_url, '?')
                ? explode('?', $celebrity->photo_url, 2)[0]
                : $celebrity->photo_url;
            $celebrity->update(['photo_url' => $baseUrl.'?v='.time()]);
            Log::info('RegenerateCelebrityImage: Image updated (with cache-bust).', ['name' => $celebrity->name]);
        } else {
            Log::warning('RegenerateCelebrityImage: No image could be generated or fetched after retries and Wikipedia fallback.', ['name' => $celebrity->name]);
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
