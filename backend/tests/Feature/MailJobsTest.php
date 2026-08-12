<?php

namespace Tests\Feature;

use App\Jobs\CommentChangedMail;
use App\Jobs\MounterAssignedMail;
use App\Jobs\OrderCreatedMail;
use App\Jobs\OrderUpdatedMail;
use App\Jobs\StatusChangedMail;
use App\Jobs\WelcomeMail;
use App\Models\Order;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Mockery\MockInterface;
use Tests\TestCase;

class MailJobsTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $type, array $overrides = []): User
    {
        return User::create(array_merge([
            'login' => 'user' . $type . uniqid(),
            'email' => 'user' . $type . uniqid() . '@test.local',
            'fio' => 'Иванов Иван ' . $type,
            'passwd' => Hash::make('secret'),
            'type_user' => $type,
        ], $overrides));
    }

    protected function makeOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'date_create' => now(),
            'date' => '2026-08-11',
            'trc' => 'Гринвич',
            'type_work' => 'Монтаж баннера',
            'brand' => 'Тест',
            'where_print' => 'Дельта Принт',
            'price' => 5000,
            'price_admin' => 3500,
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
            'importance_other' => '',
            'status' => 1,
            'is_archived' => 0,
            'photo' => '',
        ], $overrides));
    }

    public function test_order_created_mail_sends_to_admin_creator_and_mounter(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $mounter = $this->makeUser(3);

        $order = $this->makeOrder([
            'created_by' => $manager->id,
            'created_for' => $mounter->id,
        ]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($admin, $manager, $mounter) {
            $mock->shouldReceive('send')->once()->withArgs(fn ($to) => $to === $admin->email);
            $mock->shouldReceive('send')->once()->withArgs(fn ($to) => $to === $manager->email);
            $mock->shouldReceive('send')->once()->withArgs(fn ($to) => $to === $mounter->email);
        });

        OrderCreatedMail::dispatch($order->id);
    }

    public function test_order_created_mail_without_mounter_sends_to_two_recipients(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);

        $order = $this->makeOrder(['created_by' => $manager->id]);

        $this->mock(MailService::class, function (MockInterface $mock) {
            $mock->shouldReceive('send')->twice();
        });

        OrderCreatedMail::dispatch($order->id);
    }

    public function test_mounter_assigned_mail_sends_to_mounter_with_bind_template(): void
    {
        $manager = $this->makeUser(2);
        $mounter = $this->makeUser(3);
        $order = $this->makeOrder(['created_by' => $manager->id]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($mounter) {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template) => $to === $mounter->email && $template === 'mail_bind_mounter');
        });

        MounterAssignedMail::dispatch($order->id, $mounter->id);
    }

    public function test_status_changed_mail_sends_to_creator_and_mounter(): void
    {
        $manager = $this->makeUser(2);
        $mounter = $this->makeUser(3);
        $order = $this->makeOrder(['created_by' => $manager->id, 'created_for' => $mounter->id]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($manager, $mounter) {
            $mock->shouldReceive('send')->once()->withArgs(fn ($to) => $to === $manager->email);
            $mock->shouldReceive('send')->once()->withArgs(fn ($to) => $to === $mounter->email);
        });

        StatusChangedMail::dispatch($order->id, 2);
    }

    public function test_order_updated_mail_sends_to_editor_and_admin(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $order = $this->makeOrder(['created_by' => $manager->id]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($admin, $manager) {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template) => $to === $manager->email && $template === 'mail_edit_order_owner');
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template) => $to === $admin->email && $template === 'mail_edit_order_for_admin');
        });

        OrderUpdatedMail::dispatch($order->id, $manager->id, ['price']);
    }

    public function test_comment_changed_mail_from_mounter_notifies_admin_with_detailed_template(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $mounter = $this->makeUser(3);
        $order = $this->makeOrder(['created_by' => $manager->id, 'created_for' => $mounter->id]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($admin) {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template, $data) => $to === $admin->email
                    && $template === 'mail_change_comment_for_admin'
                    && $data['comment'] === 'Принял в работу');
        });

        CommentChangedMail::dispatch($order->id, 'Принял в работу', $mounter->id);
    }

    public function test_comment_changed_mail_from_admin_notifies_owner_and_admin_with_short_template(): void
    {
        $admin = $this->makeUser(1);
        $manager = $this->makeUser(2);
        $order = $this->makeOrder(['created_by' => $manager->id]);

        $this->mock(MailService::class, function (MockInterface $mock) use ($admin, $manager) {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template) => $to === $manager->email && $template === 'mail_change_comment');
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(fn ($to, $subject, $template) => $to === $admin->email && $template === 'mail_change_comment');
        });

        CommentChangedMail::dispatch($order->id, 'Комментарий администратора', $admin->id);
    }

    /**
     * Регрессия legacy-бага `$mailer->Body = $а;` (кириллическая «а» вместо
     * собранной переменной с телом письма) — письмо уходило пустым, без ФИО.
     * Здесь явно проверяем, что имя пользователя передаётся в письмо и не пустое.
     */
    public function test_welcome_mail_sends_with_correct_non_empty_name(): void
    {
        $user = $this->makeUser(2, ['fio' => 'Петров Пётр Петрович']);

        $this->mock(MailService::class, function (MockInterface $mock) use ($user) {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(function ($to, $subject, $template, $data) use ($user) {
                    return $to === $user->email
                        && $data['fio'] === 'Петров Пётр Петрович'
                        && $data['fio'] !== ''
                        && $data['login'] === $user->login;
                });
        });

        WelcomeMail::dispatch($user->id);
    }

    public function test_mail_service_logs_the_email(): void
    {
        Log::spy();

        (new MailService())->send('test@test.local', 'Тема письма', 'mail_welcome', ['fio' => 'Тест Тестов']);

        Log::shouldHaveReceived('info')
            ->once()
            ->withArgs(fn ($message, $context) => str_contains($message, 'to=test@test.local')
                && str_contains($message, 'subject=Тема письма')
                && str_contains($message, 'template=mail_welcome')
                && $context['fio'] === 'Тест Тестов');
    }
}
