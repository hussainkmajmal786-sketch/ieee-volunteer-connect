/**
 * Google Analytics 4 via gtag.js (production only).
 * Set VITE_GA_MEASUREMENT_ID (format G-XXXXXXXXXX) to enable.
 */
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const enabled = typeof window !== "undefined" && !import.meta.env.DEV && !!MEASUREMENT_ID;
let initialized = false;

export const initGA = () => {
    if (!enabled || initialized) return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // Page views are sent manually on route changes.
    window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
};

export const logPageView = (path) => {
    if (enabled && window.gtag) window.gtag("event", "page_view", { page_path: path });
};

export const logEvent = (action, params) => {
    if (enabled && window.gtag) window.gtag("event", action, params);
};
