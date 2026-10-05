// Where people reach the IEEE SB CEK team.
export const CONTACT_EMAIL = "ajmal_b25219ec_a@ce-kgr.org";
export const WHATSAPP_NUMBER = "8848495055";

/** A wa.me chat link for an Indian mobile (10 digits get +91), optionally with a message typed in. */
export function whatsappLink(number = WHATSAPP_NUMBER, text = "") {
    let digits = String(number || "").replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
    if (digits.length < 11) return null;
    return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
