<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
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
            'settings' => ['required', 'array'],
            'settings.CELEBRITIES_SYSTEM_PROMPT' => ['nullable', 'string'],
            'settings.CELEBRITIES_USER_PROMPT' => ['nullable', 'string'],
            'settings.CELEBRITIES_RELATIONSHIPS_SYSTEM_PROMPT' => ['nullable', 'string'],
            'settings.CELEBRITIES_RELATIONSHIPS_USER_PROMPT' => ['nullable', 'string'],
            'settings.SUBTITLES' => ['nullable', 'array'],
            'settings.REACTIONS' => ['nullable', 'array'],
            'settings.REACTIONS.wrong' => ['nullable', 'array'],
            'settings.REACTIONS.close' => ['nullable', 'array'],
            'settings.BUTTON_COPY' => ['nullable', 'array'],
            'settings.WIN_CAPTIONS' => ['nullable', 'array'],
            'settings.LOSE_CAPTIONS' => ['nullable', 'array'],
            'settings.LOSE_SUB_CAPTIONS' => ['nullable', 'array'],
        ];
    }
}
