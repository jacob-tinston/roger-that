<?php

namespace App\Http\Controllers;

use App\Jobs\CreateDailyGame;
use App\Models\DailyGame;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    /**
     * Show the daily game. Ensures today's game exists, passes subjects to the frontend (answer is never sent).
     */
    public function index(): Response|JsonResponse
    {
        $game = DailyGame::whereDate('game_date', today())
            ->with('subjects')
            ->first();

        if (! $game) {
            (new CreateDailyGame)->handle();
            $game = DailyGame::whereDate('game_date', today())
                ->with('subjects')
                ->firstOrFail();
        }

        $subjects = $game->subjects->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'year' => $s->birth_year,
            'hint' => $s->tagline ?? '',
        ]);

        return Inertia::render('game', [
            'subjects' => $subjects->values()->all(),
            'gameDate' => $game->game_date->toDateString(),
            'guessUrl' => route('game.guess'),
        ]);
    }

    /**
     * Check a guess. Answer is only returned when correct or when the game is over (last guess was wrong).
     */
    public function guess(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'guess' => 'required|string|max:255',
            'is_last_guess' => 'sometimes|boolean',
        ]);

        $game = DailyGame::whereDate('game_date', today())
            ->with('answer')
            ->first();

        if (! $game || ! $game->answer) {
            return response()->json(['error' => 'No game or answer for today'], 404);
        }

        $correct = strcasecmp(trim($valid['guess']), $game->answer->name) === 0;
        $gameOver = (bool) ($valid['is_last_guess'] ?? false) && ! $correct;

        $payload = ['correct' => $correct];
        if ($correct || $gameOver) {
            $payload['answerName'] = $game->answer->name;
        }
        if ($gameOver) {
            $payload['gameOver'] = true;
        }

        return response()->json($payload);
    }
}
