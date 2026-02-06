<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CelebrityRelationship extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'celebrity_1_id',
        'celebrity_2_id',
    ];

    /**
     * @return BelongsTo<Celebrity, CelebrityRelationship>
     */
    public function celebrity1(): BelongsTo
    {
        return $this->belongsTo(Celebrity::class, 'celebrity_1_id');
    }

    /**
     * @return BelongsTo<Celebrity, CelebrityRelationship>
     */
    public function celebrity2(): BelongsTo
    {
        return $this->belongsTo(Celebrity::class, 'celebrity_2_id');
    }
}
