<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect()->route('game');
})->name('home');

Route::get('daily', function () {
    return Inertia::render('game');
})->name('game');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('admin', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
