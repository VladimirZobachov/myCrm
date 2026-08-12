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
 * Уведомление об изменении заявки (legacy index.php::save()).
 * Получатели: пользователь, внёсший изменения, и все админы.
 * Редактор получает mail_edit_order_owner, админ — mail_edit_order_for_admin.
 */
class OrderUpdatedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    /**
     * @param array<int, string> $changes имена изменённых полей
     */
    public function __construct(public int $orderId, public int $editorId, public array $changes = [])
    {
    }

    public function handle(MailService $mailService): void
    {
        $order = Order::find($this->orderId);
        $editor = User::find($this->editorId);
        if (!$order || !$editor) {
            return;
        }

        foreach ($this->recipients($editor) as $user) {
            $mailService->send(
                to: $user->email,
                subject: "Редактирование заявки № {$order->id}",
                template: $user->id === $editor->id ? 'mail_edit_order_owner' : 'mail_edit_order_for_admin',
                data: [
                    'id' => $order->id,
                    'fio' => $user->fio,
                    'changes' => $this->changes,
                ],
            );
        }
    }

    /**
     * @return array<int, User>
     */
    private function recipients(User $editor): array
    {
        $recipients = [$editor->id => $editor];
        foreach (User::where('type_user', 1)->get() as $admin) {
            $recipients[$admin->id] ??= $admin;
        }

        return array_values($recipients);
    }
}
