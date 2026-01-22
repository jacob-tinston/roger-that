import { Head, usePage } from '@inertiajs/react';

import { RogerThatGame } from '@/components/roger-that-game';

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
    const pageProps = usePage().props as unknown as GamePageProps;
    const { subjects, gameDate, guessUrl, previousGameUrl, settings, noGame, canonicalUrl, appUrl } = pageProps;

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
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 max-w-2xl w-full text-center">
                        <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                            Roger That
                        </h1>
                        <p className="text-slate-500 font-body text-lg mb-6">
                            No game for today
                        </p>
                        <p className="text-slate-400 font-body text-sm mb-8">
                            Check back later or play a previous game!
                        </p>
                        {previousGameUrl && (
                            <a
                                href={previousGameUrl}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-coral text-white shadow-xs hover:bg-coral/90 px-6 py-3 text-base font-display font-bold hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 transition-transform"
                            >
                                Play Previous Game
                            </a>
                        )}
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
