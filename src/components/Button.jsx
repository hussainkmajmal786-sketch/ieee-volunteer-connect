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
            className={`${baseClasses} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
            {children}
        </button>
    );
}
