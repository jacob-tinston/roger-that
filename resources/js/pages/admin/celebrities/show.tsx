import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import {
    destroy as destroyCelebrity,
    edit as editCelebrity,
    index as celebritiesIndex,
    show as showCelebrity,
} from '@/routes/admin/celebrities';
import { destroy as destroyRelationship, store as storeRelationship } from '@/routes/admin/celebrities/relationships';
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

interface OtherCelebrity {
    id: number;
    name: string;
    birth_year: number;
    photo_url: string | null;
}

interface Relationship {
    id: number;
    celebrity_1_id: number;
    celebrity_2_id: number;
    other: OtherCelebrity;
    role: 'answer' | 'subject';
}

interface ShowPageProps {
    celebrity: CelebrityData;
    relationships: Relationship[];
    celebritiesSearchUrl: string;
}

export default function CelebrityShow() {
    const { celebrity, relationships, celebritiesSearchUrl } = usePage<ShowPageProps>().props;
    const [addOpen, setAddOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OtherCelebrity[]>([]);
    const [selectedOther, setSelectedOther] = useState<OtherCelebrity | null>(null);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [deletingRelId, setDeletingRelId] = useState<number | null>(null);
    const [deletingCelebrity, setDeletingCelebrity] = useState(false);

    const searchCelebrities = useCallback(async () => {
        const params = new URLSearchParams({ exclude: String(celebrity.id) });
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        const res = await fetch(celebritiesSearchUrl + '?' + params.toString());
        const data = (await res.json()) as OtherCelebrity[];
        setSearchResults(data);
    }, [celebrity.id, searchQuery, celebritiesSearchUrl]);

    useEffect(() => {
        if (!addOpen) return;
        const t = setTimeout(searchCelebrities, 300);
        return () => clearTimeout(t);
    }, [addOpen, searchQuery, searchCelebrities]);

    const openAddDialog = (open: boolean) => {
        if (!open) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedOther(null);
        }
        setAddOpen(open);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Celebrities', href: celebritiesIndex().url },
        { title: celebrity.name, href: showCelebrity.url(celebrity.id) },
    ];

    const submitAddRelationship = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOther) return;
        setAddSubmitting(true);
        const payload = {
            celebrity_1_id: celebrity.id,
            celebrity_2_id: selectedOther.id,
            redirect_celebrity_id: celebrity.id,
        };
        router.post(storeRelationship().url, payload, {
            preserveScroll: true,
            onFinish: () => setAddSubmitting(false),
            onSuccess: () => {
                setAddOpen(false);
                setSelectedOther(null);
                setSearchQuery('');
            },
        });
    };

    const handleDeleteRelationship = (relId: number) => {
        setDeletingRelId(relId);
        const url = destroyRelationship.url(relId) + `?redirect_celebrity_id=${celebrity.id}`;
        router.delete(url, { preserveScroll: true, onFinish: () => setDeletingRelId(null) });
    };

    const handleDeleteCelebrity = () => {
        setDeletingCelebrity(true);
        router.delete(destroyCelebrity.url(celebrity.id), {
            onFinish: () => setDeletingCelebrity(false),
        });
    };

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={celebrity.name}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminLayout title={celebrity.name} description="View and manage relationships">
                <div className="space-y-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-4">
                            {celebrity.photo_url ? (
                                <img
                                    src={celebrity.photo_url}
                                    alt={celebrity.name}
                                    className="h-20 w-20 rounded-full object-cover object-top"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const n = e.currentTarget.nextElementSibling;
                                        if (n) (n as HTMLElement).style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300"
                                style={celebrity.photo_url ? { display: 'none' } : undefined}
                            >
                                <span className="text-2xl font-bold text-slate-600 font-display">
                                    {getInitials(celebrity.name)}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 font-display">{celebrity.name}</h2>
                                <p className="text-slate-600 font-body">Born {celebrity.birth_year} · {celebrity.gender}</p>
                                {celebrity.tagline ? (
                                    <p className="mt-1 text-sm italic text-slate-500 font-body">{celebrity.tagline}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={editCelebrity.url(celebrity.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete celebrity
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Delete celebrity</DialogTitle>
                                    <DialogDescription>
                                        Delete {celebrity.name}? All their relationships will be removed. This cannot be undone.
                                    </DialogDescription>
                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="secondary" size="sm">Cancel</Button>
                                        </DialogClose>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleDeleteCelebrity}
                                            disabled={deletingCelebrity}
                                        >
                                            {deletingCelebrity ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 font-display">Relationships</h3>
                            <Dialog open={addOpen} onOpenChange={openAddDialog}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add relationship
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>Add relationship</DialogTitle>
                                    <DialogDescription>
                                        Link this celebrity with another. Search and select the other celebrity.
                                    </DialogDescription>
                                    <form onSubmit={submitAddRelationship} className="space-y-4">
                                        <div>
                                            <Label htmlFor="celebrity_search">Other celebrity</Label>
                                            <div className="relative mt-1">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="celebrity_search"
                                                    type="text"
                                                    placeholder="Search by name..."
                                                    value={selectedOther ? selectedOther.name : searchQuery}
                                                    onChange={(e) => {
                                                        setSelectedOther(null);
                                                        setSearchQuery(e.target.value);
                                                    }}
                                                    className="pl-10"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {searchQuery && !selectedOther && (
                                                <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white py-1">
                                                    {searchResults.length === 0 ? (
                                                        <li className="px-3 py-2 text-sm text-slate-500 font-body">
                                                            No celebrities found. Type to search the database.
                                                        </li>
                                                    ) : (
                                                        searchResults.map((c) => (
                                                            <li key={c.id}>
                                                                <button
                                                                    type="button"
                                                                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-100 font-body"
                                                                    onClick={() => {
                                                                        setSelectedOther(c);
                                                                        setSearchQuery('');
                                                                        setSearchResults([]);
                                                                    }}
                                                                >
                                                                    {c.photo_url ? (
                                                                        <img
                                                                            src={c.photo_url}
                                                                            alt=""
                                                                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                                                            {c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                                        </div>
                                                                    )}
                                                                    <span className="font-medium text-slate-900">{c.name}</span>
                                                                    <span className="text-slate-500">(b. {c.birth_year})</span>
                                                                </button>
                                                            </li>
                                                        ))
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button type="button" variant="secondary" size="sm">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" size="sm" disabled={addSubmitting || !selectedOther}>
                                                {addSubmitting ? 'Adding...' : 'Add'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {relationships.length === 0 ? (
                            <p className="text-slate-500 font-body py-4">No relationships yet. Add one above.</p>
                        ) : (
                            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                                {relationships.map((rel) => (
                                    <li
                                        key={rel.id}
                                        className="flex items-center justify-between gap-4 px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {rel.other.photo_url ? (
                                                <img
                                                    src={rel.other.photo_url}
                                                    alt={rel.other.name}
                                                    className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
                                                    <span className="text-sm font-bold text-slate-600 font-display">
                                                        {getInitials(rel.other.name)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 font-body">
                                                    {rel.other.name}
                                                    <span className="ml-2 text-xs text-slate-500 font-body">
                                                        (b. {rel.other.birth_year})
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>Remove relationship</DialogTitle>
                                                <DialogDescription>
                                                    Remove the link between {celebrity.name} and {rel.other.name}?
                                                </DialogDescription>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary" size="sm">Cancel</Button>
                                                    </DialogClose>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteRelationship(rel.id)}
                                                        disabled={deletingRelId === rel.id}
                                                    >
                                                        {deletingRelId === rel.id ? 'Removing...' : 'Remove'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
