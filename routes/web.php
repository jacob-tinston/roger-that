<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('game');
})->name('home');

Route::get('daily', function () {
    return Inertia::render('game');
})->name('game');

Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::get('admin', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
