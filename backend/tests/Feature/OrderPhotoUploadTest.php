<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderPhoto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrderPhotoUploadTest extends TestCase
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

    public function test_upload_valid_jpeg_returns_201_and_stores_file(): void
    {
        Storage::fake('public');

        $admin = $this->makeUser(1);
        $order = $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $file = UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg');

        $response = $this->withToken($token)
            ->postJson("/api/orders/{$order->id}/photos", ['photo' => $file]);

        $response->assertStatus(201)
            ->assertJsonStructure(['id', 'url']);

        $photo = OrderPhoto::first();
        $this->assertNotNull($photo);
        $this->assertEquals($order->id, $photo->order_id);
        $this->assertEquals($admin->id, $photo->uploaded_by);

        Storage::disk('public')->assertExists($photo->path);
    }

    public function test_upload_invalid_file_type_returns_422(): void
    {
        Storage::fake('public');

        $admin = $this->makeUser(1);
        $order = $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $file = UploadedFile::fake()->create('document.txt', 100, 'text/plain');

        $this->withToken($token)
            ->postJson("/api/orders/{$order->id}/photos", ['photo' => $file])
            ->assertStatus(422);

        $this->assertEquals(0, OrderPhoto::count());
    }

    public function test_upload_file_over_10mb_returns_422(): void
    {
        Storage::fake('public');

        $admin = $this->makeUser(1);
        $order = $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $file = UploadedFile::fake()->create('big.jpg', 10241, 'image/jpeg');

        $this->withToken($token)
            ->postJson("/api/orders/{$order->id}/photos", ['photo' => $file])
            ->assertStatus(422);

        $this->assertEquals(0, OrderPhoto::count());
    }

    public function test_delete_own_photo_returns_200_and_removes_file(): void
    {
        Storage::fake('public');

        $admin = $this->makeUser(1);
        $order = $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $path = 'order-photos/existing.jpg';
        Storage::disk('public')->put($path, 'fake-content');
        $photo = OrderPhoto::create([
            'order_id' => $order->id,
            'path' => $path,
            'uploaded_by' => $admin->id,
        ]);

        $this->withToken($token)
            ->deleteJson("/api/orders/photos/{$photo->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('order_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_delete_foreign_photo_by_non_admin_returns_403(): void
    {
        Storage::fake('public');

        $owner = $this->makeUser(2);
        $otherManager = $this->makeUser(2);
        $order = $this->makeOrder(['created_by' => $owner->id]);
        $token = auth('api')->login($otherManager);

        $path = 'order-photos/existing.jpg';
        Storage::disk('public')->put($path, 'fake-content');
        $photo = OrderPhoto::create([
            'order_id' => $order->id,
            'path' => $path,
            'uploaded_by' => $owner->id,
        ]);

        $this->withToken($token)
            ->deleteJson("/api/orders/photos/{$photo->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('order_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertExists($path);
    }

    public function test_order_json_contains_photos(): void
    {
        Storage::fake('public');

        $admin = $this->makeUser(1);
        $order = $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $photo = OrderPhoto::create([
            'order_id' => $order->id,
            'path' => 'order-photos/existing.jpg',
            'uploaded_by' => $admin->id,
        ]);

        $response = $this->withToken($token)->getJson("/api/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('photos.0.id', $photo->id)
            ->assertJsonPath('photos.0.url', $photo->url);
    }
}
