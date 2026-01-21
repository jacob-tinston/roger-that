<?php

use Anthropic\Client as AnthropicClient;
use App\Jobs\CreateDailyGame;
use App\Models\DailyGame;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Http::fake(fn () => Http::response([
        'thumbnail' => ['source' => 'https://upload.wikimedia.org/example.jpg'],
    ], 200));
});

test('creates daily game from Anthropic response with Wikipedia photos', function () {
    $json = '{"answer":{"name":"Johnny Depp","birth_year":1963,"gender":"male","tagline":"Genre-hopping leading man."},"subjects":[{"name":"Winona Ryder","birth_year":1971,"gender":"female","tagline":"Oscar-nominated 90s icon."},{"name":"Kate Moss","birth_year":1974,"gender":"female","tagline":"Runway to cultural fixture."},{"name":"Amber Heard","birth_year":1986,"gender":"female","tagline":"Actor and activist."},{"name":"Vanessa Paradis","birth_year":1972,"gender":"female","tagline":"French singer and style icon."}]}';

    $fakeMessage = (object) [
        'content' => [(object) ['type' => 'text', 'text' => $json]],
    ];
    $fakeMessages = new class($fakeMessage)
    {
        public function __construct(private object $message) {}

        public function create(array $params): object
        {
            return $this->message;
        }
    };
    $fakeClient = new class($fakeMessages)
    {
        public function __construct(public object $messages) {}
    };
    $this->app->instance(AnthropicClient::class, $fakeClient);

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
    $fakeMessages = new class
    {
        public function create(array $params): never
        {
            throw new \Exception('API error');
        }
    };
    $fakeClient = new class($fakeMessages)
    {
        public function __construct(public object $messages) {}
    };
    $this->app->instance(AnthropicClient::class, $fakeClient);

    (new CreateDailyGame)->handle();
})->throws(\Exception::class, 'API error');

test('when Anthropic throws, no daily game is created', function () {
    $fakeMessages = new class
    {
        public function create(array $params): never
        {
            throw new \Exception('API error');
        }
    };
    $fakeClient = new class($fakeMessages)
    {
        public function __construct(public object $messages) {}
    };
    $this->app->instance(AnthropicClient::class, $fakeClient);

    try {
        (new CreateDailyGame)->handle();
    } catch (\Throwable) {
        // expected
    }

    expect(DailyGame::whereDate('game_date', Carbon::today())->first())->toBeNull();
});

test('throws when Anthropic returns invalid JSON', function () {
    $fakeMessage = (object) [
        'content' => [(object) ['type' => 'text', 'text' => 'not valid json']],
    ];
    $fakeMessages = new class($fakeMessage)
    {
        public function __construct(private object $message) {}

        public function create(array $params): object
        {
            return $this->message;
        }
    };
    $fakeClient = new class($fakeMessages)
    {
        public function __construct(public object $messages) {}
    };
    $this->app->instance(AnthropicClient::class, $fakeClient);

    (new CreateDailyGame)->handle();
})->throws(\RuntimeException::class, 'no valid game data');
