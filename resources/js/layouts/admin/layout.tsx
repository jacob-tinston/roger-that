import { Head } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

import Heading from '@/components/heading';

export default function AdminLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    title: string;
    description?: string;
}>) {
    return (
        <>
            <Head>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=poppins:400,600,700,800,900&family=inter:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-eggplant-pattern p-4">
                <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-8 md:p-10 relative overflow-hidden">
                    <div className="px-4 py-6">
                        <Heading title={title} description={description} />

                        <div className="flex flex-col">
                            <div className="flex-1">
                                <section className="space-y-12">
                                    {children}
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
