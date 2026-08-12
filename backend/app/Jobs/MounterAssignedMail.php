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
 * Уведомление монтажнику о назначении на заявку (legacy mail_bind_mounter.html,
 * отправлялось из add() и save() при установке/смене created_for).
 */
class MounterAssignedMail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesMailDelivery, SerializesModels;

    public function __construct(public int $orderId, public int $mounterId)
    {
    }

    public function handle(MailService $mailService): void
    {
        $order = Order::find($this->orderId);
        $mounter = User::find($this->mounterId);
        if (!$order || !$mounter) {
            return;
        }

        $mailService->send(
            to: $mounter->email,
            subject: "Вам назначена заявка № {$order->id}",
            template: 'mail_bind_mounter',
            data: [
                'id' => $order->id,
                'fio' => $mounter->fio,
                'cab_link' => config('app.url'),
            ],
        );
    }
}
