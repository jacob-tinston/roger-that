<?php

namespace Database\Seeders;

use App\Models\DailyGame;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CelebrityRelationshipsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $games = DailyGame::query()
            ->with('subjects')
            ->whereNotNull('answer_id')
            ->get();

        foreach ($games as $game) {
            foreach ($game->subjects as $subject) {
                DB::table('celebrity_relationships')->insertOrIgnore([
                    'celebrity_1_id' => $game->answer_id,
                    'celebrity_2_id' => $subject->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
