<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Celebrity>
 */
class CelebrityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'birth_year' => (int) fake()->year(),
            'gender' => fake()->randomElement(['male', 'female']),
            'tagline' => fake()->optional()->sentence(),
            'photo_url' => fake()->optional()->imageUrl(200, 200, 'people'),
        ];
    }
}
