<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamesPlayed extends Model
{
    /** @use HasFactory<\Database\Factories\GamesPlayedFactory> */
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'games_played';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'game_id',
        'user_id',
        'success',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'success' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<DailyGame, GamesPlayed>
     */
    public function game(): BelongsTo
    {
        return $this->belongsTo(DailyGame::class, 'game_id');
    }

    /**
     * @return BelongsTo<User, GamesPlayed>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
