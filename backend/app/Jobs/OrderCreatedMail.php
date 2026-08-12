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
 * Уведомление о создании заявки (legacy index.php::add()).
 * Получатели: создатель заявки, назначенный монтажник (если есть) и все админы.
 * Шаблон подбирается по роли получателя: mail_bind_mounter / mail_create_order_owner /
 * mail_create_order_for_admin.
 */
class OrderCreatedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    private const STATUS_TEXT = [1 => 'В ожидании', 2 => 'Принят', 3 => 'Выполнено'];

    public function __construct(public int $orderId)
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
                subject: "Заявка на монтаж № {$order->id}",
                template: $this->templateFor($order, $user),
                data: [
                    'id' => $order->id,
                    'fio' => $user->fio,
                    'status' => self::STATUS_TEXT[$order->status] ?? '',
                    'trc' => $order->trc_other ?: $order->trc,
                    'date' => optional($order->date)->toDateString(),
                    'type_work' => $order->type_work,
                    'price' => $order->price,
                    'manager' => $order->createdBy?->fio,
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
        foreach (User::where('type_user', 1)->get() as $admin) {
            $recipients[$admin->id] ??= $admin;
        }

        return array_values($recipients);
    }

    private function templateFor(Order $order, User $user): string
    {
        return match (true) {
            $user->isInstaller() => 'mail_bind_mounter',
            $user->id === $order->created_by => 'mail_create_order_owner',
            default => 'mail_create_order_for_admin',
        };
    }
}
