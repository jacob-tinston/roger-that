<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'Admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'answer_id' => ['required', 'integer', 'exists:celebrities,id'],
            'subject_ids' => ['required', 'array', 'size:4'],
            'subject_ids.*' => ['required', 'integer', 'exists:celebrities,id', 'distinct'],
        ];
    }
}
