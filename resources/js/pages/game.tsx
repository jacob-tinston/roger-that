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
    subjects: Array<{ id: number; name: string; year: number; hint: string; photo_url: string | null }>;
    gameDate: string;
    guessUrl: string;
    previousGameUrl: string | null;
    settings: GameSettings;
}

export default function Game() {
    const { subjects, gameDate, guessUrl, previousGameUrl, settings } = usePage().props as GamePageProps;

    return (
        <>
            <Head title="The game of who Rogered who">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=poppins:400,600,700,800,900&family=inter:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <RogerThatGame
                    subjects={subjects}
                    gameDate={gameDate}
                    guessUrl={guessUrl}
                    previousGameUrl={previousGameUrl}
                    settings={settings}
                />
            </main>
        </>
    );
}
