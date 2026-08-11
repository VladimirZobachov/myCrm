<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use AuthorizesRequests;

    /**
     * GET /api/users — список пользователей (только админ).
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->select('id', 'login', 'email', 'fio', 'type_user')
            ->paginate(50);

        return response()->json($users);
    }

    /**
     * GET /api/users/{user} — детали пользователя (только админ).
     */
    public function show(User $user)
    {
        $this->authorize('view', $user);

        return response()->json($user->only(['id', 'login', 'email', 'fio', 'type_user']));
    }

    /**
     * POST /api/users — создание пользователя (только админ).
     * Legacy users(): админ может создать любую роль (1/2/3).
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'login' => 'required|string|max:100|unique:users,login',
            'email' => 'required|email|max:255|unique:users,email',
            'fio' => 'nullable|string|max:255',
            'passwd' => 'required|string|min:4',
            'type_user' => 'required|integer|in:1,2,3',
        ]);

        $user = User::create([
            'login' => $data['login'],
            'email' => $data['email'],
            'fio' => $data['fio'] ?? null,
            'passwd' => Hash::make($data['passwd']),
            'type_user' => $data['type_user'],
        ]);

        return response()->json($user->only(['id', 'login', 'email', 'fio', 'type_user']), 201);
    }

    /**
     * PUT/PATCH /api/users/{user} — обновление (только админ).
     * Правило legacy: passwd пустой → не менять.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'login' => ['sometimes', 'string', 'max:100', Rule::unique('users', 'login')->ignore($user->id)],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'fio' => 'sometimes|nullable|string|max:255',
            'passwd' => 'sometimes|nullable|string|min:4',
            'type_user' => 'sometimes|integer|in:1,2,3',
        ]);

        // "Пусто = не менять" (legacy users())
        if (empty($data['passwd'])) {
            unset($data['passwd']);
        } else {
            $data['passwd'] = Hash::make($data['passwd']);
        }

        $user->update($data);

        return response()->json($user->only(['id', 'login', 'email', 'fio', 'type_user']));
    }

    /**
     * DELETE /api/users/{user} — удаление (только админ).
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        if ($user->id === auth('api')->id()) {
            return response()->json(['error' => 'Нельзя удалить самого себя'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Пользователь удалён']);
    }
}
