import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

import { AccountButton } from '@/components/account-button';
import { Button } from '@/components/ui/button';
import { game } from '@/routes';

interface Subject {
    id: number;
    name: string;
    photo_url: string | null;
}

interface Game {
    id: number;
    date: string;
    formatted_date: string;
    subjects: Subject[];
    url: string;
}

interface PaginatedGames {
    data: Game[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface HistoryPageProps {
    games: PaginatedGames;
}

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .map((s) => s[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?';
}

export default function History() {
    const { games } = usePage<HistoryPageProps>().props;

    const title = 'Past Celebrity Sh*ggers Games';
    const description = "Missed a scandal? Browse past games of Celebrity Sh*ggers and see which men left a trail of chaos across Hollywood's most tempting four-somes.";
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <>
            <Head title={title}>
                <meta
                    name="description"
                    content="Missed a scandal? Browse past games of Celebrity Sh*ggers and see which men left a trail of chaos across Hollywood’s most tempting four-somes."
                />
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
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative">
                        <Link
                            href="/"
                            className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                            aria-label="Back to homepage"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <AccountButton />

                        <div className="text-center mb-6">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Roger That
                            </h1>
                            <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">
                                Red carpet rendezvous you missed
                            </p>
                        </div>

                        {games.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 font-body">No games available yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 mb-4">
                                    {games.data.map((gameItem) => (
                                        <Link
                                            key={gameItem.id}
                                            href={gameItem.url}
                                            className="block p-4 rounded-xl border border-slate-200 hover:border-coral hover:shadow-md transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                                                <div className="flex-1">
                                                    <p className="font-display font-bold text-slate-900 text-lg">
                                                        {gameItem.formatted_date}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {gameItem.subjects.slice(0, 4).map((subject) => (
                                                        <div
                                                            key={subject.id}
                                                            className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shrink-0"
                                                        >
                                                            {subject.photo_url ? (
                                                                <img
                                                                    src={subject.photo_url}
                                                                    alt={subject.name}
                                                                    className="w-full h-full object-cover object-top"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                                                    <span className="text-xs font-bold text-slate-600 font-display">
                                                                        {getInitials(subject.name)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                            </>
                        )}

                        {/* Pagination */}
                        {games.last_page > 1 && (
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <button
                                    onClick={() => {
                                        const prevLink = games.links.find((link) => 
                                            link.label.includes('Previous') || link.label.includes('&laquo;')
                                        );
                                        if (prevLink?.url) {
                                            router.visit(prevLink.url);
                                        }
                                    }}
                                    disabled={games.current_page === 1}
                                    className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-700 font-display font-bold bg-white hover:border-coral hover:text-coral hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-700 disabled:hover:shadow-none transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm text-slate-600 font-display font-semibold">
                                    Page {games.current_page} of {games.last_page}
                                </span>
                                <button
                                    onClick={() => {
                                        const nextLink = games.links.find((link) => 
                                            link.label.includes('Next') || link.label.includes('&raquo;')
                                        );
                                        if (nextLink?.url) {
                                            router.visit(nextLink.url);
                                        }
                                    }}
                                    disabled={games.current_page === games.last_page}
                                    className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-700 font-display font-bold bg-white hover:border-coral hover:text-coral hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-700 disabled:hover:shadow-none transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        <div className="pt-6">
                            <Button variant="coral" asChild>
                                <Link href={game().url}>
                                    Play today's game
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
