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
        Schema::table('celebrity_relationships', function (Blueprint $table) {
            $table->string('citation', 2048)->nullable()->after('celebrity_2_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('celebrity_relationships', function (Blueprint $table) {
            $table->dropColumn('citation');
        });
    }
};
