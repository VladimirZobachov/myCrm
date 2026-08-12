<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesMailDelivery;
use App\Models\Order;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Уведомление о смене статуса заявки (legacy index.php::updateStatus()).
 * Получатели: создатель заявки и назначенный монтажник.
 */
class StatusChangedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    private const STATUS_TEXT = [1 => 'В ожидании', 2 => 'Принят', 3 => 'Выполнено'];

    public function __construct(public int $orderId, public int $status)
    {
    }

    public function handle(MailService $mailService): void
    {
        $order = Order::with(['createdBy', 'createdFor'])->find($this->orderId);
        if (!$order) {
            return;
        }

        foreach ($this->recipients($order) as $user) {
            $mailService->send(
                to: $user->email,
                subject: 'Изменения статуса заявки',
                template: 'mail_change_status',
                data: [
                    'id' => $order->id,
                    'fio' => $user->fio,
                    'status' => self::STATUS_TEXT[$this->status] ?? '',
                    'type_work' => $order->type_work,
                ],
            );
        }
    }

    /**
     * @return array<int, User>
     */
    private function recipients(Order $order): array
    {
        $recipients = [];
        if ($order->createdBy) {
            $recipients[$order->createdBy->id] = $order->createdBy;
        }
        if ($order->createdFor) {
            $recipients[$order->createdFor->id] = $order->createdFor;
        }

        return array_values($recipients);
    }
}
