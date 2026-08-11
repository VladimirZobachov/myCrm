<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Ролевое разрешение проверяется политикой (OrderPolicy::store)
     * в контроллере — сюда достаточно требования аутентификации.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'trc' => 'required|string|max:255',
            'trc_other' => 'nullable|required_if:trc,Другое|string|max:255',
            'date' => 'required|date',
            'type_work' => 'required|string',
            'brand' => 'required|string|max:255',
            'where_print' => 'required|string|max:255',
            'where_other' => 'nullable|required_if:where_print,Другое|string|max:255',
            'photo' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'price_admin' => 'nullable|numeric|min:0',
            'importance' => 'required|string|max:255',
            'importance_other' => 'nullable|string|max:255',
            'created_for' => 'nullable|integer|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'Поле :attribute обязательно для заполнения.',
            'required_if' => 'Поле :attribute обязательно для заполнения.',
            'numeric' => 'Поле :attribute должно быть числом.',
            'exists' => 'Указанный пользователь не найден.',
        ];
    }
}
