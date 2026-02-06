import { Head, Link, useForm, usePage } from '@inertiajs/react';

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
import { index as celebritiesIndex, show, update } from '@/routes/admin/celebrities';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

interface CelebrityData {
    id: number;
    name: string;
    birth_year: number;
    gender: string;
    tagline: string | null;
    photo_url: string | null;
}

interface EditPageProps {
    celebrity: CelebrityData;
}

export default function CelebrityEdit() {
    const { celebrity } = usePage<EditPageProps>().props;
    const { data, setData, put, processing, errors } = useForm({
        name: celebrity.name,
        birth_year: celebrity.birth_year,
        gender: celebrity.gender,
        tagline: celebrity.tagline ?? '',
        photo_url: celebrity.photo_url ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Celebrities', href: celebritiesIndex().url },
        { title: celebrity.name, href: show.url(celebrity.id) },
        { title: 'Edit', href: '#' },
    ];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update.url(celebrity.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${celebrity.name}`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminLayout title={`Edit ${celebrity.name}`} description="Update celebrity details">
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
                            {processing ? 'Saving...' : 'Save changes'}
                        </Button>
                        <Button type="button" variant="secondary" asChild>
                            <Link href={show.url(celebrity.id)}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </AdminLayout>
        </AppLayout>
    );
}
