<?php

namespace Tests\Feature;

use App\Services\MailService;
use App\Services\PhpMailerTransport;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Задача #44: реальная отправка через PHPMailer/SMTP с fallback на лог,
 * если MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD не настроены (dev/тесты).
 */
class MailServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        config([
            'mail.mailers.smtp.host' => null,
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);

        parent::tearDown();
    }

    public function test_send_falls_back_to_log_when_smtp_is_not_configured(): void
    {
        config([
            'mail.mailers.smtp.host' => null,
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);

        Log::spy();

        (new MailService())->send('test@test.local', 'Тема', 'mail_welcome', ['fio' => 'Тест', 'login' => 'test']);

        Log::shouldHaveReceived('info')
            ->once()
            ->withArgs(fn ($message) => str_contains($message, 'to=test@test.local'));
    }

    public function test_send_does_not_throw_when_smtp_host_configured_without_credentials(): void
    {
        config([
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);

        Log::spy();

        (new MailService())->send('test@test.local', 'Тема', 'mail_welcome', ['fio' => 'Тест', 'login' => 'test']);

        Log::shouldHaveReceived('info')->once();
    }

    public function test_transport_from_config_is_null_when_smtp_not_configured(): void
    {
        config([
            'mail.mailers.smtp.host' => null,
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);

        $this->assertNull(PhpMailerTransport::fromConfig());
    }

    public function test_transport_from_config_is_built_when_smtp_fully_configured(): void
    {
        config([
            'mail.mailers.smtp.host' => 'smtp.example.test',
            'mail.mailers.smtp.port' => 587,
            'mail.mailers.smtp.encryption' => 'tls',
            'mail.mailers.smtp.username' => 'user@example.test',
            'mail.mailers.smtp.password' => 'secret',
            'mail.from.address' => 'info@vvebmaster.ru',
            'mail.from.name' => 'Система заявок',
        ]);

        $transport = PhpMailerTransport::fromConfig();

        $this->assertInstanceOf(PhpMailerTransport::class, $transport);
    }
}
