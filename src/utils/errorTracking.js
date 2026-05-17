import * as Sentry from "@sentry/react";

let initialized = false;

export function initErrorTracking() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (!dsn || dsn === "https://examplePublicKey@o0.ingest.sentry.io/0") {
        return;
    }

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
    });
    initialized = true;
}

export function reportError(error, context = {}) {
    if (!initialized) return;
    Sentry.captureException(error, { extra: context });
}
