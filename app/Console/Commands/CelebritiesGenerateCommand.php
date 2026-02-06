<?php

namespace App\Console\Commands;

use App\Jobs\GenerateCelebrities;
use Illuminate\Console\Command;

class CelebritiesGenerateCommand extends Command
{
    protected $signature = 'celebrities:generate {--queue : Dispatch to the queue instead of running immediately}';

    protected $description = 'Generate up to 10 male celebrities (with 5+ verified relationships) via AI and save them with Wikipedia thumbnails';

    public function handle(): int
    {
        if ($this->option('queue')) {
            GenerateCelebrities::dispatch();
            $this->info('GenerateCelebrities job dispatched to the queue.');

            return self::SUCCESS;
        }

        (new GenerateCelebrities)->handle();
        $this->info('Celebrities generated successfully.');

        return self::SUCCESS;
    }
}
