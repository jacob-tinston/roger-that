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
        Schema::table('games_played', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempts')->nullable()->after('success');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('games_played', function (Blueprint $table) {
            $table->dropColumn('attempts');
        });
    }
};
