<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderBatchTest extends TestCase
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

    protected function createOrder(User $admin, array $overrides = []): array
    {
        $token = auth('api')->login($admin);

        return $this->withToken($token)
            ->postJson('/api/orders', $this->orderData($overrides))
            ->assertStatus(201)->json();
    }

    public function test_batch_status_changes_status_for_multiple_orders(): void
    {
        $admin = $this->makeUser(1);
        $order1 = $this->createOrder($admin);
        $order2 = $this->createOrder($admin);

        $token = auth('api')->login($admin);
        $response = $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => [$order1['id'], $order2['id']],
            'status' => 2,
        ]);

        $response->assertOk();
        $this->assertEqualsCanonicalizing([$order1['id'], $order2['id']], $response->json('updated'));

        $this->assertSame(2, Order::find($order1['id'])->status);
        $this->assertSame(2, Order::find($order2['id'])->status);
    }

    public function test_batch_archive_archives_and_unarchives_orders(): void
    {
        $admin = $this->makeUser(1);
        $order1 = $this->createOrder($admin);
        $order2 = $this->createOrder($admin);

        $token = auth('api')->login($admin);

        $this->withToken($token)->patchJson('/api/orders/batch-archive', [
            'order_ids' => [$order1['id'], $order2['id']],
            'archived' => true,
        ])->assertOk();

        $this->assertSame(1, Order::find($order1['id'])->is_archived);
        $this->assertSame(1, Order::find($order2['id'])->is_archived);

        $this->withToken($token)->patchJson('/api/orders/batch-archive', [
            'order_ids' => [$order1['id'], $order2['id']],
            'archived' => false,
        ])->assertOk();

        $this->assertSame(0, Order::find($order1['id'])->is_archived);
        $this->assertSame(0, Order::find($order2['id'])->is_archived);
    }

    public function test_batch_comment_adds_comment_to_multiple_orders(): void
    {
        $admin = $this->makeUser(1);
        $order1 = $this->createOrder($admin);
        $order2 = $this->createOrder($admin);

        $token = auth('api')->login($admin);
        $this->withToken($token)->patchJson('/api/orders/batch-comment', [
            'order_ids' => [$order1['id'], $order2['id']],
            'comment' => 'Проверено',
        ])->assertOk();

        $this->assertSame('Проверено', Order::find($order1['id'])->comments);
        $this->assertSame('Проверено', Order::find($order2['id'])->comments);
    }

    public function test_batch_comment_from_manager_goes_to_comment_manager_field(): void
    {
        $manager = $this->makeUser(2);
        $order1 = $this->createOrder($manager);
        $order2 = $this->createOrder($manager);

        $token = auth('api')->login($manager);
        $this->withToken($token)->patchJson('/api/orders/batch-comment', [
            'order_ids' => [$order1['id'], $order2['id']],
            'comment' => 'Комментарий менеджера',
        ])->assertOk();

        $this->assertSame('Комментарий менеджера', Order::find($order1['id'])->comment_manager);
        $this->assertSame('Комментарий менеджера', Order::find($order2['id'])->comment_manager);
    }

    public function test_batch_delete_allowed_only_for_admin(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $order1 = $this->createOrder($manager);
        $order2 = $this->createOrder($manager);

        $managerToken = auth('api')->login($manager);
        $this->withToken($managerToken)->deleteJson('/api/orders/batch', [
            'order_ids' => [$order1['id'], $order2['id']],
        ])->assertStatus(403);

        $this->assertNotNull(Order::find($order1['id']));

        $adminToken = auth('api')->login($admin);
        $response = $this->withToken($adminToken)->deleteJson('/api/orders/batch', [
            'order_ids' => [$order1['id'], $order2['id']],
        ]);

        $response->assertOk();
        $this->assertNull(Order::find($order1['id']));
        $this->assertNull(Order::find($order2['id']));
    }

    public function test_batch_status_requires_valid_order_ids(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => 'not-an-array',
            'status' => 2,
        ])->assertStatus(422)->assertJsonValidationErrors('order_ids');

        $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => [],
            'status' => 2,
        ])->assertStatus(422)->assertJsonValidationErrors('order_ids');

        $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => ['abc', 1],
            'status' => 2,
        ])->assertStatus(422)->assertJsonValidationErrors('order_ids.0');

        $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => [1],
            'status' => 99,
        ])->assertStatus(422)->assertJsonValidationErrors('status');
    }

    public function test_mounter_cannot_batch_change_status_of_orders_assigned_to_others(): void
    {
        $admin = $this->makeUser(1);
        $mounter = $this->makeUser(3);
        $otherMounter = $this->makeUser(3);

        // Заказ назначен другому монтажнику
        $foreignOrder = $this->createOrder($admin, ['created_for' => $otherMounter->id]);
        // Заказ назначен нашему монтажнику
        $ownOrder = $this->createOrder($admin, ['created_for' => $mounter->id]);

        $token = auth('api')->login($mounter);
        $response = $this->withToken($token)->patchJson('/api/orders/batch-status', [
            'order_ids' => [$foreignOrder['id'], $ownOrder['id']],
            'status' => 2,
        ]);

        $response->assertOk();
        // Только свой заказ попадает в updated — чужой scopeVisibleTo отсекает молча
        $this->assertSame([$ownOrder['id']], $response->json('updated'));

        $this->assertSame(1, Order::find($foreignOrder['id'])->status);
        $this->assertSame(2, Order::find($ownOrder['id'])->status);
    }
}
