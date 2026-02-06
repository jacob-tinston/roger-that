<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCelebrityRelationshipRequest extends FormRequest
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
            'celebrity_1_id' => ['required', 'integer', 'exists:celebrities,id', Rule::notIn([$this->input('celebrity_2_id')])],
            'celebrity_2_id' => ['required', 'integer', 'exists:celebrities,id', Rule::notIn([$this->input('celebrity_1_id')])],
            'redirect_celebrity_id' => ['nullable', 'integer', 'exists:celebrities,id'],
        ];
    }
}
