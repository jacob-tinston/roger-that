import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'flex min-h-[80px] w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-base font-body',
                'text-slate-900 placeholder:text-slate-400',
                'focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20',
                'transition-all duration-200',
                'selection:bg-coral/20 selection:text-slate-900',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'aria-invalid:ring-2 aria-invalid:ring-coral/20 aria-invalid:border-coral',
                'read-only:bg-slate-100 read-only:text-slate-600',
                'resize-y',
                className
            )}
            {...props}
        />
    );
}

export { Textarea };
