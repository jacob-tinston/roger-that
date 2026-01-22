<?php

namespace App\Http\Controllers;

use App\Models\DailyGame;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
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

        $correct = strcasecmp(trim($valid['guess']), $game->answer->name) === 0;
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
        }
        if ($gameOver) {
            $payload['gameOver'] = true;
        }

        return response()->json($payload);
    }

    /**
     * Show all previous games for the dashboard.
     */
    public function dashboard(): Response
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
                    'answer' => $game->answer ? [
                        'name' => $game->answer->name,
                        'year' => $game->answer->birth_year,
                        'tagline' => $game->answer->tagline ?? '',
                        'photo_url' => $game->answer->photo_url,
                    ] : null,
                    'subjects' => $game->subjects->map(fn ($subject) => $subject->name)->all(),
                    'url' => route('game', ['date' => $game->game_date->format('Y-m-d')]),
                ];
            });

        return Inertia::render('dashboard', [
            'games' => $games->values()->all(),
        ]);
    }
}
