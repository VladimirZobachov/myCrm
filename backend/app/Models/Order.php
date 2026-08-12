<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'date_create',
        'date',
        'trc',
        'trc_other',
        'type_work',
        'brand',
        'where_print',
        'where_other',
        'photo',
        'price',
        'price_admin',
        'importance',
        'importance_other',
        'created_by',
        'created_for',
        'comments',
        'comment_manager',
        'status',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'date_create' => 'datetime',
            'date' => 'date',
            'price' => 'string',
            'price_admin' => 'string',
            'created_by' => 'integer',
            'created_for' => 'integer',
            'status' => 'integer',
            'is_archived' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdFor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_for');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(OrderPhoto::class);
    }

    /**
     * Ролевая видимость заявок (legacy db.class.php::getRows):
     * админ (1) видит все, менеджер (2) — только свои созданные,
     * монтажник (3) — только назначенные на него.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return match ((int) $user->type_user) {
            1 => $query,
            2 => $query->where('created_by', $user->id),
            3 => $query->where('created_for', $user->id),
            default => $query->whereRaw('1 = 0'),
        };
    }
}
