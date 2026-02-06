<?php

use App\Models\Celebrity;
use App\Models\DailyGame;
use Database\Seeders\CelebrityRelationshipsSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    $this->seed = new CelebrityRelationshipsSeeder;
});

it('creates relationships from past games with answer and subjects', function (): void {
    $answer = Celebrity::factory()->create();
    $subject1 = Celebrity::factory()->create();
    $subject2 = Celebrity::factory()->create();

    $game = DailyGame::factory()->create(['answer_id' => $answer->id, 'game_date' => '2025-01-01']);
    $game->subjects()->attach([$subject1->id, $subject2->id]);

    $this->seed->run();

    expect(DB::table('celebrity_relationships')->count())->toBe(2);

    $pairs = DB::table('celebrity_relationships')
        ->select('celebrity_1_id', 'celebrity_2_id')
        ->orderBy('celebrity_2_id')
        ->get();

    expect($pairs->pluck('celebrity_1_id')->unique()->toArray())->toBe([$answer->id]);
    expect($pairs->pluck('celebrity_2_id')->sort()->values()->toArray())->toBe([$subject1->id, $subject2->id]);
});

it('ignores duplicate answer-subject pairs across games', function (): void {
    $answer = Celebrity::factory()->create();
    $subject = Celebrity::factory()->create();

    DailyGame::factory()->create(['answer_id' => $answer->id, 'game_date' => '2025-01-01'])
        ->subjects()->attach([$subject->id]);
    DailyGame::factory()->create(['answer_id' => $answer->id, 'game_date' => '2025-01-02'])
        ->subjects()->attach([$subject->id]);

    $this->seed->run();

    expect(DB::table('celebrity_relationships')->count())->toBe(1);
});

it('skips games without an answer', function (): void {
    $game = DailyGame::factory()->create(['answer_id' => null, 'game_date' => '2025-01-01']);
    $subject = Celebrity::factory()->create();
    $game->subjects()->attach([$subject->id]);

    $this->seed->run();

    expect(DB::table('celebrity_relationships')->count())->toBe(0);
});
