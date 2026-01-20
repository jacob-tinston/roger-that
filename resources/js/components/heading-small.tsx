export default function HeadingSmall({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <header>
            <h3 className="mb-0.5 font-display text-lg font-bold text-slate-900">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 font-body">{description}</p>
            )}
        </header>
    );
}
