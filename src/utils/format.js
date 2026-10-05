/** Human-readable file size, e.g. "2.4 MB". */
export function formatBytes(n) {
    if (!n) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * "2026-12-12T10:00" → "Sat, 12 Dec 2026 · 10:00 AM" (date-only values skip
 * the time). Anything that isn't a date is shown unchanged.
 */
export function formatEventDate(value) {
    if (typeof value !== "string" || !value) return value || "";
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
    if (!m) return value;
    const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    if (Number.isNaN(d.getTime())) return value;
    const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!m[4]) return day;
    const h = d.getHours();
    return `${day} · ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
