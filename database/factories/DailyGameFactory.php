<?php

namespace Database\Factories;

use App\Models\Celebrity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DailyGame>
 */
class DailyGameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'answer_id' => Celebrity::factory(),
            'game_date' => fake()->unique()->dateTimeBetween('-1 year', '+1 year')->format('Y-m-d'),
        ];
    }
}
