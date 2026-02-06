<?php

namespace App\Services;

use Anthropic\Client as AnthropicClient;
use App\Contracts\AiProvider;
use Illuminate\Support\Facades\Log;

class AnthropicAiProvider implements AiProvider
{
    public function __construct(
        private AnthropicClient $client
    ) {}

    public function generate(string $systemPrompt, string $userPrompt, string $model): string
    {
        $message = $this->client->messages->create([
            'model' => $model,
            'max_tokens' => 10000,
            'system' => $systemPrompt,
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
            Log::warning('AnthropicAiProvider: Response had no text blocks', [
                'content_block_count' => count($message->content),
            ]);
            throw new \RuntimeException('Anthropic response had no text blocks');
        }

        // Log::info('AnthropicAiProvider: AI response received', [
        //     'model' => $model,
        //     'response_length' => strlen($content),
        //     'response_content' => $content,
        // ]);

        return $content;
    }
}
