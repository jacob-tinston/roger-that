<?php

namespace App\Services;

use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Log;
use OpenAI;

class OpenAiProvider implements AiProvider
{
    public function __construct(
        private OpenAI\Client $client
    ) {}

    public function generate(string $systemPrompt, string $userPrompt, string $model): string
    {
        $response = $this->client->chat()->create([
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'max_tokens' => 2048,
        ]);

        $content = $response->choices[0]->message->content ?? '';

        if ($content === '') {
            Log::warning('OpenAiProvider: Response had no content', [
                'choices_count' => count($response->choices ?? []),
            ]);
            throw new \RuntimeException('OpenAI response had no content');
        }

        Log::info('OpenAiProvider: AI response received', [
            'model' => $model,
            'response_length' => strlen($content),
            'response_content' => $content,
        ]);

        return $content;
    }
}
