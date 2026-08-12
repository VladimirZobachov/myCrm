<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExportJob extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_DONE = 'done';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'status',
        'file_path',
        'params',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'params' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
