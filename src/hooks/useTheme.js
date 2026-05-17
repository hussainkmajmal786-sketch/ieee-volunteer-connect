import { useEffect, useState, useCallback } from 'react';

/**
 * Resolve the initial theme:
 * 1. `localStorage.theme` (user preference — highest priority)
 * 2. `prefers-color-scheme` (system default)
 * 3. `'light'` fallback
 */
function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    // Apply theme to <html> and persist to localStorage
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.style.colorScheme = theme;
        localStorage.setItem('theme', theme);
        // Keep the browser chrome (address bar / PWA) in sync
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1220' : '#00629B');
    }, [theme]);

    // Follow system changes *if the user has not set a manual preference*
    useEffect(() => {
        if (!window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            const stored = localStorage.getItem('theme');
            if (stored !== 'light' && stored !== 'dark') {
                setTheme(e.matches ? 'dark' : 'light');
            }
        };
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    return { theme, toggleTheme, setTheme };
}
