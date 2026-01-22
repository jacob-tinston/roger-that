<?php

use App\Contracts\AiProvider;
use App\Jobs\CreateDailyGame;
use App\Models\DailyGame;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::fake(fn () => Http::response([
        'thumbnail' => ['source' => 'https://upload.wikimedia.org/example.jpg'],
    ], 200));

    Setting::updateOrCreate(['key' => 'SYSTEM_PROMPT'], ['value' => 'Test system prompt']);
    Setting::updateOrCreate(['key' => 'USER_PROMPT'], ['value' => 'Test user prompt [INSERT_EXCLUDED_NAMES_HERE]']);
});

test('creates daily game from Anthropic response with Wikipedia photos', function () {
    $json = '{"answer":{"name":"Johnny Depp","birth_year":1963,"gender":"male","tagline":"Genre-hopping leading man."},"subjects":[{"name":"Winona Ryder","birth_year":1971,"gender":"female","tagline":"Oscar-nominated 90s icon."},{"name":"Kate Moss","birth_year":1974,"gender":"female","tagline":"Runway to cultural fixture."},{"name":"Amber Heard","birth_year":1986,"gender":"female","tagline":"Actor and activist."},{"name":"Vanessa Paradis","birth_year":1972,"gender":"female","tagline":"French singer and style icon."}]}';

    $fakeProvider = new class($json) implements AiProvider
    {
        public function __construct(private string $json) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            return $this->json;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame)->handle();

    $game = DailyGame::whereDate('game_date', Carbon::today())->first();
    expect($game)->not->toBeNull();
    expect($game->answer->name)->toBe('Johnny Depp');
    expect($game->answer->birth_year)->toBe(1963);
    expect($game->answer->gender)->toBe('male');
    expect($game->answer->tagline)->toBe('Genre-hopping leading man.');
    expect($game->answer->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');

    $subjects = $game->subjects->sortBy('name')->values();
    expect($subjects)->toHaveCount(4);
    expect($subjects->pluck('name')->all())->toBe(['Amber Heard', 'Kate Moss', 'Vanessa Paradis', 'Winona Ryder']);
    expect($subjects->firstWhere('name', 'Winona Ryder')->tagline)->toBe('Oscar-nominated 90s icon.');
    expect($subjects->first()->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');
});

test('throws when Anthropic throws', function () {
    $fakeProvider = new class implements AiProvider
    {
        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            throw new \Exception('API error');
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame)->handle();
})->throws(\Exception::class, 'API error');

test('when Anthropic throws, no daily game is created', function () {
    $fakeProvider = new class implements AiProvider
    {
        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            throw new \Exception('API error');
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    try {
        (new CreateDailyGame)->handle();
    } catch (\Throwable) {
        // expected
    }

    expect(DailyGame::whereDate('game_date', Carbon::today())->first())->toBeNull();
});

test('throws when Anthropic returns invalid JSON', function () {
    $fakeProvider = new class implements AiProvider
    {
        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            return 'not valid json';
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame)->handle();
})->throws(\RuntimeException::class, 'no valid game data');

test('retries when celebrities do not have images available', function () {
    // Track which celebrities we've tried to fetch images for
    $imageFetchAttempts = [];

    // Clear any existing HTTP fakes and set up a new one for this test
    Http::preventStrayRequests();
    Http::fake(function ($request) use (&$imageFetchAttempts) {
        $url = $request->url();
        $imageFetchAttempts[] = $url;

        // First attempt celebrities don't have images (check for names with underscores as they appear in URLs)
        if (str_contains($url, 'Unknown_Celebrity') ||
            str_contains($url, 'Unknown_Subject_1') ||
            str_contains($url, 'Unknown_Subject_2') ||
            str_contains($url, 'Unknown_Subject_3') ||
            str_contains($url, 'Unknown_Subject_4')) {
            return Http::response(['error' => 'Not found'], 404);
        }

        // Second attempt celebrities have images
        return Http::response([
            'thumbnail' => ['source' => 'https://upload.wikimedia.org/example.jpg'],
        ], 200);
    });

    $firstJson = '{"answer":{"name":"Unknown Celebrity","birth_year":1980,"gender":"male","tagline":"Mystery man."},"subjects":[{"name":"Unknown Subject 1","birth_year":1985,"gender":"female","tagline":"Unknown person."},{"name":"Unknown Subject 2","birth_year":1986,"gender":"female","tagline":"Unknown person."},{"name":"Unknown Subject 3","birth_year":1987,"gender":"female","tagline":"Unknown person."},{"name":"Unknown Subject 4","birth_year":1988,"gender":"female","tagline":"Unknown person."}]}';

    $secondJson = '{"answer":{"name":"Johnny Depp","birth_year":1963,"gender":"male","tagline":"Genre-hopping leading man."},"subjects":[{"name":"Winona Ryder","birth_year":1971,"gender":"female","tagline":"Oscar-nominated 90s icon."},{"name":"Kate Moss","birth_year":1974,"gender":"female","tagline":"Runway to cultural fixture."},{"name":"Amber Heard","birth_year":1986,"gender":"female","tagline":"Actor and activist."},{"name":"Vanessa Paradis","birth_year":1972,"gender":"female","tagline":"French singer and style icon."}]}';

    $attemptTracker = new class
    {
        public int $count = 0;
    };

    $fakeProvider = new class($firstJson, $secondJson, $attemptTracker) implements AiProvider
    {
        public function __construct(
            private string $firstJson,
            private string $secondJson,
            private object $attemptTracker
        ) {}

        public function generate(string $systemPrompt, string $userPrompt, string $model): string
        {
            $this->attemptTracker->count++;

            // First attempt returns celebrities without images
            if ($this->attemptTracker->count === 1) {
                return $this->firstJson;
            }

            // Second attempt returns celebrities with images
            return $this->secondJson;
        }
    };
    $this->app->instance(AiProvider::class, $fakeProvider);

    (new CreateDailyGame)->handle();

    $game = DailyGame::whereDate('game_date', Carbon::today())->first();
    expect($game)->not->toBeNull();
    expect($game->answer->name)->toBe('Johnny Depp');
    expect($game->answer->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');

    $subjects = $game->subjects->sortBy('name')->values();
    expect($subjects)->toHaveCount(4);
    expect($subjects->first()->photo_url)->toBe('https://upload.wikimedia.org/example.jpg');

    // Should have retried (attempt count should be 2)
    expect($attemptTracker->count)->toBe(2);

    // Should have tried to fetch images for the unknown celebrities (first attempt)
    expect($imageFetchAttempts)->toContain('https://en.wikipedia.org/api/rest_v1/page/summary/Unknown_Celebrity');
});
