<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_bcrypt_password(): void
    {
        User::create([
            'login' => 'admin',
            'email' => 'admin@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 1,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'admin',
            'passwd' => 'secret',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token', 'token_type', 'expires_in', 'user']);
    }

    public function test_login_with_legacy_md5_migrates_to_bcrypt(): void
    {
        User::create([
            'login' => 'legacy',
            'email' => 'legacy@test.local',
            'passwd' => md5('oldpass'), // MD5 из legacy-системы
            'type_user' => 3,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'legacy',
            'passwd' => 'oldpass',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['access_token']);

        // Пароль должен перехэшироваться в bcrypt
        $user = User::where('login', 'legacy')->first();
        $this->assertStringStartsWith('$2y$', $user->passwd, 'Пароль должен мигрировать на bcrypt');
        $this->assertTrue(Hash::check('oldpass', $user->passwd));
    }

    public function test_login_with_wrong_password(): void
    {
        User::create([
            'login' => 'admin',
            'email' => 'admin@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 1,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'admin',
            'passwd' => 'wrong',
        ]);

        $response->assertStatus(401);
    }

    public function test_register_creates_manager_or_mounter_only(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'login' => 'newmounter',
            'email' => 'new@test.local',
            'fio' => 'Новый Монтажник',
            'passwd' => 'test123',
            'type_user' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.type_user', 3);

        // Админ зарегистрироваться не может (type_user=1 запрещён)
        $response = $this->postJson('/api/auth/register', [
            'login' => 'hacker',
            'email' => 'hack@test.local',
            'passwd' => 'test123',
            'type_user' => 1,
        ]);

        $response->assertStatus(422);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::create([
            'login' => 'manager',
            'email' => 'manager@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 2,
        ]);

        $token = auth('api')->login($user);

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.login', 'manager');
    }

    public function test_me_requires_auth(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_logout_invalidates_token(): void
    {
        $user = User::create([
            'login' => 'admin',
            'email' => 'admin@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => 1,
        ]);

        $token = auth('api')->login($user);

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
        $this->withToken($token)->getJson('/api/auth/me')->assertStatus(401);
    }
}
