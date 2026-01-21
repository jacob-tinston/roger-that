<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('game');
})->name('home');

Route::get('daily', [GameController::class, 'index'])->name('game');
Route::post('daily/guess', [GameController::class, 'guess'])->name('game.guess');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('admin', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
