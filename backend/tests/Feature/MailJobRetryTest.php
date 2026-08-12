<?php

namespace Tests\Feature;

use App\Jobs\CommentChangedMail;
use App\Jobs\MounterAssignedMail;
use App\Jobs\OrderCreatedMail;
use App\Jobs\OrderUpdatedMail;
use App\Jobs\StatusChangedMail;
use App\Jobs\WelcomeMail;
use Exception;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Задача #45: у всех mail-Job'ов должна быть единая политика ретраев —
 * 3 попытки, таймаут 60с на попытку, возрастающая задержка между попытками
 * (5с, 30с, 2 мин), и финальный провал (после исчерпания попыток) должен
 * логироваться отдельно через Log::error.
 */
class MailJobRetryTest extends TestCase
{
    public static function mailJobClassesProvider(): array
    {
        return [
            'CommentChangedMail' => [new CommentChangedMail(1, 'comment', 1)],
            'MounterAssignedMail' => [new MounterAssignedMail(1, 1)],
            'OrderCreatedMail' => [new OrderCreatedMail(1)],
            'OrderUpdatedMail' => [new OrderUpdatedMail(1, 1)],
            'StatusChangedMail' => [new StatusChangedMail(1, 1)],
            'WelcomeMail' => [new WelcomeMail(1)],
        ];
    }

    #[DataProvider('mailJobClassesProvider')]
    public function test_mail_job_has_three_tries_and_sixty_second_timeout(object $job): void
    {
        $this->assertSame(3, $job->tries);
        $this->assertSame(60, $job->timeout);
    }

    #[DataProvider('mailJobClassesProvider')]
    public function test_mail_job_backoff_increases_between_attempts(object $job): void
    {
        $this->assertSame([5, 30, 120], $job->backoff());
    }

    #[DataProvider('mailJobClassesProvider')]
    public function test_mail_job_logs_error_when_permanently_failed(object $job): void
    {
        Log::spy();

        $job->failed(new Exception('smtp connection refused'));

        Log::shouldHaveReceived('error')
            ->once()
            ->withArgs(fn ($message) => str_contains($message, $job::class)
                && str_contains($message, 'failed permanently after 3 attempts')
                && str_contains($message, 'smtp connection refused'));
    }
}
