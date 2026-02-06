<?php

namespace App\Http\Controllers;

use App\Http\Requests\Admin\StoreManualGameRequest;
use App\Http\Requests\Admin\UpdateGameRequest;
use App\Jobs\CreateDailyGame;
use App\Models\Celebrity;
use App\Models\DailyGame;
use App\Models\GamesPlayed;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class GameController extends Controller
{
    /**
     * Show the homepage.
     */
    public function home(): Response
    {
        return Inertia::render('home');
    }

    /**
     * Show the daily game. For today, shows "no game" message if none exists; for a specific date, 404 if missing.
     * Passes subjects to the frontend (answer is never sent) and previousGameUrl when an earlier game exists.
     */
    public function index(?string $date = null): Response|JsonResponse
    {
        $isToday = $date === null;
        $gameDate = $isToday ? today() : \Carbon\Carbon::parse($date)->startOfDay();

        if ($gameDate->isFuture()) {
            abort(404);
        }

        $game = DailyGame::whereDate('game_date', $gameDate)
            ->with('subjects')
            ->first();

        if (! $game) {
            if ($isToday) {
                // Don't create game automatically - just show "no game for today" message
                $previous = DailyGame::where('game_date', '<', $gameDate)
                    ->orderByDesc('game_date')
                    ->first();

                $previousGameUrl = $previous
                    ? route('game', ['date' => $previous->game_date->format('Y-m-d')])
                    : null;

                $canonicalUrl = route('game', ['date' => $gameDate->format('Y-m-d')]);

                return Inertia::render('game', [
                    'subjects' => null,
                    'gameDate' => $gameDate->toDateString(),
                    'guessUrl' => route('game.guess'),
                    'previousGameUrl' => $previousGameUrl,
                    'settings' => [],
                    'noGame' => true,
                    'canonicalUrl' => $canonicalUrl,
                    'appUrl' => config('app.url'),
                ]);
            } else {
                abort(404);
            }
        }

        $subjects = $game->subjects->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'year' => $s->birth_year,
            'hint' => $s->tagline ?? '',
            'photo_url' => $s->photo_url,
        ]);

        $previous = DailyGame::where('game_date', '<', $game->game_date)
            ->orderByDesc('game_date')
            ->first();

        $previousGameUrl = $previous
            ? route('game', ['date' => $previous->game_date->format('Y-m-d')])
            : null;

        $gameSettings = Setting::whereIn('key', [
            'SUBTITLES',
            'REACTIONS',
            'BUTTON_COPY',
            'WIN_CAPTIONS',
            'WIN_SUB_CAPTIONS',
            'LOSE_CAPTIONS',
            'LOSE_SUB_CAPTIONS',
        ])->get()->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->value];
        })->toArray();

        $canonicalUrl = route('game', ['date' => $game->game_date->format('Y-m-d')]);

        return Inertia::render('game', [
            'subjects' => $subjects->values()->all(),
            'gameDate' => $game->game_date->toDateString(),
            'guessUrl' => route('game.guess'),
            'previousGameUrl' => $previousGameUrl,
            'settings' => [
                'SUBTITLES' => $gameSettings['SUBTITLES'] ?? [],
                'REACTIONS' => $gameSettings['REACTIONS'] ?? ['wrong' => [], 'close' => []],
                'BUTTON_COPY' => $gameSettings['BUTTON_COPY'] ?? [],
                'WIN_CAPTIONS' => $gameSettings['WIN_CAPTIONS'] ?? [],
                'WIN_SUB_CAPTIONS' => $gameSettings['WIN_SUB_CAPTIONS'] ?? [],
                'LOSE_CAPTIONS' => $gameSettings['LOSE_CAPTIONS'] ?? [],
                'LOSE_SUB_CAPTIONS' => $gameSettings['LOSE_SUB_CAPTIONS'] ?? [],
            ],
            'noGame' => false,
            'canonicalUrl' => $canonicalUrl,
            'appUrl' => config('app.url'),
        ]);
    }

    /**
     * Check a guess. Answer is only returned when correct or when the game is over (last guess was wrong).
     * Accepts optional game_date for historical games; defaults to today when omitted.
     */
    public function guess(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'guess' => 'required|string|max:255',
            'is_last_guess' => 'sometimes|boolean',
            'game_date' => 'sometimes|date|before_or_equal:today',
        ]);

        $gameDate = isset($valid['game_date'])
            ? \Carbon\Carbon::parse($valid['game_date'])->startOfDay()
            : today();

        $game = DailyGame::whereDate('game_date', $gameDate)
            ->with('answer')
            ->first();

        if (! $game || ! $game->answer) {
            return response()->json(['error' => 'No game or answer for this date'], 404);
        }

        $guess = trim($valid['guess']);
        $answerName = trim($game->answer->name);
        $correct = $answerName !== '' && strcasecmp($guess, $answerName) === 0;
        $gameOver = (bool) ($valid['is_last_guess'] ?? false) && ! $correct;

        $payload = ['correct' => $correct];
        if ($correct || $gameOver) {
            $a = $game->answer;
            $payload['answer'] = [
                'name' => $a->name,
                'year' => $a->birth_year,
                'tagline' => $a->tagline ?? '',
                'photo_url' => $a->photo_url,
            ];

            // Track the game as played
            GamesPlayed::create([
                'game_id' => $game->id,
                'user_id' => auth()->id(),
                'success' => $correct,
            ]);
        }
        if ($gameOver) {
            $payload['gameOver'] = true;
        }

        return response()->json($payload);
    }

    /**
     * Show recent games for the dashboard (12 most recent).
     */
    public function dashboard(): Response
    {
        $games = DailyGame::query()
            ->where('game_date', '<=', today())
            ->with(['answer', 'subjects'])
            ->withCount([
                'gamesPlayed as plays_count',
                'gamesPlayed as wins_count' => fn ($query) => $query->where('success', true),
            ])
            ->orderByDesc('game_date')
            ->limit(12)
            ->get()
            ->map(function ($game) {
                $plays = (int) $game->plays_count;
                $wins = (int) $game->wins_count;
                $winRate = $plays > 0 ? round(($wins / $plays) * 100, 1) : 0;

                return [
                    'id' => $game->id,
                    'date' => $game->game_date->toDateString(),
                    'formatted_date' => $game->game_date->format('F j, Y'),
                    'answer' => $game->answer ? [
                        'name' => $game->answer->name,
                        'year' => $game->answer->birth_year,
                        'tagline' => $game->answer->tagline ?? '',
                        'photo_url' => $game->answer->photo_url,
                    ] : null,
                    'subjects' => $game->subjects->map(fn ($subject) => $subject->name)->all(),
                    'url' => route('game', ['date' => $game->game_date->format('Y-m-d')]),
                    'plays_count' => $plays,
                    'win_rate' => $winRate,
                ];
            });

        $totalGamesPlayed = GamesPlayed::count();
        $totalWins = GamesPlayed::where('success', true)->count();
        $winRate = $totalGamesPlayed > 0 ? round(($totalWins / $totalGamesPlayed) * 100, 1) : 0;

        $stats = [
            'totalGames' => DailyGame::where('game_date', '<=', today())->count(),
            'gamesPlayed' => $totalGamesPlayed,
            'winRate' => $winRate,
            'totalUsers' => User::count(),
        ];

        return Inertia::render('dashboard', [
            'games' => $games->values()->all(),
            'stats' => $stats,
        ]);
    }

    /**
     * Show paginated list of all previous games.
     */
    public function history(Request $request): Response
    {
        $games = DailyGame::query()
            ->where('game_date', '<=', today())
            ->with('subjects')
            ->orderByDesc('game_date')
            ->paginate(5)
            ->through(function ($game) {
                return [
                    'id' => $game->id,
                    'date' => $game->game_date->toDateString(),
                    'formatted_date' => $game->game_date->format('F j, Y'),
                    'subjects' => $game->subjects->map(fn ($subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'photo_url' => $subject->photo_url,
                    ])->all(),
                    'url' => route('game', ['date' => $game->game_date->format('Y-m-d')]),
                ];
            });

        return Inertia::render('history', [
            'games' => $games,
        ]);
    }

    /**
     * Show all games in a searchable table format.
     */
    public function games(): Response
    {
        $games = DailyGame::query()
            ->where('game_date', '<=', today())
            ->with(['answer', 'subjects'])
            ->orderByDesc('game_date')
            ->get()
            ->map(function ($game) {
                return [
                    'id' => $game->id,
                    'date' => $game->game_date->toDateString(),
                    'formatted_date' => $game->game_date->format('F j, Y'),
                    'type' => $game->type,
                    'answer' => $game->answer ? [
                        'name' => $game->answer->name,
                        'year' => $game->answer->birth_year,
                    ] : null,
                    'subjects' => $game->subjects->map(fn ($subject) => $subject->name)->all(),
                    'url' => route('game', ['date' => $game->game_date->format('Y-m-d')]),
                ];
            });

        $gameTypes = DailyGame::query()
            ->where('game_date', '<=', today())
            ->distinct()
            ->pluck('type')
            ->filter()
            ->values()
            ->all();

        $gameShowUrlTemplate = preg_replace(
            '#/\d+$#',
            '/__ID__',
            route('admin.games.show', ['game' => 0], true)
        );
        $gameUpdateUrlTemplate = preg_replace(
            '#/\d+$#',
            '/__ID__',
            route('admin.games.update', ['game' => 0], true)
        );

        return Inertia::render('admin/games', [
            'games' => $games->values()->all(),
            'gameTypes' => $gameTypes,
            'generateUrl' => route('admin.games.generate'),
            'storeManualUrl' => route('admin.games.storeManual'),
            'gameShowUrlTemplate' => $gameShowUrlTemplate,
            'gameUpdateUrlTemplate' => $gameUpdateUrlTemplate,
            'celebritiesSearchUrl' => route('admin.celebrities.search'),
            'celebritiesRelationshipsUrlTemplate' => preg_replace(
                '#/\d+/relationships$#',
                '/__ID__/relationships',
                route('admin.celebrities.relationships.index', ['celebrity' => 1], true)
            ),
        ]);
    }

    /**
     * Generate a daily game via AI for the given date. Runs synchronously.
     */
    public function generate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'type' => ['nullable', 'string', 'max:255'],
        ]);

        $gameDate = Carbon::parse($validated['date'])->startOfDay();
        $type = $validated['type'] ?? 'celebrity_sh*ggers';

        try {
            (new CreateDailyGame($gameDate, $type))->handle();
        } catch (RuntimeException $e) {
            return redirect()->route('admin.games.index')
                ->with('error', 'Generation failed: '.$e->getMessage());
        }

        return redirect()->route('admin.games.index')
            ->with('success', 'Game for '.$gameDate->format('F j, Y').' created successfully.');
    }

    /**
     * Store a manually created daily game (answer + 4 subjects from relationships).
     */
    public function storeManual(StoreManualGameRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $answer = Celebrity::findOrFail($validated['answer_id']);
        $relatedIds = $answer->relatedSubjects()->get()->pluck('id')->all();

        $invalidSubjects = array_diff($validated['subject_ids'], $relatedIds);
        if ($invalidSubjects !== []) {
            return redirect()->back()
                ->withErrors(['subject_ids' => 'All 4 subjects must be from this answer\'s saved relationships.'])
                ->withInput();
        }

        $game = DailyGame::create([
            'game_date' => $validated['game_date'],
            'type' => $validated['type'],
            'answer_id' => $validated['answer_id'],
        ]);

        $game->subjects()->sync($validated['subject_ids']);

        return redirect()->route('admin.games.index')
            ->with('success', 'Game created successfully.');
    }

    /**
     * Get a single game's details for the admin edit modal (JSON).
     */
    public function show(DailyGame $game): JsonResponse
    {
        $game->load(['answer', 'subjects']);
        $game->loadCount([
            'gamesPlayed as plays_count',
            'gamesPlayed as wins_count' => fn ($query) => $query->where('success', true),
        ]);
        $plays = (int) $game->plays_count;
        $wins = (int) $game->wins_count;
        $winRate = $plays > 0 ? round(($wins / $plays) * 100, 1) : 0;

        $payload = [
            'id' => $game->id,
            'date' => $game->game_date->toDateString(),
            'formatted_date' => $game->game_date->format('F j, Y'),
            'type' => $game->type,
            'url' => route('game', ['date' => $game->game_date->format('Y-m-d')]),
            'answer' => $game->answer ? [
                'id' => $game->answer->id,
                'name' => $game->answer->name,
                'year' => $game->answer->birth_year,
                'photo_url' => $game->answer->photo_url,
            ] : null,
            'subjects' => $game->subjects->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'photo_url' => $s->photo_url,
            ])->values()->all(),
            'plays_count' => $plays,
            'win_rate' => $winRate,
        ];

        return response()->json($payload);
    }

    /**
     * Update a game's answer and subjects.
     */
    public function update(UpdateGameRequest $request, DailyGame $game): JsonResponse
    {
        $validated = $request->validated();
        $answer = Celebrity::findOrFail($validated['answer_id']);
        $relatedIds = $answer->relatedSubjects()->get()->pluck('id')->all();

        $invalidSubjects = array_diff($validated['subject_ids'], $relatedIds);
        if ($invalidSubjects !== []) {
            return response()->json(
                ['message' => 'All 4 subjects must be from this answer\'s saved relationships.'],
                422
            );
        }

        $game->update(['answer_id' => $validated['answer_id']]);
        $game->subjects()->sync($validated['subject_ids']);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a daily game.
     */
    public function destroy(DailyGame $game): RedirectResponse
    {
        // Delete associated games played records
        GamesPlayed::where('game_id', $game->id)->delete();

        // Detach subjects (pivot table relationships)
        $game->subjects()->detach();

        // Delete the game (answer_id is just a foreign key, celebrities remain)
        $game->delete();

        return redirect()->route('admin.games.index')->with('success', 'Game deleted successfully.');
    }
}
