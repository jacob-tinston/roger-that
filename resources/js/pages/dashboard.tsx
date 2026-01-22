import { Head, Link, usePage } from '@inertiajs/react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface Game {
    id: number;
    date: string;
    formatted_date: string;
    answer: {
        name: string;
        year: number;
        tagline: string;
        photo_url: string | null;
    } | null;
    subjects: string[];
    url: string;
}

interface DashboardPageProps {
    games: Game[];
}

export default function Dashboard() {
    const { games } = usePage<DashboardPageProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Previous Games" />
            <AdminLayout title="Previous Games" description="Browse and replay all previous daily games">
                {games.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-slate-500 font-body">
                            No games available yet. Check back tomorrow!
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {games.map((game) => (
                            <Link
                                key={game.id}
                                href={game.url}
                                className="block transition-transform hover:scale-[1.02]"
                            >
                                <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-display">
                                            {game.formatted_date}
                                        </CardTitle>
                                        <CardDescription className="font-body space-y-1">
                                            {game.answer && (
                                                <div>
                                                    <span className="font-semibold">Answer:</span> {game.answer.name}
                                                </div>
                                            )}
                                            {game.subjects.length > 0 && (
                                                <div>
                                                    <span className="font-semibold">Subjects:</span>{' '}
                                                    {game.subjects.join(', ')}
                                                </div>
                                            )}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {game.answer ? (
                                            <div className="flex items-center gap-4">
                                                {game.answer.photo_url ? (
                                                    <img
                                                        src={game.answer.photo_url}
                                                        alt={game.answer.name}
                                                        className="h-16 w-16 rounded-full object-cover object-top"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300">
                                                        <span className="text-xl font-bold text-slate-600 font-display">
                                                            {game.answer.name
                                                                .split(' ')
                                                                .map((n) => n[0])
                                                                .join('')
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900 font-body">
                                                        {game.answer.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500 font-body">
                                                        Born {game.answer.year}
                                                    </p>
                                                    {game.answer.tagline && (
                                                        <p className="mt-1 text-xs italic text-coral font-body">
                                                            {game.answer.tagline}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 font-body">
                                                Answer not available
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </AdminLayout>
        </AppLayout>
    );
}
