import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronDown, Download, MousePointerClick, Eye, UserCheck, TrendingUp } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { ambassadorRows } from "../../utils/referral";

function formatDate(ts) {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : '';
}

function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/**
 * Admin view of the ambassador funnel for one event: per ambassador, link
 * clicks → unique visitors → registrations, with the full list of who
 * registered through each link.
 */
export default function AmbassadorMonitor({ events = [], volunteers = [] }) {
    const eventsWithActivity = useMemo(
        () => events.filter(e => ambassadorRows(e).length > 0),
        [events]
    );
    const [selectedId, setSelectedId] = useState('');
    const eventId = selectedId || eventsWithActivity[0]?.id || events[0]?.id || '';
    const event = events.find(e => e.id === eventId);

    const [registrations, setRegistrations] = useState({ eventId: null, list: [] });
    const [openRef, setOpenRef] = useState(null);
    const loading = registrations.eventId !== eventId;

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;
        getDocs(collection(db, "events", eventId, "registrations"))
            .then(snap => {
                if (cancelled) return;
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.registeredAt?.toMillis?.() || 0) - (a.registeredAt?.toMillis?.() || 0));
                setRegistrations({ eventId, list });
            })
            .catch(error => {
                console.error("Failed to load registrations", error);
                if (!cancelled) setRegistrations({ eventId, list: [] });
            });
        return () => { cancelled = true; };
    }, [eventId]);

    const nameOf = (uid, fallback) =>
        volunteers.find(v => v.id === uid || v.uid === uid)?.name || fallback || 'Unknown ambassador';

    const rows = useMemo(() => (event ? ambassadorRows(event) : []), [event]);
    const byRef = useMemo(() => {
        const map = {};
        registrations.list.forEach(r => {
            if (!r.referredBy) return;
            (map[r.referredBy] ||= []).push(r);
        });
        return map;
    }, [registrations.list]);

    const totals = rows.reduce((acc, r) => ({
        clicks: acc.clicks + r.clicks,
        visitors: acc.visitors + r.visitors,
        registrations: acc.registrations + r.registrations,
    }), { clicks: 0, visitors: 0, registrations: 0 });
    const direct = loading ? null : registrations.list.filter(r => !r.referredBy).length;

    const exportCsv = () => {
        const headers = ['Ambassador', 'Name', 'Email', 'Phone', 'College', 'Year', 'Registered At'];
        const lines = registrations.list
            .filter(r => r.referredBy)
            .map(r => [nameOf(r.referredBy, r.referrerName), r.name, r.email, r.phone, r.college, r.year, formatDate(r.registeredAt)].map(csvCell).join(','));
        const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(event?.name || 'event').replace(/\s+/g, '_')}_ambassador_referrals.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const tiles = [
        { label: 'Link Clicks', value: totals.clicks, icon: MousePointerClick, grad: 'from-ieee-blue to-cyan-400' },
        { label: 'Unique Visitors', value: totals.visitors, icon: Eye, grad: 'from-violet-500 to-purple-400' },
        { label: 'Via Ambassadors', value: totals.registrations, icon: UserCheck, grad: 'from-emerald-500 to-teal-400' },
        { label: 'Direct / Other', value: direct ?? '…', icon: TrendingUp, grad: 'from-amber-500 to-orange-400' },
    ];

    return (
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-ieee-blue" /> Ambassador Monitor
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clicks, visitors and registrations per ambassador link.</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={eventId}
                        onChange={(e) => { setSelectedId(e.target.value); setOpenRef(null); }}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none max-w-[16rem]"
                        aria-label="Select event"
                    >
                        {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <button
                        onClick={exportCsv}
                        disabled={loading || totals.registrations === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-ieee-blue text-white rounded-xl text-sm font-bold hover:bg-ieee-blue/90 transition disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {tiles.map(t => (
                    <div key={t.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.grad} flex items-center justify-center mb-2`}>
                            <t.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{t.value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
                {rows.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-400 italic">No ambassador link activity for this event yet.</p>
                ) : (
                    <table className="w-full text-left min-w-[560px]">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                {['Ambassador', 'Clicks', 'Visitors', 'Registered', 'Conversion', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {rows.map(r => {
                                const open = openRef === r.refId;
                                const list = byRef[r.refId] || [];
                                return [
                                    <tr key={r.refId} onClick={() => setOpenRef(open ? null : r.refId)}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{nameOf(r.refId, list[0]?.referrerName)}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{r.clicks}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{r.visitors}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums font-bold text-green-600 dark:text-green-400">{r.registrations}</td>
                                        <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-300">{r.conversion}%</td>
                                        <td className="px-4 py-3 text-right">
                                            <ChevronDown className={`w-4 h-4 inline text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                                        </td>
                                    </tr>,
                                    <AnimatePresence key={`${r.refId}-detail`}>
                                        {open && (
                                            <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <td colSpan={6} className="px-4 pb-4 bg-gray-50/60 dark:bg-gray-800/20">
                                                    {loading ? (
                                                        <p className="text-xs text-gray-400 py-3">Loading registrants…</p>
                                                    ) : list.length === 0 ? (
                                                        <p className="text-xs text-gray-400 py-3">No registrations through this link yet.</p>
                                                    ) : (
                                                        <table className="w-full text-left mt-2">
                                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                {list.map(reg => (
                                                                    <tr key={reg.id}>
                                                                        <td className="py-2 pr-3 text-sm font-semibold text-gray-900 dark:text-white">{reg.name}<span className="block text-[10px] text-gray-400 font-normal">{reg.year}</span></td>
                                                                        <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-300">{reg.email}<span className="block text-gray-400">{reg.phone}</span></td>
                                                                        <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-300">{reg.college}</td>
                                                                        <td className="py-2 text-[10px] text-gray-400 whitespace-nowrap">{formatDate(reg.registeredAt)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        )}
                                    </AnimatePresence>,
                                ];
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
