<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCelebrityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role?->name === 'Admin';
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'tagline' => $this->input('tagline') ?: null,
            'photo_url' => $this->input('photo_url') ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'birth_year' => ['sometimes', 'required', 'integer', 'min:1900', 'max:2100'],
            'gender' => ['sometimes', 'required', 'string', 'in:male,female'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'photo_url' => ['nullable', 'string', 'url', 'max:2048'],
        ];
    }
}
