<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('daily_game_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_game_id')->constrained('daily_games')->cascadeOnDelete();
            $table->foreignId('celebrity_id')->constrained('celebrities')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['daily_game_id', 'celebrity_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_game_subject');
    }
};
