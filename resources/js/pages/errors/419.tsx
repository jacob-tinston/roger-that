import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';

export default function TokenMismatch() {
    return (
        <>
            <Head title="419 - Page Expired">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative text-center">
                        <div className="mb-8">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                                419
                            </h1>
                            <p className="text-slate-500 font-body text-sm md:text-base mb-2">
                                Your session expired - time's up!
                            </p>
                            <p className="text-slate-600 font-body text-base">
                                This page has been sitting around too long and lost its spark. Refresh and try again - we promise it'll be worth it.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Button variant="coral" asChild>
                                <Link href={home().url}>
                                    Go back home
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
