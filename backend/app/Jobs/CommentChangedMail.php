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
 * Уведомление об изменении комментария (legacy index.php::updateComment()).
 * Монтажник/менеджер меняет комментарий → уведомляются админы, шаблон
 * mail_change_comment_for_admin (детальный, с данными заявки).
 * Админ меняет комментарий → уведомляются владелец заявки и админы,
 * шаблон mail_change_comment (короткий).
 */
class CommentChangedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    public function __construct(public int $orderId, public string $comment, public int $authorId)
    {
    }

    public function handle(MailService $mailService): void
    {
        $order = Order::with('createdBy')->find($this->orderId);
        $author = User::find($this->authorId);
        if (!$order || !$author) {
            return;
        }

        $forName = $author->isInstaller() ? 'монтажника' : 'менеджера';
        $subject = $author->isAdmin()
            ? "Изменен комментарий {$author->fio} по заявке № {$order->id}"
            : "Комментарий {$forName}: {$author->fio} по заявке № {$order->id}";
        $template = $author->isAdmin() ? 'mail_change_comment' : 'mail_change_comment_for_admin';

        foreach ($this->recipients($order, $author) as $user) {
            $mailService->send(
                to: $user->email,
                subject: $subject,
                template: $template,
                data: [
                    'id' => $order->id,
                    'fio' => $user->fio,
                    'comment' => $this->comment,
                    'date' => optional($order->date)->toDateString(),
                    'trc' => $order->trc_other ?: $order->trc,
                    'type_work' => $order->type_work,
                    'photo' => $order->photo,
                    'price' => $order->price,
                ],
            );
        }
    }

    /**
     * @return array<int, User>
     */
    private function recipients(Order $order, User $author): array
    {
        $recipients = [];

        if ($author->isAdmin() && $order->createdBy) {
            $recipients[$order->createdBy->id] = $order->createdBy;
        }
        foreach (User::where('type_user', 1)->get() as $admin) {
            $recipients[$admin->id] ??= $admin;
        }

        return array_values($recipients);
    }
}
