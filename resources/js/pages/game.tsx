import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { AccountButton } from '@/components/account-button';
import { RogerThatGame } from '@/components/roger-that-game';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { history, home, register } from '@/routes';

interface GameSettings {
    SUBTITLES: string[];
    REACTIONS: {
        wrong: string[];
        close: string[];
    };
    BUTTON_COPY: string[];
    WIN_CAPTIONS: string[];
    LOSE_CAPTIONS: string[];
    LOSE_SUB_CAPTIONS: string[];
}

interface GamePageProps {
    subjects: Array<{ id: number; name: string; year: number; hint: string; photo_url: string | null }> | null;
    gameDate: string;
    guessUrl: string;
    previousGameUrl: string | null;
    settings: GameSettings;
    noGame?: boolean;
    canonicalUrl?: string;
    appUrl?: string;
}

export default function Game() {
    const pageProps = usePage<SharedData>().props as unknown as GamePageProps & SharedData;
    const { subjects, gameDate, guessUrl, previousGameUrl, settings, noGame, canonicalUrl, appUrl, auth } = pageProps;
    const user = auth?.user;

    const isToday = gameDate === new Date().toISOString().split('T')[0];
    const formattedDate = new Date(gameDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const title = isToday
        ? 'The Daily Celebrity Sh*ggers Game'
        : `Celebrity Sh*ggers Game - ${formattedDate}`;
    const description = isToday
        ? "One man. Four women. Five guesses. Guess the guy who's Rogered all 4 celebrities! Play the Daily Celebrity Sh*ggers Game."
        : `Missed the action? See who got Rogered in this past game of Celebrity Sh*ggers and relive all the messy hookups and cheeky encounters.`;

    const currentUrl = canonicalUrl || (appUrl ? `${appUrl}/daily/${gameDate}` : typeof window !== 'undefined' ? `${window.location.origin}/daily/${gameDate}` : '');
    const ogImage = appUrl ? `${appUrl}/logo.png` : typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <>
            <Head title={title}>
                <meta name="description" content={description} />
                {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

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

                {/* Structured Data */}
                {!noGame && subjects && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                '@context': 'https://schema.org',
                                '@type': 'Game',
                                name: title,
                                description: description,
                                url: currentUrl,
                                datePublished: gameDate,
                                gameLocation: {
                                    '@type': 'VirtualLocation',
                                    name: 'Roger That',
                                },
                                gameItem: {
                                    '@type': 'Thing',
                                    name: 'Celebrity Guessing Game',
                                },
                            }),
                        }}
                    />
                )}
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                {noGame ? (
                    <div className="w-full max-w-lg">
                        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative">
                            <Link
                                href={home().url}
                                className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                                aria-label="Back to homepage"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <AccountButton />

                        <div className="text-center">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Roger That
                            </h1>
                            <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">
                                No Action… Yet.
                            </p>
                            <div className="text-4xl my-4">😔</div>
                            <p className="text-slate-400 font-body text-sm mb-8">
                                Looks like today's scandal hasn't arrived. Come back later and see who's getting Rogered next.
                            </p>
                            <div className="flex flex-col gap-4 w-full">
                                {!user && (
                                    <Button
                                        asChild
                                        variant="coral"
                                    >
                                        <Link href={register().url}>
                                         Notify me of the next Rogering
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    asChild
                                    variant="secondary"
                                >
                                    <Link href={history().url}>
                                        View past games
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    <RogerThatGame
                        subjects={subjects || []}
                        gameDate={gameDate}
                        guessUrl={guessUrl}
                        previousGameUrl={previousGameUrl}
                        settings={settings}
                    />
                )}
            </main>
        </>
    );
}
