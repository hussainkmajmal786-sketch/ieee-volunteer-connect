import { collection, query, orderBy, limit, onSnapshot, getCountFromServer, getDocs, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/config";

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return 'mobile';
    if (/iPad|Tablet/i.test(ua)) return 'tablet';
    return 'desktop';
}

function getOrCreateSession() {
    let sid = sessionStorage.getItem('_vc_sid');
    if (!sid) {
        sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('_vc_sid', sid);
    }
    return sid;
}

function deriveSource(referrer, utmSource) {
    if (utmSource) return utmSource;
    if (!referrer) return 'direct';
    try {
        const host = new URL(referrer).hostname.replace('www.', '');
        if (host.includes('google')) return 'google';
        if (host.includes('instagram')) return 'instagram';
        if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
        if (host.includes('twitter') || host.includes('x.com')) return 'twitter';
        if (host.includes('linkedin')) return 'linkedin';
        if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
        if (host.includes('t.me') || host.includes('telegram')) return 'telegram';
        return host || 'referral';
    } catch { return 'referral'; }
}

function deriveMedium(source, utmMedium) {
    if (utmMedium) return utmMedium;
    if (source === 'direct') return 'direct';
    if (['google'].includes(source)) return 'organic';
    if (['twitter', 'instagram', 'facebook', 'linkedin'].includes(source)) return 'social';
    if (['whatsapp', 'telegram'].includes(source)) return 'messaging';
    return 'referral';
}

export const trackingService = {
    async track(eventType, data = {}) {
        try {
            const params = new URLSearchParams(window.location.search);
            const utmSource = params.get('utm_source') || data.source || null;
            const source = deriveSource(document.referrer, utmSource);
            const medium = deriveMedium(source, params.get('utm_medium') || data.medium || null);

            const recordLinkClick = httpsCallable(functions, 'recordLinkClick');
            await recordLinkClick({
                eventType,
                source,
                medium,
                campaign: params.get('utm_campaign') || data.campaign || null,
                page: window.location.pathname,
                element: data.element || null,
                eventId: data.eventId || null,
                eventName: data.eventName || null,
                refId: params.get('ref') || data.refId || null,
                sessionId: getOrCreateSession(),
                device: getDeviceType(),
            });
        } catch { /* tracking must never break the app */ }
    },

    subscribeToClicks(callback, limitCount = 50) {
        // Reduced limit to 50 strictly for the live recent activity feed
        const q = query(
            collection(db, 'linkClicks'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q,
            (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => callback([])
        );
    },

    async getClickStats(days = 0) {
        try {
            const clicksRef = collection(db, 'linkClicks');
            
            // Get exact total counts without downloading all documents
            const totalSnap = await getCountFromServer(clicksRef);
            const totalTracked = totalSnap.data().count;

            let q;
            if (days > 0) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - days);
                q = query(clicksRef, where('timestamp', '>=', dateLimit), orderBy('timestamp', 'desc'));
            } else {
                // Limit to 5000 docs for All Time to prevent memory bloat, but totalTracked is accurate
                q = query(clicksRef, orderBy('timestamp', 'desc'), limit(5000));
            }
            
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            return {
                totalTracked,
                data
            };
        } catch (error) {
            console.error("Error fetching click stats:", error);
            return { totalTracked: 0, data: [] };
        }
    }
};
