<?php

namespace App\Console\Commands;

use App\Jobs\CreateDailyGame;
use Illuminate\Console\Command;

class DailyGameCreateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'daily-game:create {--queue : Dispatch to the queue instead of running immediately}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create the daily game for today';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('queue')) {
            CreateDailyGame::dispatch();
            $this->info('CreateDailyGame job dispatched to the queue.');

            return self::SUCCESS;
        }

        (new CreateDailyGame)->handle();
        $this->info('Daily game for today created successfully.');

        return self::SUCCESS;
    }
}
