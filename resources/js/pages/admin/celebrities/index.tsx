import { Head, Link, usePage } from '@inertiajs/react';
import { Plus, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { create, index as celebritiesIndex, show } from '@/routes/admin/celebrities';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Celebrities',
        href: celebritiesIndex().url,
    },
];

interface Celebrity {
    id: number;
    name: string;
    birth_year: number;
    gender: string;
    tagline: string | null;
    photo_url: string | null;
    related_subjects_count: number;
    related_answers_count: number;
    created_at: string;
    url: string;
}

interface CelebritiesIndexPageProps {
    celebrities: Celebrity[];
}

const GENDER_OPTIONS = [
    { value: 'all', label: 'All genders' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
] as const;

const SORT_OPTIONS = [
    { value: 'relationships_desc', label: 'Most relationships' },
    { value: 'relationships_asc', label: 'Fewest relationships' },
    { value: 'created_desc', label: 'Newest first' },
    { value: 'created_asc', label: 'Oldest first' },
] as const;

export default function CelebritiesIndex() {
    const { celebrities } = usePage<CelebritiesIndexPageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('relationships_desc');

    const filtered = useMemo(() => {
        let list = celebrities;
        if (genderFilter !== 'all') {
            list = list.filter((c) => c.gender === genderFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    (c.tagline && c.tagline.toLowerCase().includes(q)) ||
                    c.gender.toLowerCase().includes(q)
            );
        }
        const totalR = (c: Celebrity) => c.related_subjects_count + c.related_answers_count;
        const sorted = [...list];
        if (sortBy === 'relationships_desc') sorted.sort((a, b) => totalR(b) - totalR(a));
        else if (sortBy === 'relationships_asc') sorted.sort((a, b) => totalR(a) - totalR(b));
        else if (sortBy === 'created_desc') sorted.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
        else if (sortBy === 'created_asc') sorted.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
        return sorted;
    }, [celebrities, searchQuery, genderFilter, sortBy]);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const totalRelationships = (c: Celebrity) => c.related_subjects_count + c.related_answers_count;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Celebrities">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminLayout title="Celebrities" description="View and manage celebrities and their relationships">
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search by name, tagline, or gender..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={genderFilter} onValueChange={setGenderFilter}>
                            <SelectTrigger className="w-[180px] shrink-0">
                                <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[200px] shrink-0">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button asChild className="max-w-48">
                            <Link href={create().url}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Celebrity
                            </Link>
                        </Button>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-slate-500 font-body">
                                {searchQuery || genderFilter !== 'all' ? 'No celebrities match your filters.' : 'No celebrities yet. Add one to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filtered.map((celebrity) => (
                                <Link
                                    key={celebrity.id}
                                    href={celebrity.url}
                                    className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-start gap-4">
                                        {celebrity.photo_url ? (
                                            <img
                                                src={celebrity.photo_url}
                                                alt={celebrity.name}
                                                className="h-14 w-14 shrink-0 rounded-full object-cover object-top"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const next = e.currentTarget.nextElementSibling;
                                                    if (next) (next as HTMLElement).style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300"
                                            style={celebrity.photo_url ? { display: 'none' } : undefined}
                                        >
                                            <span className="text-lg font-bold text-slate-600 font-display">
                                                {getInitials(celebrity.name)}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-900 font-body truncate">
                                                {celebrity.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-body">Born {celebrity.birth_year}</p>
                                            {celebrity.tagline ? (
                                                <p className="mt-1 text-xs italic text-slate-500 font-body line-clamp-2">
                                                    {celebrity.tagline}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 font-body">
                                        <Star className="h-4 w-4 shrink-0" />
                                        <span>{totalRelationships(celebrity)} relationship{totalRelationships(celebrity) !== 1 ? 's' : ''}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
