<?php

use App\Jobs\CreateDailyGame;
use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\DailyGame;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Process;

uses(RefreshDatabase::class);

function validAgentOutput(array $answer = [], array $relationships = []): string
{
    $defaultAnswer = [
        'name' => 'Brad Pitt',
        'birth_year' => 1963,
        'gender' => 'male',
        'tagline' => 'Hollywood leading man',
    ];
    $defaultRels = [
        ['name' => 'Jennifer Aniston', 'birth_year' => 1969, 'gender' => 'female', 'tagline' => 'Friends star', 'citation' => 'https://en.wikipedia.org/wiki/Brad_Pitt'],
        ['name' => 'Angelina Jolie', 'birth_year' => 1975, 'gender' => 'female', 'tagline' => 'Actor', 'citation' => 'https://en.wikipedia.org/wiki/Angelina_Jolie'],
        ['name' => 'Gwyneth Paltrow', 'birth_year' => 1972, 'gender' => 'female', 'tagline' => 'Goop founder', 'citation' => 'https://example.com/gwyneth'],
        ['name' => 'Juliette Lewis', 'birth_year' => 1973, 'gender' => 'female', 'tagline' => 'Actor', 'citation' => 'https://example.com/juliette'],
    ];

    return json_encode([
        'answer' => array_merge($defaultAnswer, $answer),
        'relationships' => $relationships ?: $defaultRels,
    ]);
}

test('skips when game already exists for date', function () {
    $gameDate = Carbon::today();
    DailyGame::factory()->create(['game_date' => $gameDate]);

    Process::fake();

    (new CreateDailyGame($gameDate))->handle();

    Process::assertNothingRan();
    expect(DailyGame::where('game_date', $gameDate)->count())->toBe(1);
});

test('runs game agent script and creates game with answer and four subjects', function () {
    $gameDate = Carbon::today();

    Process::fake([
        '*' => Process::result(output: validAgentOutput()),
    ]);

    (new CreateDailyGame($gameDate))->handle();

    Process::assertRan(fn ($process) => count($process->command ?? []) >= 2 && str_contains(implode(' ', (array) $process->command), 'generate.js'));

    $game = DailyGame::where('game_date', $gameDate)->first();
    expect($game)->not->toBeNull();
    expect($game->answer_id)->not->toBeNull();

    $answer = Celebrity::find($game->answer_id);
    expect($answer->name)->toBe('Brad Pitt');
    expect($answer->birth_year)->toBe(1963);
    expect($answer->gender)->toBe('male');
    expect($answer->tagline)->toBe('Hollywood leading man');

    expect($game->subjects)->toHaveCount(4);
    $subjectNames = $game->subjects->pluck('name')->all();
    expect($subjectNames)->toContain('Jennifer Aniston', 'Angelina Jolie', 'Gwyneth Paltrow', 'Juliette Lewis');

    $relationships = CelebrityRelationship::where('celebrity_1_id', $answer->id)->get();
    expect($relationships)->toHaveCount(4);
    expect($relationships->first()->citation)->toBe('https://en.wikipedia.org/wiki/Brad_Pitt');
});

test('uses existing celebrity when name and birth_year match', function () {
    $gameDate = Carbon::today();
    $existing = Celebrity::factory()->create([
        'name' => 'Brad Pitt',
        'birth_year' => 1963,
        'gender' => 'male',
        'tagline' => 'Existing tagline',
    ]);

    Process::fake([
        '*' => Process::result(output: validAgentOutput(['tagline' => 'New tagline from agent'])),
    ]);

    (new CreateDailyGame($gameDate))->handle();

    expect(Celebrity::where('name', 'Brad Pitt')->count())->toBe(1);
    $game = DailyGame::where('game_date', $gameDate)->first();
    expect($game->answer_id)->toBe($existing->id);
    expect($existing->fresh()->tagline)->toBe('Existing tagline');
    expect($game->subjects)->toHaveCount(4);
});
