<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $type): User
    {
        return User::create([
            'login' => 'user' . $type . uniqid(),
            'email' => 'user' . $type . uniqid() . '@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => $type,
        ]);
    }

    protected function orderData(array $overrides = []): array
    {
        return array_merge([
            'trc' => 'Гринвич',
            'date' => '2026-08-11',
            'type_work' => 'Монтаж баннера',
            'brand' => 'Тест',
            'where_print' => 'Дельта Принт',
            'price' => 5000,
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
        ], $overrides);
    }

    public function test_store_sets_price_admin_as_0_7_of_price(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders', $this->orderData());
        $response->assertStatus(201)
            ->assertJsonPath('price_admin', '3500.00');
    }

    public function test_manager_can_create_order(): void
    {
        $manager = $this->makeUser(2);
        $token = auth('api')->login($manager);

        $this->withToken($token)->postJson('/api/orders', $this->orderData())
            ->assertStatus(201);
    }

    public function test_mounter_cannot_create_order(): void
    {
        $mounter = $this->makeUser(3);
        $token = auth('api')->login($mounter);

        $this->withToken($token)->postJson('/api/orders', $this->orderData())
            ->assertStatus(403);
    }

    public function test_role_based_visibility(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $mounter = $this->makeUser(3);

        // Админ создаёт заказ для монтажника
        $tokenAdmin = auth('api')->login($admin);
        $order = $this->withToken($tokenAdmin)->postJson('/api/orders', $this->orderData(['created_for' => $mounter->id]))
            ->assertStatus(201)->json();

        // Менеджер видит только свои
        $tokenManager = auth('api')->login($manager);
        $this->withToken($tokenManager)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('total', 0);

        // Админ видит заказ
        $tokenAdmin2 = auth('api')->login($admin);
        $this->withToken($tokenAdmin2)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('total', 1);

        // Монтажник видит назначенный ему
        $tokenMounter = auth('api')->login($mounter);
        $this->withToken($tokenMounter)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_mounter_auto_assign_on_status_change(): void
    {
        $admin = $this->makeUser(1);
        $mounter = $this->makeUser(3);

        // Заказ без исполнителя
        $tokenAdmin = auth('api')->login($admin);
        $order = $this->withToken($tokenAdmin)->postJson('/api/orders', $this->orderData())
            ->assertStatus(201)->json();

        // Монтажник меняет статус → auto-assign
        $tokenMounter = auth('api')->login($mounter);
        $response = $this->withToken($tokenMounter)
            ->patchJson("/api/orders/{$order['id']}/status", ['status' => 2]);

        $response->assertOk()
            ->assertJsonPath('status', 2)
            ->assertJsonPath('created_for.id', $mounter->id);
    }

    public function test_comment_goes_to_correct_field_by_role(): void
    {
        $admin = $this->makeUser(1);
        $mounter = $this->makeUser(3);

        $tokenAdmin = auth('api')->login($admin);
        $order = $this->withToken($tokenAdmin)->postJson('/api/orders', $this->orderData())
            ->assertStatus(201)->json();

        // Монтажник пишет комментарий → comment_mounter
        $tokenMounter = auth('api')->login($mounter);
        $this->withToken($tokenMounter)
            ->patchJson("/api/orders/{$order['id']}/comment", ['comment' => 'Принял в работу'])
            ->assertOk()
            ->assertJsonPath('comment_mounter', 'Принял в работу');
    }

    public function test_archive_order(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $order = $this->withToken($token)->postJson('/api/orders', $this->orderData())
            ->assertStatus(201)->json();

        $this->withToken($token)
            ->patchJson("/api/orders/{$order['id']}/archive", ['archived' => true])
            ->assertOk()
            ->assertJsonPath('is_archived', 1);
    }

    public function test_update_order_recalculates_price_admin(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $order = $this->withToken($token)->postJson('/api/orders', $this->orderData())
            ->assertStatus(201)->json();

        $this->withToken($token)
            ->patchJson("/api/orders/{$order['id']}", ['price' => 7000])
            ->assertOk()
            ->assertJsonPath('price_admin', '4900.00');
    }

    public function test_validation_requires_importance(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $data = $this->orderData();
        unset($data['importance']);

        $this->withToken($token)->postJson('/api/orders', $data)
            ->assertStatus(422)
            ->assertJsonValidationErrors('importance');
    }
}
