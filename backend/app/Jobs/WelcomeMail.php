<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesMailDelivery;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Приветственное письмо при регистрации (legacy index.php::register()).
 * Чинит legacy-баг: там письмо уходило пустым из-за опечатки
 * `$mailer->Body = $а;` (кириллическая «а» вместо собранной переменной $f,
 * т.е. письмо реально никогда не содержало ни ФИО, ни логина). Здесь ФИО и
 * логин явно передаются в данные письма и не могут потеряться.
 */
class WelcomeMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    public function __construct(public int $userId)
    {
    }

    public function handle(MailService $mailService): void
    {
        $user = User::find($this->userId);
        if (!$user) {
            return;
        }

        $mailService->send(
            to: $user->email,
            subject: 'Регистрация в системе заказов',
            template: 'mail_welcome',
            data: [
                'fio' => $user->fio,
                'login' => $user->login,
            ],
        );
    }
}
