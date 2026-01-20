import { Head, Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useActiveUrl } from '@/hooks/use-active-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { urlIsActive } = useActiveUrl();

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

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
                        <Heading
                            title="Settings"
                            description="Manage your profile and account settings"
                        />

                        <div className="flex flex-col lg:flex-row lg:space-x-12">
                            <aside className="w-full max-w-xl lg:w-48">
                                <nav
                                    className="flex flex-col space-y-1 space-x-0"
                                    aria-label="Settings"
                                >
                                    {sidebarNavItems.map((item, index) => (
                                        <Button
                                            key={`${toUrl(item.href)}-${index}`}
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                            className={cn('w-full justify-start font-body', {
                                                'bg-slate-100 text-slate-900': urlIsActive(item.href),
                                            })}
                                        >
                                            <Link href={item.href}>
                                                {item.icon && (
                                                    <item.icon className="h-4 w-4" />
                                                )}
                                                {item.title}
                                            </Link>
                                        </Button>
                                    ))}
                                </nav>
                            </aside>

                            <Separator className="my-6 lg:hidden" />

                            <div className="flex-1 md:max-w-2xl">
                                <section className="max-w-xl space-y-12">
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
