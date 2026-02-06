<?php

use App\Contracts\AiProvider;
use App\Jobs\CreateDailyGame;
use App\Models\Celebrity;
use App\Models\DailyGame;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('creates daily game from eligible male in database with 4 partners with photos', function () {
    $answer = Celebrity::factory()->create([
        'name' => 'Johnny Depp',
        'gender' => 'male',
        'photo_url' => 'https://example.com/johnny.jpg',
    ]);

    $subjects = Celebrity::factory()->count(5)->create([
        'gender' => 'female',
        'photo_url' => 'https://example.com/photo.jpg',
    ]);

    foreach ($subjects as $subject) {
        \App\Models\CelebrityRelationship::create([
            'celebrity_1_id' => $answer->id,
            'celebrity_2_id' => $subject->id,
        ]);
    }

    (new CreateDailyGame(Carbon::today()))->handle();

    $game = DailyGame::where('game_date', Carbon::today())->first();
    expect($game)->not->toBeNull();
    expect($game->answer_id)->toBe($answer->id);
    expect($game->answer->name)->toBe('Johnny Depp');
    expect($game->subjects)->toHaveCount(4);
    $subjectIds = $game->subjects->pluck('id')->all();
    foreach ($subjectIds as $id) {
        expect($subjects->pluck('id')->contains($id))->toBeTrue();
    }
});

test('does not pick an answer that has already been used in a previous game', function () {
    $maleA = Celebrity::factory()->create([
        'name' => 'Male A',
        'gender' => 'male',
        'photo_url' => 'https://example.com/a.jpg',
    ]);
    $maleB = Celebrity::factory()->create([
        'name' => 'Male B',
        'gender' => 'male',
        'photo_url' => 'https://example.com/b.jpg',
    ]);

    $partnersA = Celebrity::factory()->count(4)->create(['gender' => 'female', 'photo_url' => 'https://example.com/p.jpg']);
    $partnersB = Celebrity::factory()->count(4)->create(['gender' => 'female', 'photo_url' => 'https://example.com/p.jpg']);

    foreach ($partnersA as $p) {
        \App\Models\CelebrityRelationship::create(['celebrity_1_id' => $maleA->id, 'celebrity_2_id' => $p->id]);
    }
    foreach ($partnersB as $p) {
        \App\Models\CelebrityRelationship::create(['celebrity_1_id' => $maleB->id, 'celebrity_2_id' => $p->id]);
    }

    $yesterday = Carbon::yesterday();
    DailyGame::create([
        'game_date' => $yesterday,
        'answer_id' => $maleA->id,
        'type' => 'celebrity_sh*ggers',
    ]);

    (new CreateDailyGame(Carbon::today()))->handle();

    $todaysGame = DailyGame::where('game_date', Carbon::today())->first();
    expect($todaysGame)->not->toBeNull();
    expect($todaysGame->answer_id)->toBe($maleB->id);
    expect($todaysGame->answer->name)->toBe('Male B');
});

test('skips when game already exists for date', function () {
    $answer = Celebrity::factory()->create([
        'gender' => 'male',
        'photo_url' => 'https://example.com/photo.jpg',
    ]);
    $subjects = Celebrity::factory()->count(4)->create([
        'gender' => 'female',
        'photo_url' => 'https://example.com/photo.jpg',
    ]);
    foreach ($subjects as $s) {
        \App\Models\CelebrityRelationship::create([
            'celebrity_1_id' => $answer->id,
            'celebrity_2_id' => $s->id,
        ]);
    }

    $date = Carbon::today();
    DailyGame::create([
        'game_date' => $date,
        'answer_id' => $answer->id,
        'type' => 'celebrity_sh*ggers',
    ]);

    (new CreateDailyGame($date))->handle();

    expect(DailyGame::where('game_date', $date)->count())->toBe(1);
});

test('runs GenerateCelebrities when no eligible males then creates game', function () {
    \Illuminate\Support\Facades\Http::fake(fn () => \Illuminate\Support\Facades\Http::response([
        'thumbnail' => ['source' => 'https://upload.wikimedia.org/example.jpg'],
    ], 200));

    Setting::updateOrCreate(['key' => 'CELEBRITIES_SYSTEM_PROMPT'], ['value' => 'System']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_USER_PROMPT'], ['value' => 'User [INSERT_EXCLUDED_NAMES_HERE]']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT'], ['value' => 'Relationships system']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_USER_PROMPT'], ['value' => 'Relationships [INSERT_CELEBRITY_NAMES_HERE]. Exclude: [INSERT_EXCLUDED_NAMES_HERE]']);

    $malesJson = '[{"name":"Brad Pitt","birth_year":1963,"gender":"male","tagline":"Leading man."}]';
    $relationshipsJson = '[{"celebrity_name":"Brad Pitt","relationships":['.
        '{"name":"Jennifer Aniston","birth_year":1969,"gender":"female","tagline":"America\'s sweetheart."},'.
        '{"name":"Angelina Jolie","birth_year":1975,"gender":"female","tagline":"Tomb Raider."},'.
        '{"name":"Gwyneth Paltrow","birth_year":1972,"gender":"female","tagline":"Goop queen."},'.
        '{"name":"Juliette Lewis","birth_year":1973,"gender":"female","tagline":"90s icon."}'.
    ']}]';

    $callCount = 0;
    $fakeProvider = new class($malesJson, $relationshipsJson, $callCount) implements AiProvider
    {
        public function __construct(
            private string $malesJson,
            private string $relationshipsJson,
            private int &$callCount
        ) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            $this->callCount++;

            return $this->callCount === 1 ? $this->malesJson : $this->relationshipsJson;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame(Carbon::today()))->handle();

    $game = DailyGame::where('game_date', Carbon::today())->first();
    expect($game)->not->toBeNull();
    expect($game->answer->name)->toBe('Brad Pitt');
    expect($game->subjects)->toHaveCount(4);
});

test('throws when no eligible males after max GenerateCelebrities retries', function () {
    \Illuminate\Support\Facades\Http::fake(fn () => \Illuminate\Support\Facades\Http::response([], 404));

    Setting::updateOrCreate(['key' => 'CELEBRITIES_SYSTEM_PROMPT'], ['value' => 'System']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_USER_PROMPT'], ['value' => 'User [INSERT_EXCLUDED_NAMES_HERE]']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT'], ['value' => 'Relationships system']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_USER_PROMPT'], ['value' => 'Relationships [INSERT_CELEBRITY_NAMES_HERE]. Exclude: [INSERT_EXCLUDED_NAMES_HERE]']);

    $malesJson = '[{"name":"NoPhoto Guy","birth_year":1980,"gender":"male","tagline":"No pic."}]';
    $fakeProvider = new class($malesJson) implements AiProvider
    {
        public function __construct(private string $malesJson) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            return $this->malesJson;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame(Carbon::today()))->handle();
})->throws(\RuntimeException::class, 'No eligible males');
