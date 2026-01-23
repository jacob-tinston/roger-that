// Components
import { Form, Head } from '@inertiajs/react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const title = 'Email verification';
    const description = 'Verify your email address for your Celebrity Sh*ggers account. Check your inbox for the verification link.';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <AuthLayout
            title="Verify email"
            description="Please verify your email address by clicking on the link we just emailed to you."
        >
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
