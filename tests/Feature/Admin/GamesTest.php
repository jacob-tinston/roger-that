<?php

use App\Models\Celebrity;
use App\Models\DailyGame;
use App\Models\Role;
use App\Models\User;

beforeEach(function (): void {
    Role::create(['name' => 'Admin']);
    Role::create(['name' => 'User']);
    $this->admin = User::factory()->create(['role_id' => 1]);
});

test('admin games index returns create URLs and game types', function (): void {
    $response = $this->actingAs($this->admin)->get(route('admin.games.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/games')
        ->has('games')
        ->has('gameTypes')
        ->has('generateUrl')
        ->has('storeManualUrl')
        ->has('gameShowUrlTemplate')
        ->has('gameUpdateUrlTemplate')
        ->has('celebritiesSearchUrl')
        ->has('celebritiesRelationshipsUrlTemplate')
    );
});

test('admin can create a game manually with answer and four subjects from relationships', function (): void {
    $answer = Celebrity::factory()->create();
    $subjects = Celebrity::factory()->count(4)->create();
    foreach ($subjects as $subject) {
        \App\Models\CelebrityRelationship::create([
            'celebrity_1_id' => $answer->id,
            'celebrity_2_id' => $subject->id,
        ]);
    }

    $gameDate = now()->subDay()->format('Y-m-d');

    $response = $this->actingAs($this->admin)->post(route('admin.games.storeManual'), [
        'game_date' => $gameDate,
        'type' => 'celebrity_sh*ggers',
        'answer_id' => $answer->id,
        'subject_ids' => $subjects->pluck('id')->all(),
    ]);

    $response->assertRedirect(route('admin.games.index'));
    $game = DailyGame::where('answer_id', $answer->id)
        ->where('type', 'celebrity_sh*ggers')
        ->whereDate('game_date', $gameDate)
        ->first();
    expect($game)->not->toBeNull();
    expect($game->subjects)->toHaveCount(4);
});

test('admin can fetch single game for edit modal', function (): void {
    $game = DailyGame::factory()->create(['game_date' => now()->subDay()]);

    $response = $this->actingAs($this->admin)->getJson(route('admin.games.show', $game));

    $response->assertOk();
    $response->assertJsonFragment([
        'id' => $game->id,
        'date' => $game->game_date->toDateString(),
    ]);
    $response->assertJsonStructure(['answer', 'subjects', 'plays_count', 'win_rate', 'url']);
});

test('admin can update game answer and subjects', function (): void {
    $game = DailyGame::factory()->create(['game_date' => now()->subDays(2)]);
    $answer = Celebrity::factory()->create();
    $subjects = Celebrity::factory()->count(4)->create();
    foreach ($subjects as $subject) {
        \App\Models\CelebrityRelationship::create([
            'celebrity_1_id' => $answer->id,
            'celebrity_2_id' => $subject->id,
        ]);
    }

    $response = $this->actingAs($this->admin)->patchJson(route('admin.games.update', $game), [
        'answer_id' => $answer->id,
        'subject_ids' => $subjects->pluck('id')->all(),
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);
    $game->refresh();
    expect($game->answer_id)->toBe($answer->id);
    expect($game->subjects->pluck('id')->all())->toEqual($subjects->pluck('id')->all());
});

test('admin delete game redirects to games index so calendar updates', function (): void {
    $game = DailyGame::factory()->create(['game_date' => now()->subDays(2)]);

    $response = $this->actingAs($this->admin)->delete(route('admin.games.destroy', $game));

    $response->assertRedirect(route('admin.games.index'));
    $this->assertDatabaseMissing('daily_games', ['id' => $game->id]);
});
