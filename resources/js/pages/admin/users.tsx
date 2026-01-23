import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, Search, Shield, User as UserIcon, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users',
        href: '#',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        id: number;
        name: string;
    } | null;
    email_verified_at: string | null;
    two_factor_enabled: boolean;
    created_at: string;
    updated_at: string;
}

interface UsersPageProps {
    users: User[];
}

export default function Users() {
    const { users } = usePage<UsersPageProps>().props;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users;
        }

        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.role?.name.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const title = 'Users';
    const description = 'View and manage all users registered on Celebrity Sh*ggers. See user roles, verification status, and account details.';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const ogImage = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
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
            <AdminLayout title="Users" description="View and manage all users">
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search users by name, email, or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-slate-500 font-body">
                                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            User
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700 font-body">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 shrink-0">
                                                        <span className="text-xs font-bold text-slate-600 font-display">
                                                            {getInitials(user.name)}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-900 font-body">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 font-body truncate">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.role ? (
                                                    <Badge
                                                        variant={user.role.name === 'Admin' ? 'default' : 'secondary'}
                                                        className="shrink-0"
                                                    >
                                                        {user.role.name === 'Admin' ? (
                                                            <Shield className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <UserIcon className="h-3 w-3 mr-1" />
                                                        )}
                                                        {user.role.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-slate-400 font-body">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {user.email_verified_at ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            <span className="text-xs text-slate-600 font-body">
                                                                Verified
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <XCircle className="h-4 w-4 text-slate-400" />
                                                            <span className="text-xs text-slate-500 font-body">
                                                                Unverified
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.two_factor_enabled && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Shield className="h-4 w-4 text-blue-600" />
                                                            <span className="text-xs text-slate-600 font-body">2FA</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600 font-body">
                                                    {formatDate(user.created_at)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
