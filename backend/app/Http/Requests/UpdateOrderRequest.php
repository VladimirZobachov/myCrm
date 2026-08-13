<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'trc' => 'sometimes|string|max:255',
            'trc_other' => 'nullable|required_if:trc,Другое|string|max:255',
            'date' => 'sometimes|date',
            'type_work' => 'sometimes|string',
            'brand' => 'sometimes|string|max:255',
            'where_print' => 'sometimes|string|max:255',
            'where_other' => 'nullable|required_if:where_print,Другое|string|max:255',
            'photo' => 'sometimes|nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'price_admin' => 'sometimes|numeric|min:0',
            'importance' => 'sometimes|string|max:255',
            'importance_other' => 'nullable|string|max:255',
            'created_for' => 'sometimes|nullable|integer|exists:users,id',
            'status' => ['sometimes', Rule::in([1, 2, 3])],
            'is_archived' => 'sometimes|boolean',
            'comments' => 'sometimes|nullable|string',
            'comment_manager' => 'sometimes|nullable|string',
        ];
    }
    public function messages(): array
    {
        return [
            'required_if' => 'Поле :attribute обязательно для заполнения.',
            'numeric' => 'Поле :attribute должно быть числом.',
            'exists' => 'Указанный пользователь не найден.',
            'in' => 'Недопустимое значение поля :attribute.',
        ];
    }
}
