<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderPositionTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $type = 1): User
    {
        return User::create([
            'login' => 'user' . $type . uniqid(),
            'email' => 'user' . $type . uniqid() . '@test.local',
            'passwd' => Hash::make('secret'),
            'type_user' => $type,
        ]);
    }

    protected function makeOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'date_create' => now(),
            'date' => '2026-08-11',
            'trc' => 'Гринвич',
            'trc_other' => null,
            'type_work' => 'Монтаж баннера',
            'brand' => 'Тест',
            'where_print' => 'Дельта Принт',
            'where_other' => null,
            'photo' => 'photo.jpg',
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

    public function test_put_positions_saves_order(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $o1 = $this->makeOrder();
        $o2 = $this->makeOrder();
        $o3 = $this->makeOrder();

        $this->withToken($token)
            ->putJson('/api/orders/positions', ['order_ids' => [$o3->id, $o1->id, $o2->id]])
            ->assertStatus(200)
            ->assertJson(['order_ids' => [$o3->id, $o1->id, $o2->id]]);

        $this->assertDatabaseHas('order_positions', [
            'user_id' => $admin->id,
            'order_id' => $o3->id,
            'position' => 0,
        ]);
        $this->assertDatabaseHas('order_positions', [
            'user_id' => $admin->id,
            'order_id' => $o1->id,
            'position' => 1,
        ]);
        $this->assertDatabaseHas('order_positions', [
            'user_id' => $admin->id,
            'order_id' => $o2->id,
            'position' => 2,
        ]);
    }

    public function test_put_positions_replaces_previous_order(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $o1 = $this->makeOrder();
        $o2 = $this->makeOrder();

        $this->withToken($token)->putJson('/api/orders/positions', ['order_ids' => [$o1->id, $o2->id]]);
        $this->withToken($token)->putJson('/api/orders/positions', ['order_ids' => [$o2->id, $o1->id]]);

        $this->assertDatabaseCount('order_positions', 2);
        $this->assertDatabaseHas('order_positions', [
            'user_id' => $admin->id,
            'order_id' => $o2->id,
            'position' => 0,
        ]);
    }

    public function test_get_positions_returns_saved_order(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $o1 = $this->makeOrder();
        $o2 = $this->makeOrder();

        $this->withToken($token)->putJson('/api/orders/positions', ['order_ids' => [$o2->id, $o1->id]]);

        $this->withToken($token)->getJson('/api/orders/positions')
            ->assertStatus(200)
            ->assertJson(['order_ids' => [$o2->id, $o1->id]]);
    }

    public function test_get_positions_returns_null_when_not_set(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $this->withToken($token)->getJson('/api/orders/positions')
            ->assertStatus(200)
            ->assertJson(['order_ids' => null]);
    }

    public function test_index_sorts_by_manual_positions_when_present(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $o1 = $this->makeOrder();
        $o2 = $this->makeOrder();
        $o3 = $this->makeOrder();

        $this->withToken($token)->putJson('/api/orders/positions', ['order_ids' => [$o3->id, $o1->id, $o2->id]]);

        $response = $this->withToken($token)->getJson('/api/orders');
        $response->assertStatus(200);

        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$o3->id, $o1->id, $o2->id], $ids);
    }

    public function test_index_uses_default_sort_when_explicit_sort_requested(): void
    {
        $admin = $this->makeUser(1);
        $token = auth('api')->login($admin);

        $o1 = $this->makeOrder();
        $o2 = $this->makeOrder();
        $o3 = $this->makeOrder();

        $this->withToken($token)->putJson('/api/orders/positions', ['order_ids' => [$o3->id, $o1->id, $o2->id]]);

        $response = $this->withToken($token)->getJson('/api/orders?sort=id|ASC');
        $response->assertStatus(200);

        $ids = array_column($response->json('data'), 'id');
        $this->assertSame([$o1->id, $o2->id, $o3->id], $ids);
    }

    public function test_different_users_have_independent_positions(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);

        $o1 = $this->makeOrder(['created_by' => $manager->id]);
        $o2 = $this->makeOrder(['created_by' => $manager->id]);

        $tokenAdmin = auth('api')->login($admin);
        $this->withToken($tokenAdmin)->putJson('/api/orders/positions', ['order_ids' => [$o1->id, $o2->id]]);

        $tokenManager = auth('api')->login($manager);
        $this->withToken($tokenManager)->putJson('/api/orders/positions', ['order_ids' => [$o2->id, $o1->id]]);

        $tokenAdmin2 = auth('api')->login($admin);
        $this->withToken($tokenAdmin2)->getJson('/api/orders/positions')
            ->assertJson(['order_ids' => [$o1->id, $o2->id]]);

        $tokenManager2 = auth('api')->login($manager);
        $this->withToken($tokenManager2)->getJson('/api/orders/positions')
            ->assertJson(['order_ids' => [$o2->id, $o1->id]]);
    }

    public function test_positions_require_authentication(): void
    {
        $this->getJson('/api/orders/positions')->assertStatus(401);
        $this->putJson('/api/orders/positions', ['order_ids' => [1, 2]])->assertStatus(401);
    }
}
