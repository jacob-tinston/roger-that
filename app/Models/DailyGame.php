<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DailyGame extends Model
{
    /** @use HasFactory<\Database\Factories\DailyGameFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'answer_id',
        'game_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'game_date' => 'date',
        ];
    }

    /**
     * The celebrity that is the answer for this game.
     *
     * @return BelongsTo<Celebrity, DailyGame>
     */
    public function answer(): BelongsTo
    {
        return $this->belongsTo(Celebrity::class, 'answer_id');
    }

    /**
     * The subject celebrities for this game.
     *
     * @return BelongsToMany<Celebrity, DailyGame>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Celebrity::class, 'daily_game_subject')
            ->withTimestamps();
    }
}
