<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Throwable;

/**
 * Единая точка отправки писем для всех mail-Job'ов. Реально отправляет
 * письма через PHPMailer/SMTP (задача #44), если в env настроены MAIL_*
 * (host/username/password). Если SMTP не настроен — как и раньше просто
 * логирует, чтобы dev-окружение и тесты не падали и не требовали реальной
 * почты.
 */
class MailService
{
    /**
     * @throws Throwable если реальная отправка не удалась — исключение
     *                    пробрасывается дальше (после логирования), чтобы
     *                    вызывающая Job считалась упавшей и была повторена
     *                    queue:work с backoff (задача #45,
     *                    см. App\Jobs\Concerns\RetriesMailDelivery).
     */
    public function send(string $to, string $subject, string $template, array $data = []): void
    {
        $transport = PhpMailerTransport::fromConfig();

        if (!$transport) {
            Log::info("mail: to={$to}, subject={$subject}, template={$template}", $data);

            return;
        }

        try {
            $html = View::make("mail.{$template}", $data)->render();
            $transport->send($to, $subject, $html);
        } catch (Throwable $e) {
            Log::error("mail: failed to send to={$to}, subject={$subject}, template={$template}: {$e->getMessage()}", $data);

            throw $e;
        }
    }
}
