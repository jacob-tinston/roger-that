<?php

use App\Models\Celebrity;
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

test('guess returns correct and answer when guess matches', function () {
    $celebrity = Celebrity::factory()->create(['name' => 'Ben Affleck', 'birth_year' => 1972]);
    DailyGame::factory()->create([
        'game_date' => '2024-06-15',
        'answer_id' => $celebrity->id,
    ]);

    $response = $this->postJson(route('game.guess'), [
        'guess' => 'Ben Affleck',
        'game_date' => '2024-06-15',
    ]);

    $response->assertOk();
    $response->assertJson([
        'correct' => true,
        'answer' => [
            'name' => 'Ben Affleck',
            'year' => 1972,
        ],
    ]);
});

test('guess accepts normalized name with extra spaces', function () {
    $celebrity = Celebrity::factory()->create(['name' => 'Ben Affleck', 'birth_year' => 1972]);
    DailyGame::factory()->create([
        'game_date' => '2024-06-15',
        'answer_id' => $celebrity->id,
    ]);

    $response = $this->postJson(route('game.guess'), [
        'guess' => '  Ben   Affleck  ',
        'game_date' => '2024-06-15',
    ]);

    $response->assertOk();
    $response->assertJson(['correct' => true]);
});

test('guess returns correct false and no answer on wrong guess when not last guess', function () {
    $celebrity = Celebrity::factory()->create(['name' => 'Ben Affleck', 'birth_year' => 1972]);
    DailyGame::factory()->create([
        'game_date' => '2024-06-15',
        'answer_id' => $celebrity->id,
    ]);

    $response = $this->postJson(route('game.guess'), [
        'guess' => 'Wrong Name',
        'is_last_guess' => false,
        'game_date' => '2024-06-15',
    ]);

    $response->assertOk();
    $response->assertJson(['correct' => false]);
    $response->assertJsonMissing(['answer']);
});

test('guess returns gameOver and answer when last guess is wrong', function () {
    $celebrity = Celebrity::factory()->create(['name' => 'Ben Affleck', 'birth_year' => 1972]);
    DailyGame::factory()->create([
        'game_date' => '2024-06-15',
        'answer_id' => $celebrity->id,
    ]);

    $response = $this->postJson(route('game.guess'), [
        'guess' => 'Wrong Name',
        'is_last_guess' => true,
        'game_date' => '2024-06-15',
    ]);

    $response->assertOk();
    $response->assertJson([
        'correct' => false,
        'gameOver' => true,
        'answer' => [
            'name' => 'Ben Affleck',
            'year' => 1972,
        ],
    ]);
});

test('guess returns 404 when no game for date', function () {
    $response = $this->postJson(route('game.guess'), [
        'guess' => 'Anyone',
        'game_date' => '1999-01-01',
    ]);

    $response->assertNotFound();
    $response->assertJson(['error' => 'No game or answer for this date']);
});
