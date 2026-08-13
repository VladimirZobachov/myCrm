<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderPosition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderPositionController extends Controller
{
    /**
     * GET /api/orders/positions
     * Ручной порядок заявок текущего пользователя (или null, если не задан).
     */
    public function show(Request $request)
    {
        $orderIds = OrderPosition::where('user_id', $request->user()->id)
            ->orderBy('position')
            ->pluck('order_id')
            ->values();

        return response()->json([
            'order_ids' => $orderIds->isEmpty() ? null : $orderIds,
        ]);
    }

    /**
     * PUT /api/orders/positions
     * Сохраняет новый ручной порядок заявок (drag-and-drop) для текущего
     * пользователя. Полностью заменяет предыдущий порядок.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'order_ids' => 'required|array',
            'order_ids.*' => 'integer',
        ]);

        $userId = $request->user()->id;

        DB::transaction(function () use ($userId, $data) {
            OrderPosition::where('user_id', $userId)->delete();

            $now = now();
            $rows = [];
            foreach (array_values($data['order_ids']) as $index => $orderId) {
                $rows[] = [
                    'user_id' => $userId,
                    'order_id' => $orderId,
                    'position' => $index,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if ($rows) {
                OrderPosition::insert($rows);
            }
        });

        return response()->json(['order_ids' => array_values($data['order_ids'])]);
    }
}
