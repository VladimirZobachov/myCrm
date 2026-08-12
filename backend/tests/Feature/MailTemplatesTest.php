<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\View;
use Tests\TestCase;

/**
 * Проверяет, что все Blade-шаблоны писем (resources/views/mail/*.blade.php),
 * на которые ссылаются mail-Job'ы (#42), рендерятся без ошибок и содержат
 * переданные переменные.
 */
class MailTemplatesTest extends TestCase
{
    public function test_mail_welcome_renders_with_user_name_and_login(): void
    {
        $html = View::make('mail.mail_welcome', [
            'fio' => 'Петров Пётр Петрович',
            'login' => 'petrov',
        ])->render();

        $this->assertStringContainsString('Петров Пётр Петрович', $html);
        $this->assertStringContainsString('petrov', $html);
    }

    public function test_mail_bind_mounter_renders_with_name_and_cabinet_link(): void
    {
        $html = View::make('mail.mail_bind_mounter', [
            'id' => 101,
            'fio' => 'Сидоров Сидор',
            'cab_link' => 'https://mycrm.test',
        ])->render();

        $this->assertStringContainsString('Сидоров Сидор', $html);
        $this->assertStringContainsString('https://mycrm.test', $html);
    }

    public function test_mail_create_order_owner_renders_with_order_number(): void
    {
        $html = View::make('mail.mail_create_order_owner', [
            'id' => 555,
            'fio' => 'Иванов Иван',
            'status' => 'В ожидании',
            'type_work' => 'Монтаж баннера',
        ])->render();

        $this->assertStringContainsString('555', $html);
        $this->assertStringContainsString('Иванов Иван', $html);
        $this->assertStringContainsString('Монтаж баннера', $html);
        $this->assertStringContainsString('В ожидании', $html);
    }

    public function test_mail_create_order_for_admin_renders_with_order_details(): void
    {
        $html = View::make('mail.mail_create_order_for_admin', [
            'fio' => 'Админов Админ',
            'date' => '2026-08-12',
            'manager' => 'Менеджеров Менеджер',
            'trc' => 'Гринвич',
            'type_work' => 'Монтаж баннера',
            'photo' => 'https://mycrm.test/photo.jpg',
            'price' => 5000,
        ])->render();

        $this->assertStringContainsString('Менеджеров Менеджер', $html);
        $this->assertStringContainsString('Гринвич', $html);
        $this->assertStringContainsString('5000', $html);
        $this->assertStringContainsString('https://mycrm.test/photo.jpg', $html);
    }

    public function test_mail_edit_order_owner_renders_with_order_number_and_changes(): void
    {
        $html = View::make('mail.mail_edit_order_owner', [
            'id' => 42,
            'fio' => 'Иванов Иван',
            'changes' => ['price', 'date'],
        ])->render();

        $this->assertStringContainsString('42', $html);
        $this->assertStringContainsString('price', $html);
        $this->assertStringContainsString('date', $html);
    }

    public function test_mail_edit_order_for_admin_renders_with_order_number_and_changes(): void
    {
        $html = View::make('mail.mail_edit_order_for_admin', [
            'id' => 43,
            'fio' => 'Админов Админ',
            'changes' => ['status'],
        ])->render();

        $this->assertStringContainsString('43', $html);
        $this->assertStringContainsString('status', $html);
    }

    public function test_mail_change_comment_renders_with_order_number_and_comment(): void
    {
        $html = View::make('mail.mail_change_comment', [
            'id' => 7,
            'fio' => 'Иванов Иван',
            'comment' => 'Принял в работу',
        ])->render();

        $this->assertStringContainsString('7', $html);
        $this->assertStringContainsString('Принял в работу', $html);
    }

    public function test_mail_change_comment_for_admin_renders_with_order_details(): void
    {
        $html = View::make('mail.mail_change_comment_for_admin', [
            'id' => 8,
            'fio' => 'Админов Админ',
            'date' => '2026-08-12',
            'trc' => 'Гринвич',
            'type_work' => 'Монтаж баннера',
            'photo' => 'https://mycrm.test/photo.jpg',
            'price' => 5000,
            'comment' => 'Комментарий администратора',
        ])->render();

        $this->assertStringContainsString('8', $html);
        $this->assertStringContainsString('Комментарий администратора', $html);
        $this->assertStringContainsString('Гринвич', $html);
    }

    public function test_mail_change_status_renders_with_order_number_and_status(): void
    {
        $html = View::make('mail.mail_change_status', [
            'id' => 9,
            'fio' => 'Иванов Иван',
            'status' => 'Выполнено',
            'type_work' => 'Монтаж баннера',
        ])->render();

        $this->assertStringContainsString('9', $html);
        $this->assertStringContainsString('Выполнено', $html);
        $this->assertStringContainsString('Монтаж баннера', $html);
    }
}
