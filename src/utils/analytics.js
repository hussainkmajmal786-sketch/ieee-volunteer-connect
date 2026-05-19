import { logEvent as firebaseLogEvent } from "firebase/analytics";
import { analytics } from "../firebase/config";

/**
 * Google Analytics integration via Firebase.
 * Usage: Initialize is handled by Firebase config. This utility provides wrapper functions.
 */

export const initGA = (trackingId) => {
    // Initialization is now handled automatically by Firebase Analytics in config.js
    // We keep this function to prevent breaking App.jsx, but we can just log it.
    if (analytics) {
        console.log("[Analytics] Firebase GA4 Initialized");
    } else {
        console.warn("[Analytics] Firebase GA4 failed to initialize.");
    }
};

export const logPageView = (path) => {
    if (analytics) {
        firebaseLogEvent(analytics, 'page_view', {
            page_path: path,
        });
    }
};

export const logEvent = (action, params) => {
    if (analytics) {
        firebaseLogEvent(analytics, action, params);
    }
};
