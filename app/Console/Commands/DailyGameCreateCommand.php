<?php

namespace App\Console\Commands;

use App\Jobs\CreateDailyGame;
use App\Models\DailyGame;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class DailyGameCreateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'daily-game:create {--date= : The date for the game (Y-m-d format). Defaults to today} {--queue : Dispatch to the queue instead of running immediately}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create the daily game for today or a specified date';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dateInput = $this->option('date');
        $gameDate = $dateInput ? Carbon::parse($dateInput) : Carbon::today();

        if (DailyGame::where('game_date', $gameDate)->exists()) {
            $this->info('A game already exists for '.$gameDate->toDateString().'.');

            return self::SUCCESS;
        }

        if ($this->option('queue')) {
            CreateDailyGame::dispatch($gameDate);
            $this->info('CreateDailyGame job dispatched to the queue for '.$gameDate->toDateString().'.');

            return self::SUCCESS;
        }

        (new CreateDailyGame($gameDate))->handle();
        $this->info('Daily game for '.$gameDate->toDateString().' created successfully.');

        return self::SUCCESS;
    }
}
