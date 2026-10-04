import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick, Eye, UserCheck, TrendingUp, ChevronDown, Building2 } from "lucide-react";
import { collection, query, where, getDocs } from "../lib/firestore";
import { db } from "../lib/backend";
import { referralFunnel } from "../utils/referral";

function formatDate(ts) {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '—';
}

/**
 * Ambassador view: for each event, how many people opened my link, how many
 * distinct visitors that was, and who registered through it.
 */
export default function ReferralStatsPanel({ user, events }) {
    const [openEventId, setOpenEventId] = useState(null);
    const [registrants, setRegistrants] = useState({});
    const [errors, setErrors] = useState({});

    const rows = events
        .map(evt => ({ evt, ...referralFunnel(evt, user.uid) }))
        .sort((a, b) => b.registrations - a.registrations || b.visitors - a.visitors || b.clicks - a.clicks);

    const totals = rows.reduce((acc, r) => ({
        clicks: acc.clicks + r.clicks,
        visitors: acc.visitors + r.visitors,
        registrations: acc.registrations + r.registrations,
    }), { clicks: 0, visitors: 0, registrations: 0 });
    const conversion = totals.visitors > 0 ? Math.round((totals.registrations / totals.visitors) * 100) : 0;

    const toggle = async (eventId) => {
        if (openEventId === eventId) { setOpenEventId(null); return; }
        setOpenEventId(eventId);
        if (registrants[eventId]) return;
        try {
            const snap = await getDocs(query(
                collection(db, "events", eventId, "registrations"),
                where("referredBy", "==", user.uid)
            ));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.registeredAt?.toMillis?.() || 0) - (a.registeredAt?.toMillis?.() || 0));
            setRegistrants(prev => ({ ...prev, [eventId]: list }));
        } catch (error) {
            console.error("Failed to load referred registrations", error);
            setErrors(prev => ({ ...prev, [eventId]: 'Registrant names are visible once your volunteer account is approved.' }));
        }
    };

    const tiles = [
        { label: 'Link Clicks', value: totals.clicks, icon: MousePointerClick, color: 'text-ieee-blue bg-ieee-blue/10' },
        { label: 'Unique Visitors', value: totals.visitors, icon: Eye, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
        { label: 'Registrations', value: totals.registrations, icon: UserCheck, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
        { label: 'Conversion', value: `${conversion}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    ];

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Referral Performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Who opened your links and who registered through them.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {tiles.map(t => (
                    <div key={t.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${t.color}`}>
                            <t.icon className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{t.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {rows.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-400">No events yet. Share a link from &ldquo;Share &amp; Earn&rdquo; to start.</p>
                ) : rows.map(({ evt, clicks, visitors, registrations, conversion: conv }) => {
                    const open = openEventId === evt.id;
                    const list = registrants[evt.id];
                    return (
                        <div key={evt.id}>
                            <button
                                onClick={() => toggle(evt.id)}
                                aria-expanded={open}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{evt.name}</p>
                                    <p className="text-[11px] text-gray-400 tabular-nums">
                                        {clicks} clicks · {visitors} visitors · <span className="font-bold text-green-600 dark:text-green-400">{registrations} registered</span> · {conv}% conversion
                                    </p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {open && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="px-4 pb-4">
                                            {errors[evt.id] ? (
                                                <p className="text-xs text-amber-600 dark:text-amber-400">{errors[evt.id]}</p>
                                            ) : !list ? (
                                                <p className="text-xs text-gray-400">Loading…</p>
                                            ) : list.length === 0 ? (
                                                <p className="text-xs text-gray-400">Nobody has registered through your link yet.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {list.map(r => (
                                                        <li key={r.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</p>
                                                                <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                                                    <Building2 className="w-3 h-3 shrink-0" /> {r.college} · {r.year}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(r.registeredAt)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
