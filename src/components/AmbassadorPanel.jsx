import { useEffect, useState } from "react";
import { Megaphone, Copy, Check, Users, Phone, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { db, doc, collection, query, where, orderBy, onSnapshot } from "../lib/firestore";
import { useToast } from "../hooks/useToast";

const STATUS = {
    PENDING: { label: "Pending", icon: Clock, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    APPROVED: { label: "Approved", icon: CheckCircle, cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    REJECTED: { label: "Rejected", icon: XCircle, cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function formatDate(ts) {
    const d = ts?.toDate ? ts.toDate() : null;
    return d ? d.toLocaleDateString() : "";
}

/** Ambassador status, plus the Class Ambassador recruitment tools for campus ambassadors. */
export default function AmbassadorPanel({ user }) {
    const addToast = useToast();
    const [settings, setSettings] = useState(null);
    const [applications, setApplications] = useState([]);
    const [copied, setCopied] = useState(false);
    const isCampus = user?.ambassadorType === "campus";

    useEffect(() => {
        if (!isCampus) return;
        const unsubSettings = onSnapshot(doc(db, "settings", "classAmbassadorForm"), (snap) => setSettings(snap.exists() ? snap.data() : null));
        const unsubApps = onSnapshot(
            query(collection(db, "ambassadorApplications"), where("campusAmbassadorId", "==", user.uid), orderBy("createdAt", "desc")),
            (snap) => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => setApplications([])
        );
        return () => { unsubSettings(); unsubApps(); };
    }, [isCampus, user?.uid]);

    if (!user?.ambassadorType) return null;

    if (!isCampus) {
        return (
            <div className="mb-8 rounded-2xl p-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center gap-4 shadow-lg">
                <Megaphone className="w-8 h-8 shrink-0" />
                <div>
                    <p className="font-black text-lg">Class Ambassador</p>
                    <p className="text-white/80 text-sm">
                        {user.campusAmbassadorName ? <>Your Campus Ambassador is <b className="text-white">{user.campusAmbassadorName}</b>. </> : null}
                        Share your event links below — every registration counts toward your rewards.
                    </p>
                </div>
            </div>
        );
    }

    const link = `${window.location.origin}/ambassador/apply?ca=${encodeURIComponent(user.uid)}`;
    const copy = async () => {
        try { await navigator.clipboard.writeText(link); } catch { /* clipboard blocked */ }
        setCopied(true);
        addToast("Class Ambassador form link copied 🔗", "success");
        setTimeout(() => setCopied(false), 2000);
    };
    const whatsapp = () => {
        const text = `${settings?.title || "Become an IEEE Class Ambassador"} — apply here: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    };
    const counts = applications.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), {});

    return (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-ieee-blue to-violet-600 text-white">
                <p className="font-black text-lg flex items-center gap-2"><Megaphone className="w-5 h-5" /> Campus Ambassador</p>
                <p className="text-white/80 text-sm">Recruit Class Ambassadors with your personal form link.</p>
            </div>
            <div className="p-5 space-y-5">
                {settings?.published ? (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Class Ambassador form</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Your form link"
                                className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-200" />
                            <div className="flex gap-2">
                                <button onClick={copy} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-ieee-blue text-white hover:bg-ieee-blue/90 transition">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
                                </button>
                                <button onClick={whatsapp} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition">WhatsApp</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        The Class Ambassador form isn&apos;t open yet. It will appear here as soon as the super admin publishes it.
                    </p>
                )}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Applications through your link</p>
                        <p className="text-[11px] text-gray-400 tabular-nums">{applications.length} total · {counts.APPROVED || 0} approved · {counts.PENDING || 0} pending</p>
                    </div>
                    {applications.length === 0 ? (
                        <p className="text-sm text-gray-400 py-3">No applications yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {applications.map(a => {
                                const st = STATUS[a.status] || STATUS.PENDING;
                                return (
                                    <li key={a.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{a.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{a.department} · {a.className} · {a.year}</p>
                                        </div>
                                        <div className="text-[11px] text-gray-500 space-y-0.5 min-w-0">
                                            <a href={`tel:${a.phone}`} className="flex items-center gap-1 hover:text-ieee-blue"><Phone className="w-3 h-3" /> {a.phone}</a>
                                            <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-ieee-blue truncate"><Mail className="w-3 h-3" /> {a.email}</a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1 ${st.cls}`}><st.icon className="w-3 h-3" /> {st.label}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(a.createdAt)}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
