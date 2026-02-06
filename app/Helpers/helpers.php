<?php

use Illuminate\Support\Facades\Http;

if (! function_exists('wikipedia_thumbnail_url')) {
    /**
     * Fetch the Wikipedia thumbnail image URL for a person's name (e.g. from page summary API).
     *
     * @return string|null The thumbnail URL or null if not found / request failed
     */
    function wikipedia_thumbnail_url(string $name): ?string
    {
        $url = 'https://en.wikipedia.org/api/rest_v1/page/summary/'.str_replace(' ', '_', $name);

        try {
            $response = Http::timeout(5)
                ->withHeaders(['User-Agent' => 'RogerThat/1.0 ('.config('app.url').')'])
                ->get($url);

            if (! $response->successful()) {
                return null;
            }

            return $response->json('thumbnail.source');
        } catch (Throwable) {
            return null;
        }
    }
}
