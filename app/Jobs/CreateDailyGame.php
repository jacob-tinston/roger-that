<?php

namespace App\Jobs;

use App\Models\Celebrity;
use App\Models\DailyGame;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    /**
     * Hardcoded seed data for the guess_connection game. Will be replaced with proper logic later.
     *
     * @return array<int, array{name: string, birth_year: int, gender: string, tagline: string|null}>
     */
    protected static function seedCelebrities(): array
    {
        return [
            // Subjects (the four cards)
            ['name' => 'Emma Stone', 'birth_year' => 1988, 'gender' => 'female', 'tagline' => 'Oscar winner, red carpet regular'],
            ['name' => 'Blake Lively', 'birth_year' => 1987, 'gender' => 'female', 'tagline' => 'No stranger to headlines'],
            ['name' => 'Taylor Swift', 'birth_year' => 1989, 'gender' => 'female', 'tagline' => 'Writes songs about everyone'],
            ['name' => 'Margot Robbie', 'birth_year' => 1990, 'gender' => 'female', 'tagline' => "Australia's finest export"],
            // Answer
            ['name' => 'Roger Federer', 'birth_year' => 1981, 'gender' => 'male', 'tagline' => null],
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $gameDate = Carbon::today();

        $celebrities = collect(static::seedCelebrities())->map(fn (array $attrs) => Celebrity::firstOrCreate(
            ['name' => $attrs['name']],
            [
                'birth_year' => $attrs['birth_year'],
                'gender' => $attrs['gender'],
                'tagline' => $attrs['tagline'],
                'photo_url' => null,
            ]
        ));

        $subjects = $celebrities->take(4);
        $answer = $celebrities->last();

        $game = DailyGame::firstOrCreate(
            ['game_date' => $gameDate],
            ['answer_id' => $answer->id]
        );

        $game->answer_id = $answer->id;
        $game->save();

        $game->subjects()->sync($subjects->pluck('id'));
    }
}
