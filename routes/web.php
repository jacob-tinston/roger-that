<?php

use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GameController::class, 'home'])->name('home');

Route::post('daily/guess', [GameController::class, 'guess'])->name('game.guess');
Route::get('daily/{date?}', [GameController::class, 'index'])->name('game')->where('date', '[0-9]{4}-[0-9]{2}-[0-9]{2}');
Route::get('history', [GameController::class, 'history'])->name('history');

Route::get('sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap');
Route::get('robots.txt', [\App\Http\Controllers\SitemapController::class, 'robots'])->name('robots');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('admin', [GameController::class, 'dashboard'])->name('dashboard');
    Route::get('admin/games', [GameController::class, 'games'])->name('admin.games.index');
    Route::get('admin/games/{game}', [GameController::class, 'show'])->name('admin.games.show');
    Route::patch('admin/games/{game}', [GameController::class, 'update'])->name('admin.games.update');
    Route::post('admin/games/generate', [GameController::class, 'generate'])->name('admin.games.generate');
    Route::post('admin/games/manual', [GameController::class, 'storeManual'])->name('admin.games.storeManual');
    Route::delete('admin/games/{game}', [GameController::class, 'destroy'])->name('admin.games.destroy');

    Route::get('admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])->name('admin.settings.index');
    Route::put('admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])->name('admin.settings.update');

    Route::get('admin/users', [\App\Http\Controllers\Admin\UsersController::class, 'index'])->name('admin.users.index');

    Route::get('admin/celebrities-search', [\App\Http\Controllers\Admin\CelebritiesController::class, 'search'])->name('admin.celebrities.search');
    Route::get('admin/celebrities/{celebrity}/relationships', [\App\Http\Controllers\Admin\CelebritiesController::class, 'relationships'])->name('admin.celebrities.relationships.index');
    Route::resource('admin/celebrities', \App\Http\Controllers\Admin\CelebritiesController::class)->parameters(['celebrities' => 'celebrity'])->names('admin.celebrities');
    Route::post('admin/celebrities/relationships', [\App\Http\Controllers\Admin\CelebrityRelationshipsController::class, 'store'])->name('admin.celebrities.relationships.store');
    Route::put('admin/celebrities/relationships/{celebrity_relationship}', [\App\Http\Controllers\Admin\CelebrityRelationshipsController::class, 'update'])->name('admin.celebrities.relationships.update');
    Route::delete('admin/celebrities/relationships/{celebrity_relationship}', [\App\Http\Controllers\Admin\CelebrityRelationshipsController::class, 'destroy'])->name('admin.celebrities.relationships.destroy');
});

require __DIR__.'/settings.php';
