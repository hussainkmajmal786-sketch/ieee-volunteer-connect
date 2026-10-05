// Event categories, modes, and "is registration open?" — shared by the
// events list, the event page and the admin event form.

/** Category → swatch colour (Tailwind class). Seminar/Meetup kept for older events. */
export const EVENT_CATEGORIES = [
    { name: "Hackathon", color: "bg-purple-500" },
    { name: "Competition", color: "bg-orange-500" },
    { name: "Workshop", color: "bg-blue-500" },
    { name: "Tech Fest", color: "bg-green-500" },
    { name: "Project Expo", color: "bg-red-500" },
    { name: "Conference", color: "bg-sky-500" },
    { name: "Conclave", color: "bg-violet-500" },
    { name: "Seminar", color: "bg-cyan-500" },
    { name: "Networking", color: "bg-emerald-500" },
    { name: "Bootcamp", color: "bg-fuchsia-500" },
    { name: "Meetup", color: "bg-teal-500" },
    { name: "Cultural", color: "bg-rose-500" },
    { name: "Sports", color: "bg-red-600" },
    { name: "Other", color: "bg-amber-500" },
];
export const CATEGORY_NAMES = EVENT_CATEGORIES.map(c => c.name);
export const categoryColor = (name) => EVENT_CATEGORIES.find(c => c.name === name)?.color || "bg-gray-400";

export const EVENT_MODES = ["Offline", "Online", "Hybrid"];

/** "2026-12-12T10:00" (local) or "2026-12-12" → ms, else null. */
export function eventTime(value, endOfDay = false) {
    if (typeof value !== "string" || !value) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
    if (!m) return null;
    const hasTime = m[4] !== undefined;
    const d = new Date(+m[1], +m[2] - 1, +m[3], hasTime ? +m[4] : endOfDay ? 23 : 0, hasTime ? +m[5] : endOfDay ? 59 : 0);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** When registration closes: the deadline, else the start time. */
export function closesAt(event) {
    return eventTime(event?.registrationDeadline, true) ?? eventTime(event?.date);
}

/**
 * { open, reason } — reason: "deadline" (registration closed), "full"
 * (all seats taken) or "ended" (the event is over).
 */
export function registrationState(event, now = Date.now(), registeredCount = event?.participants || 0) {
    const ends = eventTime(event?.endDate, true) ?? eventTime(event?.date, true);
    if (ends != null && now > ends) return { open: false, reason: "ended" };
    const deadline = eventTime(event?.registrationDeadline, true);
    if (deadline != null && now > deadline) return { open: false, reason: "deadline" };
    const cap = Number(event?.capacity) || 0;
    if (cap > 0 && registeredCount >= cap) return { open: false, reason: "full" };
    return { open: true, reason: null, seatsLeft: cap > 0 ? cap - registeredCount : null };
}

export const CLOSED_LABEL = { ended: "Event over", deadline: "Registration closed", full: "Seats full" };

/** Event form values → what's stored (numbers as numbers, tags as a list, blanks dropped). */
export function cleanEventFields(f) {
    const num = (v) => {
        const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
        return v === "" || v == null || !Number.isFinite(n) ? null : n;
    };
    const tags = Array.isArray(f.tags) ? f.tags : String(f.tags || "").split(",");
    return {
        ...f,
        fee: num(f.fee),
        capacity: num(f.capacity),
        tags: [...new Set(tags.map(t => String(t).trim()).filter(Boolean))].slice(0, 10),
    };
}

/** Rupees, or "Free". */
export const feeLabel = (fee) => (Number(fee) > 0 ? `₹${Number(fee).toLocaleString("en-IN")}` : "Free");
