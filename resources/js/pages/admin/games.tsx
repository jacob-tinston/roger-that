import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

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
        title: 'Games',
        href: '#',
    },
];

interface Game {
    id: number;
    date: string;
    formatted_date: string;
    answer: {
        name: string;
        year: number;
    } | null;
    subjects: string[];
    url: string;
}

interface GamesPageProps {
    games: Game[];
}

export default function Games() {
    const { games } = usePage<GamesPageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

    const filteredGames = useMemo(() => {
        if (!searchQuery.trim()) {
            return games;
        }

        const query = searchQuery.toLowerCase();
        return games.filter(
            (game) =>
                game.formatted_date.toLowerCase().includes(query) ||
                game.answer?.name.toLowerCase().includes(query) ||
                game.subjects.some((subject) => subject.toLowerCase().includes(query))
        );
    }, [games, searchQuery]);

    const handleDelete = (gameId: number) => {
        setDeletingGameId(gameId);
        router.delete(`/admin/games/${gameId}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeletingGameId(null);
            },
        });
    };

    const title = 'Games';
    const description = 'Manage all Celebrity Sh*ggers games. View, search, and delete games from the admin panel.';
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
            <AdminLayout title="Games" description="View and manage all games">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search games by date, answer, or subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {filteredGames.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-slate-500 font-body">
                                {searchQuery ? 'No games found matching your search.' : 'No games found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Answer
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Subjects
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredGames.map((game) => (
                                        <tr
                                            key={game.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={game.url}
                                                    className="font-medium text-slate-900 font-body hover:text-coral transition-colors"
                                                >
                                                    {game.formatted_date}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                {game.answer ? (
                                                    <div>
                                                        <div className="font-medium text-slate-900 font-body">
                                                            {game.answer.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 font-body">
                                                            Born {game.answer.year}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400 font-body"> - </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-slate-600 font-body">
                                                    {game.subjects.length > 0 ? (
                                                        <span>{game.subjects.join(', ')}</span>
                                                    ) : (
                                                        <span className="text-slate-400"> - </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={game.url}
                                                        className="text-black hover:text-slate-700 transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
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
                                                            <DialogTitle>Delete Game</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to delete the game for {game.formatted_date}? This action cannot be undone. The associated celebrities will not be deleted.
                                                            </DialogDescription>
                                                            <DialogFooter className="gap-2">
                                                                <DialogClose asChild>
                                                                    <Button variant="secondary" size="sm">Cancel</Button>
                                                                </DialogClose>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        handleDelete(game.id);
                                                                    }}
                                                                    disabled={deletingGameId === game.id}
                                                                >
                                                                    {deletingGameId === game.id ? 'Deleting...' : 'Delete'}
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
