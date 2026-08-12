<?php

namespace App\Services;

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * Тонкая обёртка над PHPMailer для отправки писем по SMTP (задача #44).
 * Настройки берутся из config/mail.php (mailers.smtp / from), которые
 * в свою очередь читаются из env MAIL_*.
 */
class PhpMailerTransport
{
    public function __construct(
        private readonly string $host,
        private readonly int $port,
        private readonly string $username,
        private readonly string $password,
        private readonly string $fromAddress,
        private readonly string $fromName,
        private readonly string $encryption = 'tls',
    ) {
    }

    /**
     * Собирает транспорт из config/mail.php. Возвращает null, если SMTP
     * не настроен (нет host/username/password) — в этом случае вызывающий
     * код (MailService) должен сделать fallback на лог.
     */
    public static function fromConfig(): ?self
    {
        $host = (string) config('mail.mailers.smtp.host');
        $username = (string) config('mail.mailers.smtp.username');
        $password = (string) config('mail.mailers.smtp.password');

        if ($host === '' || $username === '' || $password === '') {
            return null;
        }

        return new self(
            host: $host,
            port: (int) config('mail.mailers.smtp.port', 587),
            username: $username,
            password: $password,
            fromAddress: (string) config('mail.from.address'),
            fromName: (string) config('mail.from.name'),
            encryption: (string) (config('mail.mailers.smtp.encryption') ?: 'tls'),
        );
    }

    /**
     * @throws PHPMailerException
     */
    public function send(string $to, string $subject, string $html): void
    {
        $mailer = $this->makeMailer();
        $mailer->setFrom($this->fromAddress, $this->fromName);
        $mailer->addAddress($to);
        $mailer->isHTML(true);
        $mailer->CharSet = PHPMailer::CHARSET_UTF8;
        $mailer->Subject = $subject;
        $mailer->Body = $html;
        $mailer->send();
    }

    protected function makeMailer(): PHPMailer
    {
        $mailer = new PHPMailer(true);
        $mailer->isSMTP();
        $mailer->Host = $this->host;
        $mailer->Port = $this->port;
        $mailer->SMTPAuth = true;
        $mailer->Username = $this->username;
        $mailer->Password = $this->password;

        if ($this->encryption !== '') {
            $mailer->SMTPSecure = $this->encryption;
        }

        return $mailer;
    }
}
