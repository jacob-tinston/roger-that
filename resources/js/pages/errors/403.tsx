import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { home } from '@/routes';

export default function Forbidden() {
    return (
        <>
            <Head title="403 - Forbidden">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <main className="min-h-screen bg-eggplant-pattern flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative text-center">
                        <div className="mb-8">
                            <h1 className="font-display text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                                403
                            </h1>
                            <p className="text-slate-500 font-body text-sm md:text-base mb-2">
                                Access denied - this is VIP only.
                            </p>
                            <p className="text-slate-600 font-body text-base">
                                Sorry, but you don't have the clearance to see what's behind this door. Some secrets are just too scandalous to share.
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
