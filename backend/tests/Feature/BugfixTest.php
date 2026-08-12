<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Регрессионные тесты на баги, найденные Василием (12.08.2026, стенд 95.81.79.29).
 */
class BugfixTest extends TestCase
{
    use RefreshDatabase;

    protected function makeAdmin(): User
    {
        return User::create([
            'login' => 'admin' . uniqid(),
            'email' => 'admin' . uniqid() . '@test.local',
            'fio' => 'Админ',
            'passwd' => Hash::make('secret'),
            'type_user' => 1,
        ]);
    }

    protected function makeOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'date_create' => now(),
            'date' => '2026-08-12',
            'trc' => 'Гринвич',
            'trc_other' => null,
            'type_work' => 'Монтаж',
            'brand' => 'Тест',
            'where_print' => 'Дельта',
            'where_other' => null,
            'photo' => '-',
            'price' => '1000',
            'price_admin' => '700',
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
            'importance_other' => '',
            'comments' => null,
            'comment_manager' => '',
            'status' => 1,
            'is_archived' => 0,
        ], $overrides));
    }

    /** Баг #11/#13: создание заявки не должно падать с "Field 'id' doesn't have a default value" */
    public function test_order_create_works_without_explicit_id(): void
    {
        $admin = $this->makeAdmin();
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders', [
            'date' => '2026-08-12',
            'trc' => 'Гринвич',
            'type_work' => 'Монтаж баннера',
            'brand' => 'Инцентр',
            'where_print' => 'Дельта Принт',
            'price' => '5000',
            'price_admin' => '3500',
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('id'));
    }

    /** Баг #11: users.id тоже AUTO_INCREMENT */
    public function test_user_create_works_without_explicit_id(): void
    {
        $admin = $this->makeAdmin();
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/users', [
            'login' => 'newuser' . uniqid(),
            'email' => 'newuser' . uniqid() . '@test.local',
            'fio' => 'Новый Юзер',
            'passwd' => 'secret123',
            'type_user' => 3,
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('id'));
    }

    /** Баг #12: неавторизованный доступ → 401, не 500 со стектрейсом */
    public function test_unauthenticated_returns_401_not_500(): void
    {
        $response = $this->getJson('/api/orders');

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthenticated.']);
    }

    /** Баг #49: невалидная дата в экспорте → 422 */
    public function test_export_rejects_invalid_dates(): void
    {
        $admin = $this->makeAdmin();
        $token = auth('api')->login($admin);

        $this->withToken($token)->getJson('/api/orders/export?from=abc')->assertStatus(422);
        $this->withToken($token)->getJson('/api/orders/export?to=2026-13-99')->assertStatus(422);
    }

    /** Баг #49: legacy-параметры from/to работают (валидные) */
    public function test_export_accepts_legacy_from_to_params(): void
    {
        $admin = $this->makeAdmin();
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->get('/api/orders/export?from=2026-01-01&to=2026-12-31');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel');
    }

    /** Баг #50: очередь экспорта работает (таблица export_jobs есть) */
    public function test_export_job_works(): void
    {
        $admin = $this->makeAdmin();
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders/export/job');

        $response->assertStatus(201);
        $response->assertJsonStructure(['id', 'status']);
    }
}
