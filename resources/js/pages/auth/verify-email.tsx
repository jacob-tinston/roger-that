// Components
import { Form, Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-emerald-600 font-body">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form action={send()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            variant="coral"
                            size="xl"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm text-coral hover:text-coral/90 font-body"
                        >
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
