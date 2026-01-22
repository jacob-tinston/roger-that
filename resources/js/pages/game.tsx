import { Head, Link, usePage } from '@inertiajs/react';

import { AccountButton } from '@/components/account-button';
import { RogerThatGame } from '@/components/roger-that-game';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { history, register } from '@/routes';

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
        ? 'Celebrity Whodunnit?'
        : `Celebrity Whodunnit? | ${formattedDate}`;
    const description = isToday
        ? "One man. Four women. Five guesses. Guess the guy who's Rogered all 4 celebrities! Play the daily Roger That game."
        : `Play the Roger That game from ${formattedDate}. One man. Four women. Five guesses. Guess the guy who's Rogered all 4 celebrities!`;

    const currentUrl = canonicalUrl || (appUrl ? `${appUrl}/daily/${gameDate}` : '');
    const ogImage = appUrl ? `${appUrl}/logo.png` : undefined;

    return (
        <>
            <Head title={title}>
                <meta name="description" content={description} />
                {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                {ogImage && <meta property="og:image" content={ogImage} />}
                <meta property="og:site_name" content="Roger That" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={currentUrl} />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                {ogImage && <meta name="twitter:image" content={ogImage} />}

                {/* Additional SEO */}
                <meta name="robots" content="index, follow" />
                <meta name="author" content="Roger That" />
                <meta name="theme-color" content="#FFFFFF" />

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

                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=poppins:400,600,700,800,900&family=inter:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                {noGame ? (
                    <div className="w-full max-w-lg">
                        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative">
                            <AccountButton />

                        <div className="text-center mb-8">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Roger That
                            </h1>
                            <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">
                                No game for today
                            </p>
                            <div className="text-4xl my-4">😔</div>
                            <p className="text-slate-400 font-body text-sm mb-8">
                                Check back later or play a previous game!
                            </p>
                            <div className="flex flex-col gap-4 w-full">
                                {!user && (
                                    <Button
                                        asChild
                                        variant="coral"
                                        size="xl"
                                        className="w-full"
                                    >
                                        <Link href={register().url}>
                                            Notify me
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    asChild
                                    variant="outline"
                                    size="xl"
                                    className="w-full border-2 border-coral text-coral bg-white hover:bg-slate-50 hover:text-coral rounded-xl font-display font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                >
                                    <Link href={history().url}>
                                        Play previous games
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
