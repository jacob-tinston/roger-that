<?php

namespace App\Providers;

use Anthropic\Client as AnthropicClient;
use App\Contracts\AiProvider;
use App\Services\AnthropicAiProvider;
use App\Services\OpenAiProvider;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use OpenAI;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register Anthropic client
        $this->app->singleton(AnthropicClient::class, function () {
            return new AnthropicClient(
                apiKey: config('services.anthropic.api_key')
            );
        });

        // Register OpenAI client
        $this->app->singleton(OpenAI\Client::class, function () {
            return OpenAI::client(config('services.openai.api_key'));
        });

        // Register AI Provider based on environment variable
        $this->app->singleton(AiProvider::class, function () {
            $provider = config('services.ai_provider', 'anthropic');

            return match ($provider) {
                'openai' => new OpenAiProvider(
                    $this->app->make(OpenAI\Client::class)
                ),
                'anthropic' => new AnthropicAiProvider(
                    $this->app->make(AnthropicClient::class)
                ),
                default => new AnthropicAiProvider(
                    $this->app->make(AnthropicClient::class)
                ),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
