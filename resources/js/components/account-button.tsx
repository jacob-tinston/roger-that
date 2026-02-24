import { Link, usePage } from '@inertiajs/react';
import { Bell, Flame, Trophy, User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { login, logout, register } from '@/routes';
import { type SharedData } from '@/types';

interface AccountButtonProps {
    signUpOpen?: boolean;
    onSignUpOpenChange?: (open: boolean) => void;
}

export function AccountButton({ signUpOpen, onSignUpOpenChange }: AccountButtonProps = {}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const [showAccount, setShowAccount] = useState(false);
    const [internalSignUp, setInternalSignUp] = useState(false);

    const signUpControlled = signUpOpen !== undefined && onSignUpOpenChange !== undefined;
    const showSignUp = signUpControlled ? signUpOpen : internalSignUp;
    const setShowSignUp = signUpControlled ? onSignUpOpenChange : setInternalSignUp;

    if (!user) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setShowSignUp(true)}
                    className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                    aria-label="Account / Sign up"
                >
                    <User className="w-5 h-5" />
                </button>

                <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                    <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-8 md:p-10 border-slate-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
                        <DialogHeader>
                            <DialogTitle className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center">
                                Join the chaos
                            </DialogTitle>
                            <DialogDescription asChild>
                                <div className="mt-4 space-y-6 text-left">
                                    <p className="text-slate-600 font-body text-sm md:text-base leading-relaxed">
                                        Sign up to track your wins, get notified when the next scandal drops, and prove you've got the tabloid instincts to spot who's been rogering around the headlines.
                                    </p>
                                    <div className="grid gap-4">
                                        <div className="flex gap-4 items-start rounded-xl bg-slate-50/80 p-4">
                                            <div className="shrink-0 w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                                                <Flame className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <p className="font-display font-semibold text-slate-900 text-sm">Build your streak</p>
                                                <p className="text-slate-600 font-body text-sm mt-0.5">Play every day and keep the momentum going.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start rounded-xl bg-slate-50/80 p-4">
                                            <div className="shrink-0 w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                                                <Bell className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <p className="font-display font-semibold text-slate-900 text-sm">Never miss a game</p>
                                                <p className="text-slate-600 font-body text-sm mt-0.5">Get a nudge when the new scandal drops.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start rounded-xl bg-slate-50/80 p-4">
                                            <div className="shrink-0 w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center">
                                                <Trophy className="w-5 h-5 text-coral" />
                                            </div>
                                            <div>
                                                <p className="font-display font-semibold text-slate-900 text-sm">Bragging rights</p>
                                                <p className="text-slate-600 font-body text-sm mt-0.5">See your past games and show off your instincts.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-2">
                                        <Button variant="coral" asChild>
                                            <Link href={register().url}>
                                                Sign up
                                            </Link>
                                        </Button>
                                        <Button variant="secondary" asChild>
                                            <Link href={login().url}>
                                                Log in
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
                                    <Button variant="coral" asChild>
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
