<?php

namespace Tests\Feature;

use App\Models\ExportJob;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ExportJobTest extends TestCase
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

    public function test_admin_can_queue_export_job_and_gets_201(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders/export/job');

        $response->assertStatus(201);
        $response->assertJsonStructure(['id', 'status']);
        $this->assertDatabaseHas('export_jobs', [
            'id' => $response->json('id'),
            'user_id' => $admin->id,
        ]);
    }

    public function test_get_job_status_returns_done_after_sync_processing(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $jobId = $this->withToken($token)->postJson('/api/orders/export/job')->json('id');

        $response = $this->withToken($token)->getJson("/api/orders/export/job/{$jobId}");

        $response->assertStatus(200);
        $response->assertJson([
            'id' => $jobId,
            'status' => ExportJob::STATUS_DONE,
        ]);
    }

    public function test_download_returns_200_with_xls_content_type(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $this->makeOrder(['created_by' => $admin->id]);
        $token = auth('api')->login($admin);

        $jobId = $this->withToken($token)->postJson('/api/orders/export/job')->json('id');

        $response = $this->withToken($token)->get("/api/orders/export/job/{$jobId}/download");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.ms-excel');
    }

    public function test_invalid_sdate_returns_422(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $token = auth('api')->login($admin);

        $response = $this->withToken($token)->postJson('/api/orders/export/job', ['sdate' => 'abc']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['sdate']);
    }

    public function test_manager_cannot_queue_export_job(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $token = auth('api')->login($manager);

        $this->withToken($token)->postJson('/api/orders/export/job')->assertStatus(403);
    }

    public function test_mounter_can_queue_and_download_own_export(): void
    {
        $mounter = $this->makeUser(3, 'Петров Пётр');
        $this->makeOrder(['created_for' => $mounter->id]);
        $token = auth('api')->login($mounter);

        $jobId = $this->withToken($token)->postJson('/api/orders/export/job')->json('id');

        $response = $this->withToken($token)->get("/api/orders/export/job/{$jobId}/download");

        $response->assertStatus(200);
    }

    public function test_non_owner_cannot_access_another_users_export_job(): void
    {
        $admin = $this->makeUser(1, 'Админ Админов');
        $tokenAdmin = auth('api')->login($admin);
        $jobId = $this->withToken($tokenAdmin)->postJson('/api/orders/export/job')->json('id');

        $otherMounter = $this->makeUser(3, 'Чужой Монтажник');
        $tokenOther = auth('api')->login($otherMounter);

        $this->withToken($tokenOther)->getJson("/api/orders/export/job/{$jobId}")->assertStatus(403);
    }
}
