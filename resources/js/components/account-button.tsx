import { Link, usePage } from '@inertiajs/react';
import { User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { logout } from '@/routes';
import { login } from '@/routes';
import { type SharedData } from '@/types';

export function AccountButton() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const [showAccount, setShowAccount] = useState(false);

    if (!user) {
        return (
            <Link
                href={login().url}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                aria-label="Log In"
            >
                <User className="w-5 h-5" />
            </Link>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowAccount(true)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                aria-label="Account"
            >
                <User className="w-5 h-5" />
            </button>

            <Dialog open={showAccount} onOpenChange={setShowAccount}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
                            My Account
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="mt-4">
                                <div className="flex gap-6 items-start">
                                    <div className="flex-1 space-y-4 text-left min-w-0">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-body">
                                                Name
                                            </p>
                                            <p className="mt-1 text-slate-900 font-body">{user.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 font-body">
                                                Email
                                            </p>
                                            <p className="mt-1 text-slate-900 font-body">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-coral/20 to-coral/40 flex items-center justify-center">
                                        <span className="text-3xl font-display font-bold text-coral/80">
                                            {user.name
                                                .split(/\s+/)
                                                .map((s) => s[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2) || '?'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-6 mt-6 border-t border-slate-200">
                                    <Button variant="coral" size="xl" asChild className="w-full">
                                        <Link href={logout().url} method="post" as="button">
                                            Log out
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    );
}
