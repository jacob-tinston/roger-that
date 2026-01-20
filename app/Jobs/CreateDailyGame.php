<?php

namespace App\Jobs;

use App\Models\DailyGame;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $gameDate = Carbon::today();

        DailyGame::firstOrCreate(
            ['game_date' => $gameDate],
            [
                'answer_type' => 'male',
                'subjects' => [],
                'answer' => [],
            ]
        );
    }
}
