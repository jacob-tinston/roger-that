<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Celebrity extends Model
{
    /** @use HasFactory<\Database\Factories\CelebrityFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'birth_year',
        'gender',
        'tagline',
        'photo_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_year' => 'integer',
        ];
    }

    /**
     * Daily games where this celebrity is the answer.
     *
     * @return HasMany<DailyGame, Celebrity>
     */
    public function dailyGamesAsAnswer(): HasMany
    {
        return $this->hasMany(DailyGame::class, 'answer_id');
    }

    /**
     * Daily games where this celebrity is a subject.
     *
     * @return BelongsToMany<DailyGame, Celebrity>
     */
    public function dailyGamesAsSubject(): BelongsToMany
    {
        return $this->belongsToMany(DailyGame::class, 'daily_game_subject')
            ->withTimestamps();
    }
}
