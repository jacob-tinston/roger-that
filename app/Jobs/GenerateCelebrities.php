<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GenerateCelebrities implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $excludeNames = Celebrity::query()
            ->where('gender', 'male')
            ->pluck('name')
            ->all();

        Log::info('GenerateCelebrities request 1 (celebrities list)', ['exclude' => $excludeNames]);

        $userPrompt = str_replace(
            ['[INSERT_EXCLUDED_NAMES_HERE]'],
            [implode(', ', $excludeNames)],
            $this->userPrompt()
        );

        $content = app(AiProvider::class)->generate(
            $this->systemPrompt(),
            $userPrompt,
            $this->getModel()
        );

        if (empty($content)) {
            throw new RuntimeException('GenerateCelebrities: AI returned no content.');
        }

        $decoded = json_decode(
            preg_replace(['/^```json\s*/i', '/\s*```\s*$/i'], '', trim($content)),
            true
        );

        if (! is_array($decoded) || empty($decoded)) {
            throw new RuntimeException('GenerateCelebrities: AI response was not a non-empty JSON array.');
        }

        $required = ['name', 'birth_year', 'gender', 'tagline'];
        $created = 0;
        $updated = 0;
        $malesFromThisRunWithPhoto = [];
        $celebritiesReturnedInFirstRequest = [];

        foreach ($decoded as $item) {
            if (! is_array($item)) {
                continue;
            }

            $missing = [];
            foreach ($required as $key) {
                if (empty($item[$key] ?? '')) {
                    $missing[] = $key;
                }
            }
            if ($missing !== []) {
                continue;
            }

            if (($item['gender'] ?? '') !== 'male') {
                continue;
            }

            $name = trim((string) $item['name']);
            $birthYear = (int) $item['birth_year'];
            $tagline = trim((string) ($item['tagline'] ?? ''));

            $celebritiesReturnedInFirstRequest[] = $name;

            $photoUrl = wikipedia_thumbnail_url($name);

            $celebrity = Celebrity::firstOrCreate(
                ['name' => $name],
                [
                    'birth_year' => $birthYear,
                    'gender' => 'male',
                    'tagline' => $tagline ?: null,
                    'photo_url' => $photoUrl,
                ]
            );

            if ($celebrity->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
                $celebrity->update([
                    'birth_year' => $birthYear,
                    'tagline' => $tagline ?: $celebrity->tagline,
                    'photo_url' => $photoUrl ?? $celebrity->photo_url,
                ]);
            }

            if ($celebrity->photo_url && trim($celebrity->photo_url) !== '') {
                $malesFromThisRunWithPhoto[] = $celebrity->name;
            }
        }

        Log::info('GenerateCelebrities request 1: celebrities returned', ['celebrities' => $celebritiesReturnedInFirstRequest]);
        Log::info("GenerateCelebrities finished. Created: {$created}, updated: {$updated}.");

        $this->fetchAndSaveRelationships($malesFromThisRunWithPhoto);
    }

    /**
     * @param  array<int, string>  $malesWithPhoto  Names of males from this run that have a valid photo (for the relationships request only).
     */
    private function fetchAndSaveRelationships(array $malesWithPhoto): void
    {

        if ($malesWithPhoto === []) {
            Log::info('GenerateCelebrities: No males with valid photo; skipping relationships.');

            return;
        }

        $excludedWomen = Celebrity::query()
            ->where('gender', 'female')
            ->where(function ($query) {
                $query->whereNull('photo_url')
                    ->orWhere('photo_url', '');
            })
            ->pluck('name')
            ->all();

        Log::info('GenerateCelebrities request 2 (relationships): include array', ['include' => $malesWithPhoto]);
        Log::info('GenerateCelebrities request 2 (relationships): exclude array', ['exclude' => $excludedWomen]);

        $systemPrompt = $this->relationshipsSystemPrompt();
        $userPrompt = str_replace(
            ['[INSERT_CELEBRITY_NAMES_HERE]', '[INSERT_EXCLUDED_NAMES_HERE]'],
            [implode(', ', $malesWithPhoto), implode(', ', $excludedWomen)],
            $this->relationshipsUserPrompt()
        );

        $content = app(AiProvider::class)->generate(
            $systemPrompt,
            $userPrompt,
            $this->getModel()
        );

        if (empty($content)) {
            Log::warning('GenerateCelebrities: AI returned no content for relationships. Skipping relationships step.');

            return;
        }

        $decoded = $this->parseRelationshipsJson(trim($content));
        if ($decoded === null) {
            Log::warning('GenerateCelebrities: Relationships response could not be parsed. Skipping relationships step.', [
                'content_preview' => substr($content, 0, 500),
                'json_error' => json_last_error_msg(),
            ]);

            return;
        }

        $relationshipsCreated = 0;
        $partnersCreated = 0;

        foreach ($decoded as $item) {
            if (! is_array($item)) {
                continue;
            }

            $maleName = trim((string) ($item['celebrity_name'] ?? $item['name'] ?? ''));
            $relationships = $item['relationships'] ?? $item['partners'] ?? [];

            if ($maleName === '' || ! is_array($relationships)) {
                continue;
            }

            $male = Celebrity::query()
                ->where('gender', 'male')
                ->whereRaw('LOWER(name) = ?', [strtolower($maleName)])
                ->first();

            if (! $male) {
                continue;
            }

            foreach ($relationships as $rel) {
                if (! is_array($rel)) {
                    continue;
                }

                $partnerName = trim((string) ($rel['name'] ?? $rel['partner_name'] ?? ''));
                if ($partnerName === '') {
                    continue;
                }

                $birthYear = isset($rel['birth_year']) ? (int) $rel['birth_year'] : 0;
                $gender = trim((string) ($rel['gender'] ?? 'female'));
                $tagline = $this->normalizeTagline($rel['tagline'] ?? null);

                $partner = Celebrity::firstOrCreate(
                    ['name' => $partnerName],
                    [
                        'birth_year' => $birthYear > 0 ? $birthYear : 1900,
                        'gender' => $gender ?: 'female',
                        'tagline' => $tagline,
                        'photo_url' => null,
                    ]
                );

                if ($partner->wasRecentlyCreated) {
                    $partnersCreated++;
                } elseif ($tagline !== null) {
                    $partner->update(['tagline' => $tagline]);
                }

                if (! $partner->photo_url) {
                    $photoUrl = wikipedia_thumbnail_url($partner->name);
                    if ($photoUrl) {
                        $partner->update(['photo_url' => $photoUrl]);
                    }
                }

                $link = CelebrityRelationship::firstOrCreate(
                    [
                        'celebrity_1_id' => $male->id,
                        'celebrity_2_id' => $partner->id,
                    ]
                );

                if ($link->wasRecentlyCreated) {
                    $relationshipsCreated++;
                }
            }
        }

        Log::info("GenerateCelebrities relationships finished. Partners created: {$partnersCreated}, relationships created: {$relationshipsCreated}.");
    }

    /**
     * Parse AI response into an array of relationship items. Tolerates markdown fences, object-wrapped arrays, and truncated JSON.
     *
     * @return array<int, mixed>|null
     */
    private function parseRelationshipsJson(string $content): ?array
    {
        $cleaned = preg_replace(['/^```\w*\s*/i', '/\s*```\s*$/i'], '', $content);
        $cleaned = trim($cleaned);
        $cleaned = preg_replace('/,\s*([}\]])/', '$1', $cleaned);

        $candidates = [$cleaned, $this->repairTruncatedJson($cleaned)];
        foreach ($candidates as $i => $candidate) {
            if ($candidate === null) {
                continue;
            }
            $decoded = json_decode($candidate, true);
            if (is_array($decoded)) {
                if (array_is_list($decoded)) {
                    return $decoded;
                }
                foreach (['data', 'results', 'relationships', 'items'] as $key) {
                    if (isset($decoded[$key]) && is_array($decoded[$key]) && array_is_list($decoded[$key])) {
                        return $decoded[$key];
                    }
                }
            }
            if ($i === 1) {
                Log::debug('GenerateCelebrities: Repair attempt still did not produce valid JSON.', [
                    'json_error' => json_last_error_msg(),
                    'repaired_preview' => substr($candidate, 0, 400),
                ]);
            }
        }

        $firstBracket = strpos($cleaned, '[');
        $lastBracket = strrpos($cleaned, ']');
        if ($firstBracket !== false && $lastBracket !== false && $lastBracket > $firstBracket) {
            $decoded = json_decode(substr($cleaned, $firstBracket, $lastBracket - $firstBracket + 1), true);
            if (is_array($decoded) && array_is_list($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function repairTruncatedJson(string $json): ?string
    {
        $len = strlen($json);
        $inString = false;
        $escape = false;
        $stack = [];

        for ($i = 0; $i < $len; $i++) {
            $c = $json[$i];
            if ($escape) {
                $escape = false;

                continue;
            }
            if ($inString) {
                if ($c === '\\') {
                    $escape = true;
                } elseif ($c === '"') {
                    $inString = false;
                }

                continue;
            }
            if ($c === '"') {
                $inString = true;

                continue;
            }
            if ($c === '[' || $c === '{') {
                $stack[] = $c;
            } elseif ($c === ']' && $stack !== [] && end($stack) === '[') {
                array_pop($stack);
            } elseif ($c === '}' && $stack !== [] && end($stack) === '{') {
                array_pop($stack);
            }
        }

        if ($stack === [] && ! $inString) {
            return null;
        }

        $suffix = $inString ? '"' : '';
        while ($stack !== []) {
            $suffix .= array_pop($stack) === '[' ? ']' : '}';
        }

        return $json.$suffix;
    }

    private function normalizeTagline(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $s = preg_replace('/\s+/', ' ', trim((string) $value));

        return $s !== '' ? $s : null;
    }

    private function relationshipsSystemPrompt(): string
    {
        $setting = Setting::where('key', 'CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT setting is missing or empty. Run the settings seeder.');
        }

        return $setting->value;
    }

    private function relationshipsUserPrompt(): string
    {
        $setting = Setting::where('key', 'CELEBRITIES_RELATIONSHIPS_USER_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('CELEBRITIES_RELATIONSHIPS_USER_PROMPT setting is missing or empty. Run the settings seeder.');
        }

        return $setting->value;
    }

    private function systemPrompt(): string
    {
        $setting = Setting::where('key', 'CELEBRITIES_SYSTEM_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('CELEBRITIES_SYSTEM_PROMPT setting is missing or empty. Run the settings seeder.');
        }

        return $setting->value;
    }

    private function userPrompt(): string
    {
        $setting = Setting::where('key', 'CELEBRITIES_USER_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('CELEBRITIES_USER_PROMPT setting is missing or empty. Run the settings seeder.');
        }

        return $setting->value;
    }

    private function getModel(): string
    {
        return match (config('services.ai_provider', 'anthropic')) {
            'openai' => config('services.openai.model'),
            default => config('services.anthropic.model'),
        };
    }
}
