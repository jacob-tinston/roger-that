<?php

namespace App\Jobs;

use App\Contracts\AiProvider;
use App\Models\Celebrity;
use App\Models\DailyGame;
use App\Models\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private ?Carbon $gameDate = null
    ) {
        $this->gameDate ??= Carbon::today();
    }

    private function systemPrompt(): string
    {
        $setting = Setting::where('key', 'SYSTEM_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('SYSTEM_PROMPT setting is missing or empty');
        }

        return $setting->value;
    }

    private function userPrompt(): string
    {
        $setting = Setting::where('key', 'USER_PROMPT')->first();

        if (! $setting || empty($setting->value)) {
            throw new RuntimeException('USER_PROMPT setting is missing or empty');
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

    private function fetchGameFromAi(array $excludeNames = []): ?array
    {
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
            return null;
        }

        $decoded = json_decode(
            preg_replace(['/^```json\s*/i', '/\s*```\s*$/i'], '', $content),
            true
        );

        if (! is_array($decoded)) {
            return null;
        }

        $answer = $decoded['answer'] ?? null;
        $subjects = $decoded['subjects'] ?? null;

        if (! is_array($answer) || ! is_array($subjects) || count($subjects) !== 4) {
            return null;
        }

        $required = ['name', 'birth_year', 'gender', 'tagline'];

        foreach ($required as $key) {
            if (empty($answer[$key] ?? '')) {
                return null;
            }
        }

        if (($answer['gender'] ?? '') !== 'male') {
            return null;
        }

        foreach ($subjects as $subject) {
            if (! is_array($subject)) {
                return null;
            }

            foreach ($required as $key) {
                if (empty($subject[$key] ?? '')) {
                    return null;
                }
            }
        }

        $answer['birth_year'] = (int) $answer['birth_year'];

        foreach ($subjects as $i => $subject) {
            $subjects[$i]['birth_year'] = (int) $subject['birth_year'];
        }

        return ['answer' => $answer, 'subjects' => $subjects];
    }

    private function fetchWikipediaImageUrl(string $name): ?string
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
        } catch (\Throwable) {
            return null;
        }
    }

    private function ensureCelebrityPhoto(Celebrity $celebrity): bool
    {
        if ($celebrity->photo_url !== null) {
            return true;
        }

        $url = $this->fetchWikipediaImageUrl($celebrity->name);

        if ($url !== null) {
            $celebrity->update(['photo_url' => $url]);

            return true;
        }

        return false;
    }

    private function validateAllCelebritiesHaveImages(array $data): array
    {
        $namesWithoutImages = [];

        // Check answer
        $answerName = $data['answer']['name'] ?? null;
        if ($answerName) {
            $answer = Celebrity::where('name', $answerName)->first();
            if ($answer && ! $this->ensureCelebrityPhoto($answer)) {
                $namesWithoutImages[] = $answerName;
            } elseif (! $answer) {
                // Check if we can fetch the image before creating
                $url = $this->fetchWikipediaImageUrl($answerName);
                if ($url === null) {
                    $namesWithoutImages[] = $answerName;
                }
            }
        }

        // Check subjects
        foreach ($data['subjects'] as $subject) {
            $subjectName = $subject['name'] ?? null;
            if (! $subjectName) {
                continue;
            }

            $celebrity = Celebrity::where('name', $subjectName)->first();
            if ($celebrity && ! $this->ensureCelebrityPhoto($celebrity)) {
                $namesWithoutImages[] = $subjectName;
            } elseif (! $celebrity) {
                // Check if we can fetch the image before creating
                $url = $this->fetchWikipediaImageUrl($subjectName);
                if ($url === null) {
                    $namesWithoutImages[] = $subjectName;
                }
            }
        }

        return [count($namesWithoutImages) === 0, $namesWithoutImages];
    }

    public function handle(): void
    {
        $gameDate = $this->gameDate;
        $maxRetries = 5;

        $excludeNames = DailyGame::query()
            ->where('game_date', '<', $gameDate)
            ->whereNotNull('answer_id')
            ->with('answer')
            ->orderByDesc('game_date')
            ->get()
            ->pluck('answer.name')
            ->filter()
            ->unique()
            ->take(30)
            ->values()
            ->all();

        $data = null;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            $data = $this->fetchGameFromAi($excludeNames);

            if ($data === null) {
                continue;
            }

            [$hasAllImages, $namesWithoutImages] = $this->validateAllCelebritiesHaveImages($data);

            if ($hasAllImages) {
                break;
            }

            $excludeNames = array_unique(array_merge($excludeNames, $namesWithoutImages));
        }

        if ($data === null) {
            throw new RuntimeException(
                'CreateDailyGame failed: '.ucfirst(config('services.ai_provider', 'anthropic')).' returned no valid game data for '.$gameDate->toDateString()
            );
        }

        $answer = Celebrity::firstOrCreate(
            ['name' => $data['answer']['name']],
            [
                'birth_year' => $data['answer']['birth_year'],
                'gender' => $data['answer']['gender'],
                'tagline' => $data['answer']['tagline'],
                'photo_url' => null,
            ]
        );

        $this->ensureCelebrityPhoto($answer);

        $subjectIds = [];

        foreach ($data['subjects'] as $subject) {
            $celebrity = Celebrity::firstOrCreate(
                ['name' => $subject['name']],
                [
                    'birth_year' => $subject['birth_year'],
                    'gender' => $subject['gender'],
                    'tagline' => $subject['tagline'],
                    'photo_url' => null,
                ]
            );

            $this->ensureCelebrityPhoto($celebrity);
            $subjectIds[] = $celebrity->id;
        }

        $game = DailyGame::firstOrCreate(
            ['game_date' => $gameDate],
            ['answer_id' => $answer->id]
        );

        $game->subjects()->sync($subjectIds);

        Log::info("Daily game for '{$gameDate->toDateString()}' created successfully after {$attempt} attempt(s).");
    }
}
