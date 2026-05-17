import { useEffect, useState } from "react";
import { Download } from "lucide-react";

/**
 * Listens for the PWA `beforeinstallprompt` event and renders an "Install App"
 * button only when the browser considers the app installable and the user
 * hasn't already installed it.
 */
function getInitialInstalled() {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(display-mode: standalone)").matches || false;
}

export default function InstallPWAButton({ className = "" }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(getInitialInstalled);

    useEffect(() => {
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    if (installed || !deferredPrompt) return null;

    const install = async () => {
        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice?.outcome === "accepted") setInstalled(true);
            setDeferredPrompt(null);
        } catch {
            // swallow — not all browsers support this flow
        }
    };

    return (
        <button
            type="button"
            onClick={install}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-ieee-blue/10 dark:bg-cyan-900/30 text-ieee-blue dark:text-cyan-400 hover:bg-ieee-blue/15 dark:hover:bg-cyan-900/40 transition-colors ${className}`}
            aria-label="Install IEEE Volunteer Connect as an app"
        >
            <Download size={13} /> Install App
        </button>
    );
}
