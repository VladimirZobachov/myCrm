<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrationFlagTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $typeUser, string $login, bool $migrated = false): User
    {
        return User::create([
            'login' => $login,
            'email' => $login . '@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => $typeUser,
            'migrated_to_v2' => $migrated,
        ]);
    }

    public function test_migration_adds_migrated_to_v2_column(): void
    {
        $this->assertTrue(Schema::hasColumn('users', 'migrated_to_v2'));
    }

    public function test_is_migrated_to_v2(): void
    {
        $migrated = $this->makeUser(3, 'migrated', true);
        $notMigrated = $this->makeUser(3, 'notmigrated', false);

        $this->assertTrue($migrated->isMigratedToV2());
        $this->assertFalse($notMigrated->isMigratedToV2());
    }

    public function test_scope_migrated_and_not_migrated_filter(): void
    {
        $this->makeUser(3, 'a', true);
        $this->makeUser(3, 'b', false);
        $this->makeUser(3, 'c', true);

        $this->assertEquals(2, User::migrated()->count());
        $this->assertEquals(1, User::notMigrated()->count());
    }

    public function test_flag_role_command_turns_on_flag_for_all_installers(): void
    {
        $installer1 = $this->makeUser(3, 'installer1');
        $installer2 = $this->makeUser(3, 'installer2');
        $manager = $this->makeUser(2, 'manager');

        $this->artisan('migrate:flag-role', ['role' => 3, '--on' => true])
            ->assertExitCode(0);

        $this->assertTrue($installer1->fresh()->migrated_to_v2);
        $this->assertTrue($installer2->fresh()->migrated_to_v2);
        $this->assertFalse((bool) $manager->fresh()->migrated_to_v2);
    }

    public function test_flag_role_command_turns_off_flag(): void
    {
        $installer = $this->makeUser(3, 'installer', true);

        $this->artisan('migrate:flag-role', ['role' => 3, '--off' => true])
            ->assertExitCode(0);

        $this->assertFalse((bool) $installer->fresh()->migrated_to_v2);
    }

    public function test_login_returns_migrated_to_v2_field(): void
    {
        $this->makeUser(3, 'migrated_login', true);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'migrated_login',
            'passwd' => 'secret',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.migrated_to_v2', true);
    }

    public function test_me_returns_migrated_to_v2_field(): void
    {
        $user = $this->makeUser(3, 'me_user', true);
        $token = auth('api')->login($user);

        $response = $this->withToken($token)->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.migrated_to_v2', true);
    }
}
