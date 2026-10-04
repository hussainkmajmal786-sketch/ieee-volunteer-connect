import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Lock } from "lucide-react";
import Avatar from "./Avatar";
import { apiGet } from "../lib/api";

/**
 * Who's going: up to 10 photos for everyone, a "See all" pop-up with names
 * and colleges for verified volunteers and admins.
 */
export default function EventParticipants({ eventId, refreshKey, onCount }) {
    const [data, setData] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        apiGet(`/api/events/${encodeURIComponent(eventId)}/participants`)
            .then(d => { if (!cancelled) { setData(d); onCount?.(d.count); } })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [eventId, refreshKey, onCount]);

    if (!data || data.count === 0) return null;
    const extra = data.count - data.avatars.length;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-ieee-blue" /> Who&apos;s going</h3>
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex -space-x-2">
                    {data.avatars.map((a, i) => <Avatar key={i} src={a.photoURL} name={a.initial} size="sm" className="ring-2 ring-white dark:ring-gray-900" />)}
                    {extra > 0 && (
                        <span className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-bold flex items-center justify-center">+{extra}</span>
                    )}
                </div>
                <button onClick={() => setOpen(true)} className="text-sm font-semibold text-ieee-blue dark:text-cyan-400 hover:underline">See all {data.count}</button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Participants"
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold text-gray-900 dark:text-white">{data.count} participant{data.count === 1 ? "" : "s"}</h3>
                                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400" aria-label="Close"><X className="w-5 h-5" /></button>
                            </div>
                            {data.canSeeDetails ? (
                                <ul className="overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                                    {data.participants.map((p, i) => {
                                        const body = (
                                            <>
                                                <Avatar src={p.photoURL} name={p.name} size="sm" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</p>
                                                    <p className="text-[11px] text-gray-500 truncate">{[p.department, p.year, p.college].filter(Boolean).join(" · ")}</p>
                                                </div>
                                            </>
                                        );
                                        return (
                                            <li key={p.userId || i}>
                                                {p.hasPortfolio && p.userId ? (
                                                    <Link to={`/volunteers/${p.userId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">{body}</Link>
                                                ) : (
                                                    <div className="flex items-center gap-3 px-4 py-2.5">{body}</div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="p-5 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {data.avatars.map((a, i) => <Avatar key={i} src={a.photoURL} name={a.initial} size="md" />)}
                                    </div>
                                    <p className="text-sm text-gray-500 flex items-start gap-2"><Lock className="w-4 h-4 shrink-0 mt-0.5" /> Only verified volunteers can see participant details.</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
