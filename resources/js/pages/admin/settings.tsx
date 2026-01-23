import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';

import { update } from '@/actions/App/Http/Controllers/Admin/SettingsController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Settings',
        href: '#',
    },
];

interface Settings {
    SYSTEM_PROMPT?: string;
    USER_PROMPT?: string;
    SUBTITLES?: string[];
    REACTIONS?: {
        wrong?: string[];
        close?: string[];
    };
    BUTTON_COPY?: string[];
    WIN_CAPTIONS?: string[];
    WIN_SUB_CAPTIONS?: string[];
    LOSE_CAPTIONS?: string[];
    LOSE_SUB_CAPTIONS?: string[];
}

export default function Settings({ settings }: { settings: Settings }) {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    const updateSetting = (key: keyof Settings, value: unknown) => {
        setLocalSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateArrayItem = (key: keyof Settings, index: number, value: string) => {
        const current = (localSettings[key] as string[]) || [];
        const updated = [...current];
        updated[index] = value;
        updateSetting(key, updated);
    };

    const addArrayItem = (key: keyof Settings) => {
        const current = (localSettings[key] as string[]) || [];
        updateSetting(key, [...current, '']);
    };

    const removeArrayItem = (key: keyof Settings, index: number) => {
        const current = (localSettings[key] as string[]) || [];
        const updated = current.filter((_, i) => i !== index);
        updateSetting(key, updated);
    };

    const updateReactionItem = (type: 'wrong' | 'close', index: number, value: string) => {
        const current = localSettings.REACTIONS?.[type] || [];
        const updated = [...current];
        updated[index] = value;
        updateSetting('REACTIONS', {
            ...localSettings.REACTIONS,
            [type]: updated,
        });
    };

    const addReactionItem = (type: 'wrong' | 'close') => {
        const current = localSettings.REACTIONS?.[type] || [];
        updateSetting('REACTIONS', {
            ...localSettings.REACTIONS,
            [type]: [...current, ''],
        });
    };

    const removeReactionItem = (type: 'wrong' | 'close', index: number) => {
        const current = localSettings.REACTIONS?.[type] || [];
        const updated = current.filter((_, i) => i !== index);
        updateSetting('REACTIONS', {
            ...localSettings.REACTIONS,
            [type]: updated,
        });
    };

    const title = 'Settings';
    const description = 'Manage Celebrity Sh*ggers game settings, prompts, captions, and reactions from the admin panel.';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title}>
                <meta name="description" content={description} />
                {currentUrl && <link rel="canonical" href={currentUrl} />}

                {/* Open Graph / Facebook */}
                {currentUrl && <meta property="og:url" content={currentUrl} />}
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                {ogImage && <meta property="og:image" content={ogImage} />}

                {/* Twitter */}
                {currentUrl && <meta name="twitter:url" content={currentUrl} />}
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                {ogImage && <meta name="twitter:image" content={ogImage} />}
            </Head>

            <AdminLayout title="Settings" description="Manage game settings and prompts">
                <div className="space-y-12">
                    <Form
                        action={update.url()}
                        method={update().method}
                        data={{
                            settings: localSettings,
                        }}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-12"
                    >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    {/* System Prompt */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="System Prompt"
                                            description="The system prompt used for AI game generation"
                                        />
                                        <div className="grid gap-2">
                                            <Label htmlFor="SYSTEM_PROMPT" className="font-body text-slate-900">
                                                System Prompt
                                            </Label>
                                            <Textarea
                                                id="SYSTEM_PROMPT"
                                                name="settings[SYSTEM_PROMPT]"
                                                value={localSettings.SYSTEM_PROMPT || ''}
                                                onChange={(e) => updateSetting('SYSTEM_PROMPT', e.target.value)}
                                                rows={20}
                                                className="font-mono text-sm"
                                            />
                                            <InputError className="mt-2" message={errors['settings.SYSTEM_PROMPT']} />
                                        </div>
                                    </div>

                                    {/* User Prompt */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="User Prompt"
                                            description="The user prompt template used for AI game generation"
                                        />
                                        <div className="grid gap-2">
                                            <Label htmlFor="USER_PROMPT" className="font-body text-slate-900">
                                                User Prompt Template
                                            </Label>
                                            <Textarea
                                                id="USER_PROMPT"
                                                name="settings[USER_PROMPT]"
                                                value={localSettings.USER_PROMPT || ''}
                                                onChange={(e) => updateSetting('USER_PROMPT', e.target.value)}
                                                rows={15}
                                                className="font-mono text-sm"
                                            />
                                            <InputError className="mt-2" message={errors['settings.USER_PROMPT']} />
                                        </div>
                                    </div>

                                    {/* Subtitles */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Subtitles"
                                            description="Random subtitles shown on the game page"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.SUBTITLES || []).map((subtitle, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={subtitle}
                                                        onChange={(e) => updateArrayItem('SUBTITLES', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('SUBTITLES', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('SUBTITLES')}
                                            >
                                                Add Subtitle
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.SUBTITLES']} />
                                    </div>

                                    {/* Reactions */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Reactions"
                                            description="Reaction messages for wrong and close guesses"
                                        />
                                        <div className="space-y-6">
                                            <div>
                                                <Label className="font-body text-slate-900 mb-2 block">Wrong Reactions</Label>
                                                <div className="space-y-2">
                                                    {(localSettings.REACTIONS?.wrong || []).map((reaction, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                type="text"
                                                                value={reaction}
                                                                onChange={(e) => updateReactionItem('wrong', index, e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => removeReactionItem('wrong', index)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => addReactionItem('wrong')}
                                                    >
                                                        Add Wrong Reaction
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="font-body text-slate-900 mb-2 block">Close Reactions</Label>
                                                <div className="space-y-2">
                                                    {(localSettings.REACTIONS?.close || []).map((reaction, index) => (
                                                        <div key={index} className="flex gap-2">
                                                            <Input
                                                                type="text"
                                                                value={reaction}
                                                                onChange={(e) => updateReactionItem('close', index, e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => removeReactionItem('close', index)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => addReactionItem('close')}
                                                    >
                                                        Add Close Reaction
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.REACTIONS']} />
                                    </div>

                                    {/* Button Copy */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Button Copy"
                                            description="Button text based on remaining guesses"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.BUTTON_COPY || []).map((copy, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={copy}
                                                        onChange={(e) => updateArrayItem('BUTTON_COPY', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('BUTTON_COPY', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('BUTTON_COPY')}
                                            >
                                                Add Button Copy
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.BUTTON_COPY']} />
                                    </div>

                                    {/* Win Captions */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Win Captions"
                                            description="Captions shown when the player wins"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.WIN_CAPTIONS || []).map((caption, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={caption}
                                                        onChange={(e) => updateArrayItem('WIN_CAPTIONS', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('WIN_CAPTIONS', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('WIN_CAPTIONS')}
                                            >
                                                Add Win Caption
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.WIN_CAPTIONS']} />
                                    </div>

                                    {/* Win Sub Captions */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Win Sub Captions"
                                            description="Sub-captions shown when the player wins"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.WIN_SUB_CAPTIONS || []).map((caption, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={caption}
                                                        onChange={(e) => updateArrayItem('WIN_SUB_CAPTIONS', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('WIN_SUB_CAPTIONS', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('WIN_SUB_CAPTIONS')}
                                            >
                                                Add Win Sub Caption
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.WIN_SUB_CAPTIONS']} />
                                    </div>

                                    {/* Lose Captions */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Lose Captions"
                                            description="Captions shown when the player loses"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.LOSE_CAPTIONS || []).map((caption, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={caption}
                                                        onChange={(e) => updateArrayItem('LOSE_CAPTIONS', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('LOSE_CAPTIONS', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('LOSE_CAPTIONS')}
                                            >
                                                Add Lose Caption
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.LOSE_CAPTIONS']} />
                                    </div>

                                    {/* Lose Sub Captions */}
                                    <div className="space-y-6">
                                        <HeadingSmall
                                            title="Lose Sub Captions"
                                            description="Sub-captions shown when the player loses"
                                        />
                                        <div className="space-y-2">
                                            {(localSettings.LOSE_SUB_CAPTIONS || []).map((caption, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        type="text"
                                                        value={caption}
                                                        onChange={(e) => updateArrayItem('LOSE_SUB_CAPTIONS', index, e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => removeArrayItem('LOSE_SUB_CAPTIONS', index)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => addArrayItem('LOSE_SUB_CAPTIONS')}
                                            >
                                                Add Lose Sub Caption
                                            </Button>
                                        </div>
                                        <InputError className="mt-2" message={errors['settings.LOSE_SUB_CAPTIONS']} />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="coral"
                                            disabled={processing}
                                        >
                                            Save
                                        </Button>
                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-slate-600 font-body">
                                                Saved
                                            </p>
                                        </Transition>
                                    </div>
                                </>
                            )}
                        </Form>
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
