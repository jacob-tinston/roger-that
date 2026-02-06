<?php

use App\Contracts\AiProvider;
use App\Jobs\GenerateCelebrities;
use App\Models\Celebrity;
use App\Models\CelebrityRelationship;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Http::fake(fn () => Http::response([
        'thumbnail' => ['source' => 'https://upload.wikimedia.org/example.jpg'],
    ], 200));

    Setting::updateOrCreate(['key' => 'CELEBRITIES_SYSTEM_PROMPT'], ['value' => 'System']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_USER_PROMPT'], ['value' => 'User [INSERT_EXCLUDED_NAMES_HERE]']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT'], ['value' => 'Relationships system']);
    Setting::updateOrCreate(['key' => 'CELEBRITIES_RELATIONSHIPS_USER_PROMPT'], ['value' => 'Relationships [INSERT_CELEBRITY_NAMES_HERE]. Exclude: [INSERT_EXCLUDED_NAMES_HERE]']);
});

test('creates male celebrities and then fetches relationships and partner headshots', function (): void {
    $malesJson = '[{"name":"Brad Pitt","birth_year":1963,"gender":"male","tagline":"Leading man."},{"name":"George Clooney","birth_year":1961,"gender":"male","tagline":"Silver fox."}]';
    $relationshipsJson = '[{"celebrity_name":"Brad Pitt","relationships":[{"name":"Jennifer Aniston","birth_year":1969,"gender":"female","tagline":"America\'s sweetheart."},{"name":"Angelina Jolie","birth_year":1975,"gender":"female","tagline":"Tomb Raider."}]},{"celebrity_name":"George Clooney","relationships":[{"name":"Amal Clooney","birth_year":1978,"gender":"female","tagline":"Human rights lawyer."}]}]';

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

    (new GenerateCelebrities)->handle();

    expect(Celebrity::where('gender', 'male')->count())->toBe(2);
    $brad = Celebrity::where('name', 'Brad Pitt')->first();
    $george = Celebrity::where('name', 'George Clooney')->first();
    expect($brad)->not->toBeNull();
    expect($george)->not->toBeNull();
    expect($brad->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');

    expect(Celebrity::whereIn('name', ['Jennifer Aniston', 'Angelina Jolie', 'Amal Clooney'])->count())->toBe(3);
    $jennifer = Celebrity::where('name', 'Jennifer Aniston')->first();
    expect($jennifer->birth_year)->toBe(1969);
    expect($jennifer->gender)->toBe('female');
    expect($jennifer->tagline)->toBe('America\'s sweetheart.');
    expect($jennifer->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');

    expect(CelebrityRelationship::count())->toBe(3);
    $this->assertDatabaseHas('celebrity_relationships', [
        'celebrity_1_id' => $brad->id,
        'celebrity_2_id' => $jennifer->id,
    ]);
});

test('passes women without valid photo as exclusion list in relationships prompt', function (): void {
    $malesJson = '[{"name":"Brad Pitt","birth_year":1963,"gender":"male","tagline":"Leading man."}]';
    $relationshipsJson = '[{"celebrity_name":"Brad Pitt","relationships":[{"name":"Jennifer Aniston","birth_year":1969,"gender":"female","tagline":"New partner."}]}]';

    Http::fake(fn () => Http::response(['thumbnail' => ['source' => 'https://example.jpg']], 200));
    Celebrity::factory()->create(['name' => 'Excluded Woman', 'gender' => 'female', 'photo_url' => null]);

    $userPromptReceived = [];
    $callCount = 0;
    $fakeProvider = new class($malesJson, $relationshipsJson, $userPromptReceived, $callCount) implements AiProvider
    {
        public function __construct(
            private string $malesJson,
            private string $relationshipsJson,
            private array &$userPromptReceived,
            private int &$callCount
        ) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            $this->userPromptReceived[] = $userPrompt;
            $this->callCount++;

            return $this->callCount === 1 ? $this->malesJson : $this->relationshipsJson;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new GenerateCelebrities)->handle();

    expect($userPromptReceived)->toHaveCount(2);
    expect($userPromptReceived[1])->toContain('Excluded Woman');
});

test('skips relationships when no males have valid photo', function (): void {
    Http::fake([
        '*' => Http::response([], 404),
    ]);

    $malesJson = '[{"name":"Brad Pitt","birth_year":1963,"gender":"male","tagline":"Leading man."}]';
    $fakeProvider = new class($malesJson) implements AiProvider
    {
        public function __construct(private string $malesJson) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            return $this->malesJson;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new GenerateCelebrities)->handle();

    expect(Celebrity::where('gender', 'male')->count())->toBe(1);
    expect(CelebrityRelationship::count())->toBe(0);
});
