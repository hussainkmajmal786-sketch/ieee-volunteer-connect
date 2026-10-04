import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronDown, Download, FileText, MousePointerClick, Eye, UserCheck, TrendingUp, Loader2 } from "lucide-react";
import { collection, getDocs } from "../../lib/firestore";
import { db } from "../../lib/backend";
import { ambassadorRows } from "../../utils/referral";
import { exportRegistrationsCsv, exportRegistrationsPdf, formatDate, sourceLabel } from "../../utils/registrationExport";
import { useToast } from "../../hooks/useToast";
import MainSiteSync from "./MainSiteSync";

const PREVIEW = 20;

function Answers({ answers }) {
    const entries = Object.entries(answers || {});
    if (entries.length === 0) return null;
    return (
        <dl className="mt-1 grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            {entries.map(([q, a]) => (
                <div key={q} className="min-w-0"><dt className="inline text-gray-400">{q}: </dt><dd className="inline text-gray-700 dark:text-gray-300 break-words">{a}</dd></div>
            ))}
        </dl>
    );
}

/**
 * Admin view of the ambassador funnel for one event: per ambassador, link
 * clicks → unique visitors → registrations, with the full list of who
 * registered through each link.
 */
export default function AmbassadorMonitor({ events = [], volunteers = [], isSuperAdmin = false }) {
    const addToast = useToast();
    const eventsWithActivity = useMemo(
        () => events.filter(e => ambassadorRows(e).length > 0),
        [events]
    );
    const [selectedId, setSelectedId] = useState('');
    const eventId = selectedId || eventsWithActivity[0]?.id || events[0]?.id || '';
    const event = events.find(e => e.id === eventId);

    const [registrations, setRegistrations] = useState({ eventId: null, list: [] });
    const [openRef, setOpenRef] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [reload, setReload] = useState(0);
    const [openReg, setOpenReg] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);
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
    }, [eventId, reload]);

    const nameOf = (uid, fallback) =>
        volunteers.find(v => v.id === uid || v.uid === uid)?.name || fallback || 'Unknown ambassador';

    const typeOf = (uid) => volunteers.find(v => v.id === uid || v.uid === uid)?.ambassadorType || null;
    const allRows = useMemo(() => (event ? ambassadorRows(event) : []), [event]);
    const rows = useMemo(() => (typeFilter === 'all' ? allRows : allRows.filter(r => {
        const t = volunteers.find(v => v.id === r.refId || v.uid === r.refId)?.ambassadorType || 'other';
        return t === typeFilter;
    })), [allRows, typeFilter, volunteers]);
    const isExternal = event?.linkMode === 'external';
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

    // Registrations shown/exported: everyone, or only those whose ambassador matches the type filter.
    const exportList = useMemo(() => (typeFilter === 'all' ? registrations.list : registrations.list.filter(r => {
        if (!r.referredBy) return false;
        return (typeOf(r.referredBy) || 'other') === typeFilter;
    })), [registrations.list, typeFilter, volunteers]); // eslint-disable-line react-hooks/exhaustive-deps
    const ambassadorOf = (uid, fallback) => ({ name: nameOf(uid, fallback), type: typeOf(uid) || '' });

    const exportCsv = () => exportRegistrationsCsv(event, exportList, ambassadorOf);
    const exportPdf = async () => {
        setPdfBusy(true);
        try {
            const funnel = rows.map(r => ({ ...r, name: nameOf(r.refId, byRef[r.refId]?.[0]?.referrerName), type: typeOf(r.refId) }));
            await exportRegistrationsPdf(event, exportList, ambassadorOf, funnel);
        } catch (err) {
            console.error('PDF export failed', err);
            addToast('Could not create the PDF', 'error');
        } finally {
            setPdfBusy(false);
        }
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
                    {isExternal && !isSuperAdmin && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">This event registers on the main website; registrations appear here once the super admin connects its form.</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setOpenRef(null); }}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none"
                        aria-label="Ambassador type"
                    >
                        <option value="all">All ambassadors</option>
                        <option value="campus">Campus ambassadors</option>
                        <option value="class">Class ambassadors</option>
                        <option value="other">Other volunteers</option>
                    </select>
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
                        disabled={loading || exportList.length === 0}
                        title="Download every registration with all form answers"
                        aria-label="Download registrations as CSV"
                        className="flex items-center gap-2 px-4 py-2 bg-ieee-blue text-white rounded-xl text-sm font-bold hover:bg-ieee-blue/90 transition disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button
                        onClick={exportPdf}
                        disabled={loading || pdfBusy || exportList.length === 0}
                        title="Download a PDF report"
                        aria-label="Download registrations as PDF"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} PDF
                    </button>
                </div>
            </div>

            {isExternal && isSuperAdmin && <MainSiteSync event={event} onImported={() => setReload(n => n + 1)} />}

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
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                            {nameOf(r.refId, list[0]?.referrerName)}
                                            {typeOf(r.refId) && (
                                                <span className={`ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${typeOf(r.refId) === 'campus' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                                                    {typeOf(r.refId)}
                                                </span>
                                            )}
                                        </td>
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
                                                                        <td className="py-2 pr-3 text-sm font-semibold text-gray-900 dark:text-white align-top">{reg.name}<span className="block text-[10px] text-gray-400 font-normal">{reg.year} · {sourceLabel(reg)}</span><Answers answers={reg.answers} /></td>
                                                                        <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-300 align-top">{reg.email}<span className="block text-gray-400">{reg.phone}</span></td>
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

            {/* Every registration (this website + main website) with full form answers */}
            {!loading && exportList.length > 0 && (
                <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h3 className="px-4 pt-4 pb-2 text-sm font-bold text-gray-900 dark:text-white">
                        All registrations <span className="text-gray-400 font-semibold">({exportList.length})</span>
                    </h3>
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {(showAll ? exportList : exportList.slice(0, PREVIEW)).map(reg => {
                            const open = openReg === reg.id;
                            const hasAnswers = Object.keys(reg.answers || {}).length > 0;
                            return (
                                <li key={reg.id} className="px-4 py-2.5">
                                    <button type="button" onClick={() => setOpenReg(open ? null : reg.id)} disabled={!hasAnswers} aria-expanded={hasAnswers ? open : undefined}
                                        className="w-full flex flex-wrap items-center gap-x-3 gap-y-0.5 text-left">
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{reg.name || reg.email || reg.phone}</span>
                                        <span className="text-xs text-gray-500">{[reg.email, reg.phone, reg.college].filter(Boolean).join(' · ')}</span>
                                        <span className="ml-auto flex items-center gap-2 text-[10px]">
                                            <span className={`px-1.5 py-0.5 rounded-md font-bold ${reg.referredBy ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                                                {reg.referredBy ? nameOf(reg.referredBy, reg.referrerName) : 'Direct'}
                                            </span>
                                            <span className="text-gray-400">{sourceLabel(reg)} · {formatDate(reg.registeredAt)}</span>
                                            {hasAnswers && <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
                                        </span>
                                    </button>
                                    {open && <Answers answers={reg.answers} />}
                                </li>
                            );
                        })}
                    </ul>
                    {exportList.length > PREVIEW && (
                        <button type="button" onClick={() => setShowAll(v => !v)} className="w-full py-2.5 text-xs font-bold text-ieee-blue border-t border-gray-50 dark:border-gray-800">
                            {showAll ? 'Show less' : `Show all ${exportList.length}`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
