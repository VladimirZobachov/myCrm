<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\WelcomeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login: поддерживает legacy MD5-пароли с ленивой миграцией на bcrypt.
     * POST /api/auth/login {login, passwd}
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => 'required|string',
            'passwd' => 'required|string',
        ]);

        $user = User::where('login', $credentials['login'])->first();

        if (!$user) {
            return response()->json(['error' => 'Неверный логин или пароль'], 401);
        }

        // 1) Пробуем bcrypt (если хэш начинается с $2y$)
        $isBcrypt = str_starts_with($user->passwd, '$2y$');
        $passwordOk = $isBcrypt && Hash::check($credentials['passwd'], $user->passwd);

        // 2) Legacy MD5
        if (!$passwordOk && md5($credentials['passwd']) === $user->passwd) {
            $passwordOk = true;
            // 3) Ленивая миграция MD5 → bcrypt
            $user->passwd = Hash::make($credentials['passwd']);
            $user->save();
        }

        if (!$passwordOk) {
            return response()->json(['error' => 'Неверный логин или пароль'], 401);
        }

        // Для tymon/jwt-auth: логин по id
        if (!$token = auth('api')->login($user)) {
            return response()->json(['error' => 'Не удалось создать токен'], 500);
        }

        return $this->respondWithToken($token, $user);
    }

    /**
     * Register: менеджер (2) или монтажник (3), НЕ админ.
     * POST /api/auth/register {login, email, fio, passwd, type_user}
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'login' => 'required|string|max:100|unique:users,login',
            'email' => 'required|email|max:255|unique:users,email',
            'fio' => 'nullable|string|max:255',
            'passwd' => 'required|string|min:4',
            'type_user' => 'required|integer|in:2,3',
        ]);

        $user = User::create([
            'login' => $data['login'],
            'email' => $data['email'],
            'fio' => $data['fio'] ?? null,
            'passwd' => Hash::make($data['passwd']),
            'type_user' => $data['type_user'],
        ]);

        WelcomeMail::dispatch($user->id);

        $token = auth('api')->login($user);

        return response()->json([
            'message' => 'Пользователь успешно создан',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Logout: инвалидируем токен.
     * POST /api/auth/logout
     */
    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Вы вышли из системы']);
    }

    /**
     * Текущий пользователь.
     * GET /api/auth/me
     */
    public function me()
    {
        return response()->json(['user' => auth('api')->user()]);
    }

    protected function respondWithToken($token, $user)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user,
        ]);
    }
}
