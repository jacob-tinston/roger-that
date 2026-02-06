import { Head, Link, usePage } from '@inertiajs/react';

import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
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
    plays_count: number;
    win_rate: number;
}

interface DashboardStats {
    totalGames: number;
    gamesPlayed: number;
    winRate: number;
    totalUsers: number;
}

interface DashboardPageProps {
    games: Game[];
    stats: DashboardStats;
}

export default function Dashboard() {
    const { games, stats } = usePage<DashboardPageProps>().props;

    const title = 'Dashboard - Previous Games';
    const description = 'Admin dashboard for Celebrity Sh*ggers. View game statistics, recent games, and manage the application.';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title}>
                <meta name="robots" content="noindex, nofollow" />
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
            <div className="min-h-screen bg-eggplant-pattern p-4">
                <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative overflow-hidden">
                    <div className="px-4 py-6">
                        <div className="space-y-12">
                            <div>
                                <Heading title="Game Stats" description="Overview of games, celebrities, and users" />
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-slate-600 font-body">
                                                Total Games
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-slate-900 font-display">
                                                {stats.totalGames}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-slate-600 font-body">
                                                Games Played
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-slate-900 font-display">
                                                {stats.gamesPlayed}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-slate-600 font-body">
                                                Win Rate
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-slate-900 font-display">
                                                {stats.winRate}%
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium text-slate-600 font-body">
                                                Total Users
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-slate-900 font-display">
                                                {stats.totalUsers}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div>
                                <Heading title="Recent Games" description="The 12 most recent daily games" />
                                {games.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-slate-500 font-body">
                                            No games available yet. Check back tomorrow!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {games.map((game) => (
                                            <Link
                                                key={game.id}
                                                href={game.url}
                                                className="block transition-transform hover:scale-[1.02]"
                                            >
                                                <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                                                    <CardHeader>
                                                        <CardTitle className="text-lg font-display font-bold">
                                                            {game.formatted_date}
                                                        </CardTitle>
                                                        <CardDescription className="font-body space-y-1">
                                                            {game.answer && (
                                                                <div>
                                                                    <span className="font-semibold font-body">Answer:</span> {game.answer.name}
                                                                </div>
                                                            )}
                                                            {game.subjects.length > 0 && (
                                                                <div>
                                                                    <span className="font-semibold font-body">Subjects:</span>{' '}
                                                                    {game.subjects.join(', ')}
                                                                </div>
                                                            )}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="flex gap-4 text-sm text-slate-600 font-body">
                                                            <span>
                                                                <span className="font-semibold">{game.plays_count}</span> played
                                                            </span>
                                                            <span>
                                                                <span className="font-semibold">{game.win_rate}%</span> win rate
                                                            </span>
                                                        </div>
                                                        {game.answer ? (
                                                            <div className="flex items-center gap-4">
                                                                {game.answer.photo_url ? (
                                                                    <img
                                                                        src={game.answer.photo_url}
                                                                        alt={game.answer.name}
                                                                        className="h-16 w-16 rounded-full object-cover object-top"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
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
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-slate-900 font-body">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
