<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

/**
 * Ролевые правила из legacy (index.php + db.class.php::getRows):
 * type_user: 1 = админ, 2 = менеджер, 3 = монтажник.
 */
class OrderPolicy
{
    /**
     * Список заявок доступен любой авторизованной роли — сама выборка
     * ограничивается Order::scopeVisibleTo() в контроллере.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        return match ((int) $user->type_user) {
            1 => true,
            2 => (int) $order->created_by === $user->id,
            3 => (int) $order->created_for === $user->id,
            default => false,
        };
    }

    /**
     * Создавать заявки могут только админ и менеджер (fillFormData/add()
     * в legacy доступны только этим ролям, у монтажника нет формы добавления).
     */
    public function store(User $user): bool
    {
        return $user->isAdmin() || $user->isManager();
    }

    /**
     * Админ редактирует любую заявку, менеджер — только созданные им самим.
     * Монтажнику разрешено редактирование своей назначенной заявки, а также
     * ещё не назначенной (created_for пуст) — чтобы отработал auto-assign
     * из legacy changeStatus().
     */
    public function update(User $user, Order $order): bool
    {
        return match ((int) $user->type_user) {
            1 => true,
            2 => (int) $order->created_by === $user->id,
            3 => $order->created_for === null || (int) $order->created_for === $user->id,
            default => false,
        };
    }

    /**
     * В legacy delete() не было ролевой проверки вовсе (act=del доступен
     * любому авторизованному) — здесь сознательно ужесточаем: удалять
     * может админ или менеджер, создавший заявку. Монтажнику — запрещено.
     */
    public function delete(User $user, Order $order): bool
    {
        return match ((int) $user->type_user) {
            1 => true,
            2 => (int) $order->created_by === $user->id,
            default => false,
        };
    }
}
