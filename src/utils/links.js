/** Only http(s) links are ever rendered as hrefs (blocks javascript: etc.). */
export function safeUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

export const SOCIALS = [
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
    { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/…" },
    { key: "github", label: "GitHub", placeholder: "https://github.com/…" },
    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
    { key: "website", label: "Website / Portfolio", placeholder: "https://…" },
    { key: "other", label: "Other link", placeholder: "https://…" },
];

/** YouTube video id from any common YouTube URL, else null. */
export function youtubeId(url) {
    const u = safeUrl(url);
    if (!u) return null;
    const m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}
