<?php

namespace Database\Seeders;

use App\Models\DailyGame;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'User']);

        if (! User::where('email', 'admin@playrogerthat.com')->exists()) {
            User::factory()->create([
                'name' => 'RogerThat Admin',
                'email' => 'admin@playrogerthat.com',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
            ]);
        }

        // Update all DailyGame records with type 'guess_connection' to 'celebrity_sh*ggers'
        DailyGame::where('type', 'guess_connection')
            ->update(['type' => 'celebrity_sh*ggers']);

        $this->call(SettingsSeeder::class);
    }
}
