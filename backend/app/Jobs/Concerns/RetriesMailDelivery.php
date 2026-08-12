<?php

namespace App\Jobs\Concerns;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Общая политика ретраев для mail-Job'ов (задача #45).
 * MailService пробрасывает исключение при неудачной отправке (после того,
 * как сам залогирует ошибку), поэтому джоба считается упавшей и queue:work
 * (см. deploy/supervisor/queue.conf, --tries=3 --timeout=60) повторяет её
 * с возрастающей задержкой: 5с, 30с, 2 мин.
 */
trait RetriesMailDelivery
{
    public int $tries = 3;

    public int $timeout = 60;

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [5, 30, 120];
    }

    public function failed(?Throwable $exception): void
    {
        Log::error(sprintf(
            'mail job %s failed permanently after %d attempts: %s',
            static::class,
            $this->tries,
            $exception?->getMessage() ?? 'unknown error',
        ));
    }
}
