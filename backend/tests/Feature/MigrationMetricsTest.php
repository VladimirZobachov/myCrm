<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MigrationMetricsTest extends TestCase
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

    protected function seedUsers(): void
    {
        // Роль 1 — админ: 2 всего, 1 мигрирован (50%)
        $this->makeUser(1, 'admin1', true);
        $this->makeUser(1, 'admin2', false);

        // Роль 2 — менеджер: 4 всего, 1 мигрирован (25%)
        $this->makeUser(2, 'manager1', true);
        $this->makeUser(2, 'manager2', false);
        $this->makeUser(2, 'manager3', false);
        $this->makeUser(2, 'manager4', false);

        // Роль 3 — монтажник: 3 всего, все мигрированы (100%)
        $this->makeUser(3, 'installer1', true);
        $this->makeUser(3, 'installer2', true);
        $this->makeUser(3, 'installer3', true);
    }

    public function test_only_admin_can_view_metrics(): void
    {
        $this->seedUsers();
        $mounter = User::where('type_user', 3)->first();
        $token = auth('api')->login($mounter);

        $this->withToken($token)->getJson('/api/migration/metrics')->assertStatus(403);
    }

    public function test_metrics_requires_auth(): void
    {
        $this->getJson('/api/migration/metrics')->assertStatus(401);
    }

    public function test_admin_gets_correct_metrics_structure_and_totals(): void
    {
        $this->seedUsers();
        $admin = User::where('login', 'admin1')->first();
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->getJson('/api/migration/metrics');

        $response->assertOk()->assertJsonStructure([
            'total',
            'migrated',
            'percent',
            'by_role' => [
                '*' => ['role', 'total', 'migrated', 'percent'],
            ],
        ]);

        // 9 пользователей всего, 5 мигрировано (1 + 1 + 3)
        $response->assertJsonPath('total', 9);
        $response->assertJsonPath('migrated', 5);

        $byRole = collect($response->json('by_role'))->keyBy('role');

        $this->assertEquals(2, $byRole[1]['total']);
        $this->assertEquals(1, $byRole[1]['migrated']);
        $this->assertEquals(50.0, $byRole[1]['percent']);

        $this->assertEquals(4, $byRole[2]['total']);
        $this->assertEquals(1, $byRole[2]['migrated']);
        $this->assertEquals(25.0, $byRole[2]['percent']);

        $this->assertEquals(3, $byRole[3]['total']);
        $this->assertEquals(3, $byRole[3]['migrated']);
        $this->assertEquals(100.0, $byRole[3]['percent']);
    }
}
