<?php

namespace App\Contracts;

/**
 * Interface for AI providers that can generate game data.
 */
interface AiProvider
{
    /**
     * Generate game data from the AI provider.
     *
     * @param  string  $systemPrompt  The system prompt to use
     * @param  string  $userPrompt  The user prompt
     * @param  string  $model  The model to use
     * @return string The raw text response from the AI
     *
     * @throws \Throwable
     */
    public function generate(string $systemPrompt, string $userPrompt, string $model): string;
}
