import { useEffect, useState } from "react";
import { X, Maximize2, ExternalLink } from "lucide-react";

/**
 * Shows a whole poster or banner, never cropped: the image is fitted inside
 * the frame and a blurred copy of it fills the empty space, so tall posters
 * and wide banners both look intentional.
 *
 * natural: the frame takes the image's own height (capped), for detail pages.
 * zoomable: tap to open the poster full size.
 */
export default function PosterImage({ src, alt, className = "", natural = false, zoomable = false, hoverZoom = false }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const fg = natural
        ? "relative block mx-auto w-auto max-w-full max-h-[75vh] object-contain"
        : `relative w-full h-full object-contain ${hoverZoom ? "transition-transform duration-700 group-hover:scale-105" : ""}`;
    const frame = (
        <div className={`relative overflow-hidden bg-gray-900 ${natural ? "flex items-center justify-center" : ""} ${className}`}>
            <img src={src} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-60" />
            <img src={src} alt={alt} loading="lazy" className={fg} />
            {zoomable && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold backdrop-blur-sm pointer-events-none">
                    <Maximize2 className="w-3.5 h-3.5" /> View full poster
                </span>
            )}
        </div>
    );

    if (!zoomable) return frame;
    return (
        <>
            <button type="button" onClick={() => setOpen(true)} aria-label={`Open ${alt || "poster"} full size`} className="block w-full text-left cursor-zoom-in">
                {frame}
            </button>
            {open && (
                <div role="dialog" aria-modal="true" aria-label={alt || "Poster"} onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <div className="absolute top-4 right-4 flex gap-2">
                        <a href={src} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-sm font-semibold hover:bg-white/25">
                            <ExternalLink className="w-4 h-4" /> Original
                        </a>
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
