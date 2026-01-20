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
        Schema::create('daily_games', function (Blueprint $table) {
            $table->id();
            $table->string('answer_type')->default('male');
            $table->json('subjects')->nullable();
            $table->json('answer')->nullable();
            $table->date('game_date')->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_games');
    }
};
