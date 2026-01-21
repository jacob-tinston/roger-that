<?php

use App\Models\DailyGame;
use Inertia\Testing\AssertableInertia as Assert;

test('game index returns 200 with previousGameUrl when an earlier game exists', function () {
    DailyGame::factory()->create(['game_date' => '2020-01-01']);
    DailyGame::factory()->create(['game_date' => '2020-01-02']);

    $response = $this->get('/daily/2020-01-02');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('game')
        ->has('previousGameUrl')
        ->where('previousGameUrl', route('game', ['date' => '2020-01-01']))
    );
});

test('game index returns previousGameUrl null when viewing the first game', function () {
    DailyGame::factory()->create(['game_date' => '2020-01-01']);

    $response = $this->get('/daily/2020-01-01');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('game')
        ->has('previousGameUrl')
        ->where('previousGameUrl', null)
    );
});

test('game index returns 404 for a date with no game', function () {
    $response = $this->get('/daily/1999-06-15');

    $response->assertNotFound();
});
