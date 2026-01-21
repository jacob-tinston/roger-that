import { Head, usePage } from '@inertiajs/react';

import { RogerThatGame } from '@/components/roger-that-game';

interface GamePageProps {
    subjects: Array<{ id: number; name: string; year: number; hint: string }>;
    gameDate: string;
    guessUrl: string;
}

export default function Game() {
    const { subjects, gameDate, guessUrl } = usePage().props as GamePageProps;

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
                <RogerThatGame subjects={subjects} gameDate={gameDate} guessUrl={guessUrl} />
            </main>
        </>
    );
}
