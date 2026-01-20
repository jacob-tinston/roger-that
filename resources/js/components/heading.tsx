export default function Heading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-8 space-y-0.5">
            <h2 className="font-display text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
            {description && (
                <p className="text-sm text-slate-500 font-body">{description}</p>
            )}
        </div>
    );
}
