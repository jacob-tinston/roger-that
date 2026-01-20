<?php

use App\Jobs\CreateDailyGame;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new CreateDailyGame)->dailyAt('00:00');
