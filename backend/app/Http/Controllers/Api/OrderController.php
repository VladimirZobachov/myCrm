<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Jobs\CommentChangedMail;
use App\Jobs\MounterAssignedMail;
use App\Jobs\OrderCreatedMail;
use App\Jobs\OrderUpdatedMail;
use App\Jobs\StatusChangedMail;
use App\Models\Order;
use App\Models\OrderPosition;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    use AuthorizesRequests;

    /**
     * GET /api/orders
     * Список заявок с ролевой фильтрацией (legacy db.class.php::getRows)
     * и постраничным выводом (50/стр, как в legacy).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $user = $request->user();
        $archived = $request->boolean('archived', false);

        $allowedSort = ['id', 'date_create', 'date', 'price', 'price_admin', 'status', 'importance'];
        $sortParts = explode('|', $request->string('sort', 'id|DESC')->toString());
        $sortBy = in_array($sortParts[0] ?? 'id', $allowedSort, true) ? $sortParts[0] : 'id';
        $sortDir = strtoupper($sortParts[1] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

        $query = Order::query()
            ->with(['createdBy:id,fio,email,type_user', 'createdFor:id,fio,email,type_user', 'photos'])
            ->visibleTo($user)
            ->where('is_archived', $archived ? 1 : 0);

        if ($request->filled('status')) {
            $query->where('status', $request->integer('status'));
        }

        // Ручной (drag-and-drop) порядок применяется только пока пользователь
        // не запросил обычную сортировку явно (клик по заголовку колонки
        // всегда передаёт ?sort=...).
        $hasManualOrder = !$request->has('sort')
            && OrderPosition::where('user_id', $user->id)->exists();

        if ($hasManualOrder) {
            $query
                ->leftJoin('order_positions', function ($join) use ($user) {
                    $join->on('orders.id', '=', 'order_positions.order_id')
                        ->where('order_positions.user_id', '=', $user->id);
                })
                ->select('orders.*')
                ->orderByRaw('order_positions.position is null')
                ->orderBy('order_positions.position')
                ->orderBy('orders.date_create', 'desc');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $orders = $query
            ->paginate(50)
            ->withQueryString();

        return response()->json($orders);
    }

    /**
     * POST /api/orders
     * Создание заявки (только админ/менеджер, см. OrderPolicy::store).
     * price_admin = price * 0.7, если явно не передан (legacy add()).
     */
    public function store(StoreOrderRequest $request)
    {
        $this->authorize('store', Order::class);

        $user = $request->user();
        $data = $request->validated();

        // created_for на этапе создания назначает только админ (в legacy это поле
        // формы доступно лишь type_user==1)
        if (!$user->isAdmin()) {
            unset($data['created_for'], $data['price_admin']);
        }

        $data['created_by'] = $user->id;
        $data['status'] = 1;
        $data['is_archived'] = 0;
        $data['date_create'] = now();
        $data['photo'] = $data['photo'] ?? '';
        $data['importance_other'] = $data['importance_other'] ?? '';
        $data['price_admin'] = $data['price_admin'] ?? (int) round(((float) $data['price']) * 0.7);

        $order = Order::create($data);

        OrderCreatedMail::dispatch($order->id);

        return response()->json($order->load(['createdBy', 'createdFor']), 201);
    }

    /**
     * GET /api/orders/{order}
     */
    public function show(Order $order)
    {
        $this->authorize('view', $order);

        return response()->json($order->load(['createdBy', 'createdFor', 'photos']));
    }

    /**
     * PUT/PATCH /api/orders/{order}
     * Особенность legacy changeStatus(): если заявка ещё не назначена
     * (created_for пуст) и её редактирует монтажник, он автоматически
     * становится исполнителем (created_for = его id).
     */
    public function update(UpdateOrderRequest $request, Order $order)
    {
        $this->authorize('update', $order);

        $user = $request->user();

        $data = $request->validated();

        // price_admin правит напрямую только админ, остальным — пересчёт от price
        if (!$user->isAdmin()) {
            unset($data['price_admin']);
        }
        if (array_key_exists('price', $data) && !array_key_exists('price_admin', $data)) {
            $data['price_admin'] = (int) round(((float) $data['price']) * 0.7);
        }

        // только админ/менеджер могут переназначать исполнителя вручную
        if (array_key_exists('created_for', $data) && $user->isInstaller()) {
            unset($data['created_for']);
        }

        if ($user->isInstaller() && $order->created_for === null) {
            $data['created_for'] = $user->id;
        }

        $previousCreatedFor = $order->created_for;

        $order->update($data);

        if (array_key_exists('created_for', $data) && $data['created_for'] && $data['created_for'] !== $previousCreatedFor) {
            MounterAssignedMail::dispatch($order->id, (int) $data['created_for']);
        }

        $changes = $order->getChanges();
        unset($changes['created_for']);
        if ($changes) {
            OrderUpdatedMail::dispatch($order->id, $user->id, array_keys($changes));
        }

        return response()->json($order->fresh()->load(['createdBy', 'createdFor']));
    }

    /**
     * DELETE /api/orders/{order}
     */
    public function destroy(Order $order)
    {
        $this->authorize('delete', $order);

        $order->delete();

        return response()->json(['message' => 'Заявка удалена']);
    }

    /**
     * PATCH /api/orders/{order}/comment
     * Обновление комментария по legacy-логике updateComment():
     * монтажник (type 3) → comments, менеджер (type 2) → comment_manager,
     * админ (type 1) → comments если для админа, иначе comment_manager.
     */
    public function updateComment(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $user = $request->user();
        $data = $request->validate([
            'comment' => 'required|string',
            'for' => 'nullable|integer|in:1,2',
        ]);

        if ((int) $user->type_user === 3) {
            $order->comments = $data['comment'];
        } elseif ((int) $user->type_user === 2) {
            $order->comment_manager = $data['comment'];
        } else { // админ (1)
            $order->comments = $data['comment'];
        }
        $order->save();

        CommentChangedMail::dispatch($order->id, $data['comment'], $user->id);

        return response()->json($order->fresh()->load(['createdBy', 'createdFor']));
    }

    /**
     * PATCH /api/orders/{order}/status
     * Смена статуса. Legacy auto-assign: монтажник, берущий неназначенную
     * заявку (created_for=0), автоматически становится её исполнителем.
     */
    public function updateStatus(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $user = $request->user();
        $data = $request->validate([
            'status' => ['required', Rule::in([1, 2, 3])],
        ]);

        // Legacy auto-assign (changeStatus в index.php)
        if ($user->isInstaller() && $order->created_for === null) {
            $order->created_for = $user->id;
        }

        $order->status = $data['status'];
        $order->save();

        StatusChangedMail::dispatch($order->id, $order->status);

        return response()->json($order->fresh()->load(['createdBy', 'createdFor']));
    }

    /**
     * PATCH /api/orders/{order}/archive
     * Архивация/разархивация заявки.
     */
    public function archive(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $data = $request->validate([
            'archived' => 'required|boolean',
        ]);

        $order->is_archived = $data['archived'] ? 1 : 0;
        $order->save();

        return response()->json($order->fresh()->load(['createdBy', 'createdFor']));
    }

    /**
     * PATCH /api/orders/batch-status
     * Массовая смена статуса. Заявки фильтруются через scopeVisibleTo —
     * монтажник может менять статус только уже назначенных ему заявок
     * (в отличие от одиночного updateStatus() здесь нет auto-assign
     * неназначенных заявок: это операция над явно выбранным списком,
     * а не над одной открытой карточкой).
     */
    public function batchStatus(Request $request)
    {
        $data = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'integer',
            'status' => ['required', Rule::in([1, 2, 3])],
        ]);

        $user = $request->user();
        $orders = Order::visibleTo($user)->whereIn('id', $data['order_ids'])->get();

        $updated = [];
        foreach ($orders as $order) {
            $order->status = $data['status'];
            $order->save();
            StatusChangedMail::dispatch($order->id, $order->status);
            $updated[] = $order->id;
        }

        return response()->json(['updated' => $updated]);
    }

    /**
     * PATCH /api/orders/batch-archive
     * Массовая архивация/разархивация — та же ролевая видимость, что и
     * у batchStatus().
     */
    public function batchArchive(Request $request)
    {
        $data = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'integer',
            'archived' => 'required|boolean',
        ]);

        $user = $request->user();
        $orders = Order::visibleTo($user)->whereIn('id', $data['order_ids'])->get();

        $updated = [];
        foreach ($orders as $order) {
            $order->is_archived = $data['archived'] ? 1 : 0;
            $order->save();
            $updated[] = $order->id;
        }

        return response()->json(['updated' => $updated]);
    }

    /**
     * PATCH /api/orders/batch-comment
     * Массовое добавление комментария — маршрутизация по роли, как в
     * updateComment(): монтажник и админ пишут в comments, менеджер —
     * в comment_manager.
     */
    public function batchComment(Request $request)
    {
        $data = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'integer',
            'comment' => 'required|string',
        ]);

        $user = $request->user();
        $orders = Order::visibleTo($user)->whereIn('id', $data['order_ids'])->get();

        $updated = [];
        foreach ($orders as $order) {
            if ((int) $user->type_user === 2) {
                $order->comment_manager = $data['comment'];
            } else {
                $order->comments = $data['comment'];
            }
            $order->save();
            CommentChangedMail::dispatch($order->id, $data['comment'], $user->id);
            $updated[] = $order->id;
        }

        return response()->json(['updated' => $updated]);
    }

    /**
     * DELETE /api/orders/batch
     * Массовое удаление — по требованию клиента доступно только админу
     * (строже одиночного destroy(), который разрешён и менеджеру-владельцу).
     */
    public function batchDelete(Request $request)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            abort(403, 'Массовое удаление доступно только администратору');
        }

        $data = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'integer',
        ]);

        $deleted = Order::whereIn('id', $data['order_ids'])->pluck('id')->all();
        Order::whereIn('id', $data['order_ids'])->delete();

        return response()->json(['deleted' => $deleted]);
    }
}
