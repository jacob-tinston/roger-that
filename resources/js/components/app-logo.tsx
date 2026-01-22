export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <img
                    src="/favicon-32x32.png"
                    alt="Roger That"
                    className="size-5"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-display font-bold">
                    Roger That
                </span>
            </div>
        </>
    );
}
