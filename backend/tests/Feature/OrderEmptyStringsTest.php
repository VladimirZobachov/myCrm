<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Регрессия бага 13.08.2026: редактирование заявки падало с 500/422,
 * если форма отправляла пустые строки ("") в NOT NULL поля.
 * Причина: ConvertEmptyStringsToNull превращает "" в null,
 * а правила валидации без nullable + колонки NOT NULL давали 422/500.
 */
class OrderEmptyStringsTest extends TestCase
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

    protected function makeMounter(): User
    {
        return User::create([
            'login' => 'mounter' . uniqid(),
            'email' => 'mounter' . uniqid() . '@test.local',
            'fio' => 'Монтажник',
            'passwd' => Hash::make('secret'),
            'type_user' => 3,
        ]);
    }

    protected function fullPayload(int $mounterId): array
    {
        return [
            'trc' => 'Радуга парк',
            'trc_other' => '',
            'date' => '2026-08-14',
            'type_work' => 'Тест',
            'brand' => 'test',
            'where_print' => 'Солнечный город',
            'where_other' => '',
            'photo' => '',
            'price' => '1000',
            'price_admin' => '700',
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
            'importance_other' => '',
            'created_for' => (string) $mounterId,
        ];
    }

    /** Баг: PUT с пустыми строками ("") → 422/500. Должен быть 200. */
    public function test_update_with_empty_strings_succeeds(): void
    {
        $admin = $this->makeAdmin();
        $mounter = $this->makeMounter();
        $order = Order::create(array_merge($this->fullPayload($mounter->id), [
            'date_create' => now(),
            'status' => 1,
            'is_archived' => 0,
        ]));
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->putJson('/api/orders/' . $order->id, $this->fullPayload($mounter->id));

        $response->assertStatus(200);
        $response->assertJson(['id' => $order->id]);
    }

    /** Баг: POST с пустыми строками при создании. Должен быть 201. */
    public function test_create_with_empty_strings_succeeds(): void
    {
        $admin = $this->makeAdmin();
        $mounter = $this->makeMounter();
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders', $this->fullPayload($mounter->id));

        $response->assertStatus(201);
    }

    /** Пустая photo ("") должна сохраняться как "" (не null). */
    public function test_photo_stored_as_empty_string_not_null(): void
    {
        $admin = $this->makeAdmin();
        $mounter = $this->makeMounter();
        $order = Order::create(array_merge($this->fullPayload($mounter->id), [
            'date_create' => now(),
            'status' => 1,
            'is_archived' => 0,
        ]));
        $token = auth('api')->login($admin);

        $this->withToken($token)->putJson('/api/orders/' . $order->id, ['photo' => ''])->assertStatus(200);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'photo' => '']);
    }

    /** importance_other тоже "" (колонка NOT NULL). */
    public function test_importance_other_stored_as_empty_string(): void
    {
        $admin = $this->makeAdmin();
        $mounter = $this->makeMounter();
        $order = Order::create(array_merge($this->fullPayload($mounter->id), [
            'date_create' => now(),
            'status' => 1,
            'is_archived' => 0,
        ]));
        $token = auth('api')->login($admin);

        $this->withToken($token)->putJson('/api/orders/' . $order->id, ['importance_other' => ''])->assertStatus(200);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'importance_other' => '']);
    }
}
