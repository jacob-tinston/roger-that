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
        Schema::create('celebrity_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('celebrity_1_id')->constrained('celebrities')->cascadeOnDelete();
            $table->foreignId('celebrity_2_id')->constrained('celebrities')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['celebrity_1_id', 'celebrity_2_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('celebrity_relationships');
    }
};
