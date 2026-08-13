<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderPosition extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'order_id' => 'integer',
            'position' => 'integer',
        ];
    }
}
