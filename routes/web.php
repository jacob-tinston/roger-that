<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('game');
})->name('home');

Route::post('daily/guess', [GameController::class, 'guess'])->name('game.guess');
Route::get('daily/{date?}', [GameController::class, 'index'])->name('game')->where('date', '[0-9]{4}-[0-9]{2}-[0-9]{2}');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('admin', [GameController::class, 'dashboard'])->name('dashboard');

    Route::get('admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('admin.settings.index');
    Route::put('admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('admin.settings.update');
});

require __DIR__.'/settings.php';
