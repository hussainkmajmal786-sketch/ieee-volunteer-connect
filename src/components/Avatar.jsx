import { useState } from "react";

const SIZES = { xs: "w-7 h-7 text-[10px]", sm: "w-9 h-9 text-xs", md: "w-12 h-12 text-base", lg: "w-20 h-20 text-2xl", xl: "w-28 h-28 text-4xl" };

/** Profile photo, falling back to the first letter of the name. */
export default function Avatar({ src, name = "", size = "md", className = "" }) {
    const [broken, setBroken] = useState(false);
    const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
    const cls = `${SIZES[size] || SIZES.md} rounded-full shrink-0 ${className}`;
    if (src && !broken) {
        return <img src={src} alt={name ? `${name}'s photo` : ""} loading="lazy" onError={() => setBroken(true)} className={`${cls} object-cover bg-gray-100 dark:bg-gray-800`} />;
    }
    return (
        <span aria-hidden={name ? undefined : true} aria-label={name || undefined}
            className={`${cls} bg-gradient-to-br from-ieee-blue to-cyan-500 text-white font-bold flex items-center justify-center`}>
            {initial}
        </span>
    );
}
