<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderPhoto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrderPhotoTest extends TestCase
{
    use RefreshDatabase;

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
            'status' => 3,
            'is_archived' => 0,
        ], $overrides));
    }

    public function test_migration_creates_order_photos_table(): void
    {
        $this->assertTrue(Schema::hasTable('order_photos'));
    }

    public function test_order_photo_can_be_created_with_order_id_and_path(): void
    {
        $order = $this->makeOrder();

        $photo = OrderPhoto::create([
            'order_id' => $order->id,
            'path' => 'orders/1/photo1.jpg',
        ]);

        $this->assertDatabaseHas('order_photos', [
            'id' => $photo->id,
            'order_id' => $order->id,
            'path' => 'orders/1/photo1.jpg',
        ]);
    }

    public function test_order_has_many_photos(): void
    {
        $order = $this->makeOrder();

        OrderPhoto::create(['order_id' => $order->id, 'path' => 'orders/1/photo1.jpg']);
        OrderPhoto::create(['order_id' => $order->id, 'path' => 'orders/1/photo2.jpg']);

        $this->assertEquals(2, $order->photos()->count());
    }
}
