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
}

export default function Game() {
    const { subjects, gameDate, guessUrl, previousGameUrl, settings, noGame } = usePage().props as GamePageProps;

    return (
        <>
            <Head title="Celebrity WhoDunnit?">
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
