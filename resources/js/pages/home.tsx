import { Head, Link } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useState } from 'react';

import { AccountButton } from '@/components/account-button';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { game, history } from '@/routes';

export default function Home() {
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    const title = 'Celebrity Sh*ggers Game';
    const description = "Think you can track the ultimate tabloid Romeo? Play Celebrity Sh*ggers - a daily guessing game where you use relationships, collaborations, and pop culture knowledge to figure out who's been sleeping around the headlines!";
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <>
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
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative">
                        <AccountButton />

                        {/* Disclaimer Icon */}
                        <button
                            type="button"
                            onClick={() => setShowDisclaimer(true)}
                            className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                            aria-label="Disclaimer"
                        >
                            <Info className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-8">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Roger That
                            </h1>
                            <p className="mt-2 text-slate-500 font-body text-sm md:text-base italic">
                                Celebrity Sh*ggers - The game
                            </p>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="prose prose-slate max-w-none">
                                <p className="text-slate-700 font-body text-base leading-relaxed text-center">
                                Four ladies. One man. <br /> 
                                He's been busy. Can you connect the dots without getting burned? <br /> 
                                Five guesses to spot the ultimate celebrity bed-hopper and prove you've got scandalous instincts.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button variant="coral" asChild>
                                <Link href={game().url}>
                                    Play today's game
                                </Link>
                            </Button>
                            <Button variant="secondary" asChild>
                                <Link href={history().url}>
                                    View past games
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Disclaimer Dialog */}
            <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
                            Disclaimer
                        </DialogTitle>
                        <DialogDescription className="text-left mt-4">
                            <div className="space-y-4 text-slate-600 font-body text-sm md:text-base">
                                <p>
                                    This game is for entertainment purposes only. Any hookups, rendezvous, or scandalous connections you see are drawn from publicly known gossip, pop culture, and verified sources—our AI is strictly instructed to avoid fake news or unverified claims.
                                    <br /> <br />
                                    The content is not intended to be factual, defamatory, or make any claims about the actual personal lives (or bedrooms) of any celebrities. Players should not take anything presented here as fact—just as you wouldn’t take a gossip column to bed.
                                    <br /> <br />
                                    We do not verify every detail or timing of any relationships—this is about connecting the dots. Players should enjoy the drama, innuendo, and chaos without believing it's the tabloids' truth.
                                </p>

                                <p className="text-sm italic text-slate-500 pt-2">
                                    Play responsibly, enjoy the scandal, and remember: it’s all a mischievous game… with a wink and a nudge.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
