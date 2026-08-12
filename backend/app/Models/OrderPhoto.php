<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class OrderPhoto extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'path',
        'uploaded_by',
    ];

    protected $appends = [
        'url',
    ];

    protected $hidden = [
        'order_id',
        'path',
        'uploaded_by',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'uploaded_by' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
