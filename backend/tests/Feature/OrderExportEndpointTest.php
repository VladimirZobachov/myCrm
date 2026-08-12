<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderExportEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $type, string $fio = ''): User
    {
        return User::create([
            'login' => 'user' . $type . uniqid(),
            'email' => 'user' . $type . uniqid() . '@test.local',
            'fio' => $fio,
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

    public function test_export_requires_authentication(): void
    {
        $this->getJson('/api/orders/export')->assertStatus(401);
    }

    public function test_admin_export_returns_200_with_xls_content_type(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->get('/api/orders/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel');
        $this->assertStringContainsString(
            'mycrm-export-',
            $response->headers->get('Content-Disposition'),
        );
    }

    public function test_invalid_sdate_returns_422(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->getJson('/api/orders/export?sdate=abc');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sdate']);
    }

    public function test_sql_injection_attempt_via_dates_is_rejected(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $token = auth('api')->login($admin);

        $payload = "2026-01-01' OR '1'='1";
        $response = $this->withToken($token)->getJson(
            '/api/orders/export?sdate=' . urlencode($payload) . '&edate=2026-12-31',
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sdate']);
    }

    public function test_admin_with_sum_gets_summary_export(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id, 'price' => '1000', 'price_admin' => '700']);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->get('/api/orders/export?sum=1');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel');
    }

    public function test_mounter_gets_own_export(): void
    {
        $mounter = $this->makeUser(3, 'Петров Пётр');
        $this->makeOrder(['created_for' => $mounter->id]);
        $token = auth('api')->login($mounter);

        $response = $this->withToken($token)->get('/api/orders/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel');
    }

    public function test_manager_cannot_export(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $token = auth('api')->login($manager);

        $this->withToken($token)->getJson('/api/orders/export')->assertStatus(403);
    }
}
