<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Личный кабинет (legacy myCabinet): смена своих email/ФИО/пароля.
 * Правило: passwd пустой → не менять.
 */
class MeController extends Controller
{
    /**
     * GET /api/me
     */
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json($user->only(['id', 'login', 'email', 'fio', 'type_user']));
    }

    /**
     * PATCH /api/me
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'email' => ['sometimes', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
            'fio' => 'sometimes|nullable|string|max:255',
            'passwd' => 'sometimes|nullable|string|min:4',
        ]);

        // "Пусто = не менять"
        if (empty($data['passwd'])) {
            unset($data['passwd']);
        } else {
            $data['passwd'] = Hash::make($data['passwd']);
        }

        $user->update($data);

        return response()->json($user->only(['id', 'login', 'email', 'fio', 'type_user']));
    }
}
