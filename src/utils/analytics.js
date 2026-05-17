/**
 * Simple Google Analytics integration script.
 * Usage: Initialize in the main entry point (main.jsx or App.jsx).
 */

export const initGA = (trackingId) => {
    if (typeof window === 'undefined') return;
    if (!trackingId) {
        console.warn("[Analytics] Tracking ID missing. Skipping initialization.");
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', trackingId);

    console.log("[Analytics] GA4 Initialized");
};

export const logPageView = (path) => {
    if (window.gtag) {
        window.gtag('event', 'page_view', {
            page_path: path,
        });
    }
};

export const logEvent = (action, params) => {
    if (window.gtag) {
        window.gtag('event', action, params);
    }
};
