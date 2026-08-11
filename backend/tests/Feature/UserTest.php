<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected function makeAdmin(): User
    {
        return User::create([
            'login' => 'admin',
            'email' => 'admin@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 1,
        ]);
    }

    protected function makeMounter(): User
    {
        return User::create([
            'login' => 'mounter',
            'email' => 'mounter@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 3,
        ]);
    }

    public function test_only_admin_can_list_users(): void
    {
        // Монтажник — 403
        $mounter = $this->makeMounter();
        $tokenM = auth('api')->login($mounter);
        $this->withToken($tokenM)->getJson('/api/users')->assertStatus(403);

        // Админ — 200
        $admin = $this->makeAdmin();
        $tokenA = auth('api')->login($admin);
        $this->withToken($tokenA)->getJson('/api/users')->assertOk();
    }

    public function test_admin_can_create_user_with_any_role(): void
    {
        $admin = $this->makeAdmin();
        $token = auth('api')->login($admin);

        $this->withToken($token)->postJson('/api/users', [
            'login' => 'newadmin',
            'email' => 'newadmin@test.local',
            'fio' => 'Новый Админ',
            'passwd' => 'secret',
            'type_user' => 1,
        ])->assertStatus(201);
    }

    public function test_update_user_with_empty_password_keeps_it(): void
    {
        $admin = $this->makeAdmin();
        $mounter = $this->makeMounter();
        $token = auth('api')->login($admin);
        $oldHash = $mounter->passwd;

        $this->withToken($token)->patchJson("/api/users/{$mounter->id}", [
            'fio' => 'Обновлённый',
        ])->assertOk();

        $mounter->refresh();
        $this->assertEquals('Обновлённый', $mounter->fio);
        $this->assertEquals($oldHash, $mounter->passwd, 'Пустой passwd не должен менять пароль');
    }

    public function test_admin_cannot_delete_self(): void
    {
        $admin = $this->makeAdmin();
        $token = auth('api')->login($admin);

        $this->withToken($token)->deleteJson("/api/users/{$admin->id}")
            ->assertStatus(422);
    }

    public function test_me_updates_own_profile(): void
    {
        $mounter = $this->makeMounter();
        $token = auth('api')->login($mounter);

        $this->withToken($token)->patchJson('/api/me', [
            'fio' => 'Мой Новый ФИО',
        ])->assertOk()
            ->assertJsonPath('fio', 'Мой Новый ФИО');
    }
}
