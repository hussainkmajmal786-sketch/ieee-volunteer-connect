import { Loader2 } from "lucide-react";

export default function Button({
    children,
    variant = 'primary',
    isLoading = false,
    className = "",
    ...props
}) {
    const baseClasses = variant === 'primary' ? 'btn-primary' : 'btn-outline';

    return (
        <button
            className={`${baseClasses} ${className} flex items-center justify-center gap-2 relative min-h-[2.75rem]`}
            disabled={isLoading || props.disabled}
            aria-busy={isLoading}
            aria-live="polite"
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin w-5 h-5 shrink-0" aria-hidden="true" />
            ) : (
                children
            )}
        </button>
    );
}
