<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Order;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'login',
        'email',
        'fio',
        'passwd',
        'type_user',
    ];

    protected $hidden = [
        'passwd',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return ['type_user' => $this->type_user];
    }

    protected function casts(): array
    {
        return [
            'type_user' => 'integer',
        ];
    }

    /**
     * Legacy-совместимость: колонка называется passwd, но пароль можно
     * задавать через виртуальный атрибут password — сохраняется bcrypt-хешем.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['passwd'] = Hash::make($value);
    }

    public function getAuthPassword(): string
    {
        return $this->passwd;
    }

    public function ordersCreated()
    {
        return $this->hasMany(Order::class, 'created_by');
    }

    public function ordersAssigned()
    {
        return $this->hasMany(Order::class, 'created_for');
    }

    public function isAdmin(): bool
    {
        return (int) $this->type_user === 1;
    }

    public function isManager(): bool
    {
        return (int) $this->type_user === 2;
    }

    public function isInstaller(): bool
    {
        return (int) $this->type_user === 3;
    }
}
