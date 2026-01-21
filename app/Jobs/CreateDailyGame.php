<?php

namespace App\Jobs;

use Anthropic\Client as AnthropicClient;
use App\Models\Celebrity;
use App\Models\DailyGame;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class CreateDailyGame implements ShouldQueue
{
    use Queueable;

    private const MODEL = 'claude-haiku-4-5-20251001';

    private const WIKIPEDIA_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

    private const LOG_JOB = 'CreateDailyGame';

    private static function logCtx(array $extra = []): array
    {
        return ['job' => self::LOG_JOB, ...$extra];
    }

    /**
     * System prompt for the guess_connection game: pick a male celebrity who has publicly
     * dated or been linked with 4 others; return JSON with answer + 4 subjects and taglines.
     */
    private static function systemPrompt(): string
    {
        return <<<'PROMPT'
You are a playful, naughty, senior creative tasked with generating a single daily puzzle payload for a cheeky trivia web game. Follow these rules exactly.

Task: Pick ONE well-known male celebrity (the "answer") who has **publicly and verifiably dated or been romantically linked with at least four other well-known people**. Also pick exactly four of those people as the "subjects". Subjects must be a varied mix across professions (actors, musicians, models, athletes, etc.). **Only choose connections that are documented in reliable sources** (Wikipedia, major news outlets, or confirmed interviews). Do not invent links or rely on rumours.

Output format: Respond with valid JSON only, exactly this structure:
{"answer":{"name":"Full Name","birth_year":YYYY,"gender":"male","tagline":"..."},"subjects":[{"name":"Full Name","birth_year":YYYY,"gender":"female","tagline":"..."},{...},{...},{...}]}

Taglines rules (non-negotiable):

- Taglines must be short, witty, cheeky, naughty, and punchy — written in the game voice (tongue-in-cheek, flirty, mischievous).
- Taglines must **never reference relationships, dating, or the answer**. Describe only career, vibe, reputation, or public persona.
- Keep each tagline to 2–7 words, crisp and punchy.
- Avoid cliches, literal job titles, or hints about connections.
- Provide taglines for the answer and all 4 subjects.

Variety & anti-bias rules:

- Prefer answers from different decades, countries, and profile types.
- The four subjects must be diverse in profession and era.
- If the model’s top candidate is an overused pick (e.g., Leonardo DiCaprio, Brad Pitt, Johnny Depp, Tom Cruise), pick a less obvious but equally famous alternative.

Creative constraints & tone:

- The UI voice is like: "Wordle had a shot of tequila and came back rude." Funny, flirty, mischievous, slightly risqué.
- Examples of acceptable taglines:
    - Good: "Margot Robbie: Australia’s finest export" / "Taylor Swift: Writes songs about everyone"
    - Bad: "Dated a pirate" / "His ex from the 90s"
- Ensure taglines are **readable, high-contrast, and visually punchy**.

Data rules:

- Use stage/legal name as on Wikipedia and a four-digit birth year.
- Gender must be "male" for the answer and correct for subjects.
- JSON must be valid and parsable. No extra keys, no comments, no text outside JSON.

Randomness:

- Vary selection strategy: sometimes older-generation leading men, sometimes pop stars, sometimes sports-to-romance crossovers. Don’t be predictable.

Now — produce **only the JSON object** satisfying all the above.
PROMPT;
    }

    /**
     * @param  array<int, string>  $excludeAnswerNames  Answer names to forbid (e.g. last 30 used).
     * @return array{answer: array{name: string, birth_year: int, gender: string, tagline: string}, subjects: array<int, array{name: string, birth_year: int, gender: string, tagline: string}>}|null
     */
    private function fetchGameFromAnthropic(Carbon $gameDate, array $excludeAnswerNames = []): ?array
    {
        $excludeClause = '';
        if (count($excludeAnswerNames) > 0) {
            $excludeClause = ' Do NOT use any of the following as the answer (already used recently or disallowed): '.implode(', ', $excludeAnswerNames).'.';
        }

        $userPrompt = sprintf(
            'Today is %s.

        Generate one daily puzzle using the previously defined rules.

        Requirements (must all be met):
        - Pick one well-known male celebrity (answer) with at least four verified, widely reported romantic links.
        - Select exactly four of those people as subjects.
        - Use only well-documented connections (Wikipedia, major publications, or confirmed interviews).
        If you are unsure about a connection, discard that candidate and choose another.
        - Subjects must be a mix of professions and eras.
        - Avoid obvious or repetitive picks when possible.

        Output rules:
        - Respond with only valid JSON using the agreed structure.
        - No markdown, no commentary, no explanations.%s

        If your first choice violates any rule above, silently choose a different answer and proceed.',
            $gameDate->toDateString(),
            $excludeClause
        );

        Log::info('CreateDailyGame: Anthropic request starting', self::logCtx([
            'model' => self::MODEL,
            'game_date' => $gameDate->toDateString(),
            'exclude_answer_count' => count($excludeAnswerNames),
        ]));

        $client = app(AnthropicClient::class);
        $message = $client->messages->create([
            'model' => self::MODEL,
            'max_tokens' => 2048,
            'system' => self::systemPrompt(),
            'messages' => [
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

        $content = '';
        foreach ($message->content as $block) {
            if (($block->type ?? '') === 'text' && isset($block->text)) {
                $content .= $block->text;
            }
        }
        if ($content === '') {
            Log::warning('CreateDailyGame: Anthropic response had no text blocks', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'content_block_count' => count($message->content),
            ]));

            return null;
        }

        $raw = $content;
        $raw = preg_replace('/^```json\s*/i', '', $raw);
        $raw = preg_replace('/\s*```\s*$/i', '', $raw);
        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            Log::warning('CreateDailyGame: Anthropic response was not valid JSON', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'raw_snippet' => mb_substr($raw, 0, 500),
                'json_error' => json_last_error_msg(),
            ]));

            return null;
        }

        $answer = $decoded['answer'] ?? null;
        $subjects = $decoded['subjects'] ?? null;
        if (! is_array($answer) || ! is_array($subjects) || count($subjects) !== 4) {
            Log::warning('CreateDailyGame: Anthropic JSON failed structure validation', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'has_answer' => is_array($answer),
                'subjects_count' => is_array($subjects) ? count($subjects) : 0,
            ]));

            return null;
        }

        foreach (['name', 'birth_year', 'gender', 'tagline'] as $k) {
            if (! array_key_exists($k, $answer) || (is_string($answer[$k]) && $answer[$k] === '')) {
                Log::warning('CreateDailyGame: Anthropic answer missing or empty required field', self::logCtx([
                    'game_date' => $gameDate->toDateString(),
                    'missing_or_empty' => $k,
                ]));

                return null;
            }
        }
        if (($answer['gender'] ?? '') !== 'male') {
            Log::warning('CreateDailyGame: Anthropic answer gender must be male', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'gender' => $answer['gender'] ?? null,
            ]));

            return null;
        }

        foreach ($subjects as $i => $s) {
            if (! is_array($s)) {
                Log::warning('CreateDailyGame: Anthropic subject is not array', self::logCtx([
                    'game_date' => $gameDate->toDateString(),
                    'subject_index' => $i,
                ]));

                return null;
            }
            foreach (['name', 'birth_year', 'gender', 'tagline'] as $k) {
                if (! array_key_exists($k, $s) || (is_string($s[$k]) && $s[$k] === '')) {
                    Log::warning('CreateDailyGame: Anthropic subject missing or empty required field', self::logCtx([
                        'game_date' => $gameDate->toDateString(),
                        'subject_index' => $i,
                        'missing_or_empty' => $k,
                    ]));

                    return null;
                }
            }
        }

        $answer['birth_year'] = (int) $answer['birth_year'];
        foreach ($subjects as $i => $s) {
            $subjects[$i]['birth_year'] = (int) $s['birth_year'];
        }

        Log::info('CreateDailyGame: Anthropic response parsed successfully', self::logCtx([
            'game_date' => $gameDate->toDateString(),
            'answer_name' => $answer['name'],
        ]));

        return ['answer' => $answer, 'subjects' => $subjects];
    }

    /**
     * Fetch a Wikipedia image URL for a page title (name with spaces → underscores).
     */
    private function fetchWikipediaImageUrl(string $name): ?string
    {
        $title = str_replace(' ', '_', $name);
        $url = self::WIKIPEDIA_SUMMARY_URL.$title;

        Log::debug('CreateDailyGame: Fetching Wikipedia image', self::logCtx(['name' => $name, 'url' => $url]));

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'RogerThat/1.0 ('.config('app.url').')',
                ])
                ->get($url);
        } catch (\Throwable $e) {
            Log::warning('CreateDailyGame: Wikipedia request failed', self::logCtx([
                'name' => $name,
                'url' => $url,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]));

            return null;
        }

        if (! $response->successful()) {
            Log::warning('CreateDailyGame: Wikipedia returned non-2xx', self::logCtx([
                'name' => $name,
                'url' => $url,
                'status' => $response->status(),
            ]));

            return null;
        }

        $data = $response->json();
        if (! is_array($data)) {
            Log::warning('CreateDailyGame: Wikipedia response was not valid JSON', self::logCtx(['name' => $name, 'url' => $url]));

            return null;
        }

        $source = $data['thumbnail']['source'] ?? null;
        $found = is_string($source);

        if ($found) {
            Log::debug('CreateDailyGame: Wikipedia thumbnail found', self::logCtx(['name' => $name, 'source' => $source]));
        } else {
            Log::debug('CreateDailyGame: Wikipedia had no thumbnail', self::logCtx(['name' => $name]));
        }

        return $found ? $source : null;
    }

    /**
     * Ensure a celebrity has a photo from Wikipedia if possible.
     */
    private function ensureCelebrityPhoto(Celebrity $celebrity): void
    {
        if ($celebrity->photo_url !== null) {
            Log::debug('CreateDailyGame: Celebrity already has photo, skipping fetch', self::logCtx([
                'celebrity_id' => $celebrity->id,
                'name' => $celebrity->name,
            ]));

            return;
        }
        $url = $this->fetchWikipediaImageUrl($celebrity->name);
        if ($url === null) {
            return;
        }
        try {
            $celebrity->photo_url = $url;
            $celebrity->save();
            Log::info('CreateDailyGame: Celebrity photo saved', self::logCtx([
                'celebrity_id' => $celebrity->id,
                'name' => $celebrity->name,
                'photo_url' => $url,
            ]));
        } catch (\Throwable $e) {
            Log::warning('CreateDailyGame: Failed to save celebrity photo_url, continuing', self::logCtx([
                'celebrity_id' => $celebrity->id,
                'name' => $celebrity->name,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]));
        }
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $gameDate = Carbon::today();

        Log::info('CreateDailyGame: started', self::logCtx(['game_date' => $gameDate->toDateString()]));

        $excludeNames = DailyGame::query()
            ->where('game_date', '<', $gameDate)
            ->whereNotNull('answer_id')
            ->with('answer')
            ->orderByDesc('game_date')
            ->get()
            ->pluck('answer.name')
            ->filter()
            ->unique()
            ->take(30)
            ->values()
            ->all();

        $data = null;
        try {
            $data = $this->fetchGameFromAnthropic($gameDate, $excludeNames);
        } catch (\Throwable $e) {
            Log::error('CreateDailyGame: Anthropic request threw', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]));
            throw $e;
        }

        if ($data === null) {
            Log::error('CreateDailyGame: no valid game data from Anthropic', self::logCtx([
                'game_date' => $gameDate->toDateString(),
            ]));
            throw new RuntimeException(
                'CreateDailyGame failed: Anthropic returned no valid game data for '.$gameDate->toDateString()
            );
        }

        $answerAttrs = $data['answer'];

        Log::info('CreateDailyGame: Upserting answer celebrity', self::logCtx([
            'game_date' => $gameDate->toDateString(),
            'name' => $answerAttrs['name'],
        ]));
        $answer = Celebrity::firstOrCreate(
            ['name' => $answerAttrs['name']],
            [
                'birth_year' => $answerAttrs['birth_year'],
                'gender' => $answerAttrs['gender'],
                'tagline' => $answerAttrs['tagline'],
                'photo_url' => null,
            ]
        );
        $this->ensureCelebrityPhoto($answer);

        $subjectIds = [];
        foreach ($data['subjects'] as $i => $s) {
            Log::info('CreateDailyGame: Upserting subject celebrity', self::logCtx([
                'game_date' => $gameDate->toDateString(),
                'index' => $i,
                'name' => $s['name'],
            ]));
            $cel = Celebrity::firstOrCreate(
                ['name' => $s['name']],
                [
                    'birth_year' => $s['birth_year'],
                    'gender' => $s['gender'],
                    'tagline' => $s['tagline'],
                    'photo_url' => null,
                ]
            );
            $this->ensureCelebrityPhoto($cel);
            $subjectIds[] = $cel->id;
        }

        Log::info('CreateDailyGame: Upserting DailyGame', self::logCtx([
            'game_date' => $gameDate->toDateString(),
            'answer_id' => $answer->id,
            'subject_ids' => $subjectIds,
        ]));
        $game = DailyGame::firstOrCreate(
            ['game_date' => $gameDate],
            ['answer_id' => $answer->id]
        );

        $game->answer_id = $answer->id;
        $game->save();

        $game->subjects()->sync($subjectIds);

        Log::info('CreateDailyGame: completed successfully', self::logCtx([
            'game_date' => $gameDate->toDateString(),
            'daily_game_id' => $game->id,
        ]));
    }

    /**
     * Called when the job has failed (e.g. after all retries). Logs the exception.
     */
    public function failed(\Throwable $e): void
    {
        Log::error('CreateDailyGame: job failed', self::logCtx([
            'game_date' => Carbon::today()->toDateString(),
            'exception' => $e::class,
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]));
    }
}
