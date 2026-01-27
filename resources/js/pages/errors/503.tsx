import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';

export default function ServiceUnavailable() {
    return (
        <>
            <Head title="503 - Service Unavailable">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative text-center">
                        <div className="mb-8">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                                503
                            </h1>
                            <p className="text-slate-500 font-body text-sm md:text-base mb-2">
                                We're temporarily down for maintenance.
                            </p>
                            <p className="text-slate-600 font-body text-base">
                                We're doing some behind-the-scenes work to keep the drama flowing smoothly. Check back soon - the gossip will be worth the wait!
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
