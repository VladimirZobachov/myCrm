<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPhoto;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PhotoController extends Controller
{
    use AuthorizesRequests;

    /**
     * POST /api/orders/{order}/photos
     */
    public function store(Request $request, Order $order)
    {
        $this->authorize('view', $order);

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,webp|max:10240',
        ]);

        $path = $request->file('photo')->store('order-photos', 'public');

        $photo = OrderPhoto::create([
            'order_id' => $order->id,
            'path' => $path,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json([
            'id' => $photo->id,
            'url' => Storage::disk('public')->url($path),
        ], 201);
    }

    /**
     * DELETE /api/orders/photos/{photo}
     * Удалить может владелец загрузки, админ, либо менеджер — создатель заявки.
     */
    public function destroy(Request $request, OrderPhoto $photo)
    {
        $user = $request->user();
        $order = $photo->order;

        $canDelete = $user->isAdmin()
            || (int) $photo->uploaded_by === $user->id
            || ($user->isManager() && $order && (int) $order->created_by === $user->id);

        if (!$canDelete) {
            abort(403, 'Недостаточно прав для удаления фото');
        }

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Фото удалено']);
    }
}
