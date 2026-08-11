<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Session extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'sessid',
        'time',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'time' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
