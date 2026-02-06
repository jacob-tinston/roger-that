import { Head, Link, useForm } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { create as createRoute, index as celebritiesIndex, store } from '@/routes/admin/celebrities';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Celebrities', href: celebritiesIndex().url },
    { title: 'Add celebrity', href: createRoute().url },
];

export default function CelebrityCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        birth_year: new Date().getFullYear() - 25,
        gender: 'female',
        tagline: '',
        photo_url: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store().url, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add celebrity">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminLayout title="Add celebrity" description="Create a new celebrity">
                <form onSubmit={submit} className="max-w-xl space-y-6">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="birth_year">Birth year</Label>
                            <Input
                                id="birth_year"
                                type="number"
                                min={1900}
                                max={2100}
                                value={data.birth_year}
                                onChange={(e) => setData('birth_year', Number(e.target.value))}
                                className="mt-1"
                                required
                            />
                            <InputError message={errors.birth_year} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={data.gender}
                                onValueChange={(v) => setData('gender', v)}
                            >
                                <SelectTrigger id="gender" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.gender} className="mt-1" />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="tagline">Tagline (optional)</Label>
                        <Textarea
                            id="tagline"
                            value={data.tagline}
                            onChange={(e) => setData('tagline', e.target.value)}
                            className="mt-1"
                            rows={2}
                        />
                        <InputError message={errors.tagline} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="photo_url">Photo URL (optional)</Label>
                        <Input
                            id="photo_url"
                            type="url"
                            value={data.photo_url}
                            onChange={(e) => setData('photo_url', e.target.value)}
                            className="mt-1"
                            placeholder="https://..."
                        />
                        <InputError message={errors.photo_url} className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create celebrity'}
                        </Button>
                        <Button type="button" variant="secondary" asChild>
                            <Link href={celebritiesIndex().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </AdminLayout>
        </AppLayout>
    );
}
