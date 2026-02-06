<?php

namespace App\Jobs;

use App\Models\Celebrity;
use App\Models\DailyGame;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    private const MAX_GENERATE_RETRIES = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private ?Carbon $gameDate = null,
        private string $type = 'celebrity_sh*ggers'
    ) {
        $this->gameDate ??= Carbon::today();
    }

    /**
     * Males who have a photo, at least 4 relationship partners (women) with photos, and have not been used as an answer before.
     *
     * @return Collection<int, Celebrity>
     */
    private function getEligibleMales(): Collection
    {
        $usedAnswerIds = DailyGame::query()
            ->whereNotNull('answer_id')
            ->pluck('answer_id')
            ->unique()
            ->all();

        $malesWithPhoto = Celebrity::query()
            ->where('gender', 'male')
            ->whereNotNull('photo_url')
            ->where('photo_url', '!=', '')
            ->whereNotIn('id', $usedAnswerIds)
            ->get();

        return $malesWithPhoto->filter(function (Celebrity $male) {
            return $male->relatedSubjects()
                ->whereNotNull('photo_url')
                ->where('photo_url', '!=', '')
                ->count() >= 4;
        })->values();
    }

    public function handle(): void
    {
        $gameDate = $this->gameDate;

        if (DailyGame::where('game_date', $gameDate)->exists()) {
            Log::info("CreateDailyGame: Game already exists for {$gameDate->toDateString()}, skipping.");

            return;
        }

        $eligibleMales = $this->getEligibleMales();
        $generateAttempt = 0;

        while ($eligibleMales->isEmpty() && $generateAttempt < self::MAX_GENERATE_RETRIES) {
            $generateAttempt++;
            Log::info('CreateDailyGame: No eligible males (photo + 4+ partners with photos), running GenerateCelebrities.', [
                'attempt' => $generateAttempt,
                'max_retries' => self::MAX_GENERATE_RETRIES,
            ]);

            $job = new GenerateCelebrities;
            $job->handle();

            $eligibleMales = $this->getEligibleMales();
        }

        if ($eligibleMales->isEmpty()) {
            throw new RuntimeException(
                'CreateDailyGame failed: No eligible males (with photo and 4+ partners with photos) after '.self::MAX_GENERATE_RETRIES.' GenerateCelebrities run(s) for '.$gameDate->toDateString()
            );
        }

        $answer = $eligibleMales->random();
        $subjects = $answer->relatedSubjects()
            ->whereNotNull('photo_url')
            ->where('photo_url', '!=', '')
            ->inRandomOrder()
            ->limit(4)
            ->get();

        if ($subjects->count() < 4) {
            throw new RuntimeException(
                "CreateDailyGame failed: Male {$answer->name} has fewer than 4 partners with photos for {$gameDate->toDateString()}"
            );
        }

        $game = DailyGame::create([
            'game_date' => $gameDate,
            'answer_id' => $answer->id,
            'type' => $this->type,
        ]);

        $game->subjects()->sync($subjects->pluck('id')->all());

        Log::info("Daily game for '{$gameDate->toDateString()}' created successfully.", [
            'answer' => $answer->name,
            'subjects' => $subjects->pluck('name')->all(),
        ]);
    }
}
