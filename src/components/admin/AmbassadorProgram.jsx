import { useEffect, useMemo, useState } from "react";
import { Megaphone, Send, CheckCircle, XCircle, Clock, Download, Eye, EyeOff, Save } from "lucide-react";
import { db, doc, collection, query, orderBy, onSnapshot, setDoc, serverTimestamp } from "../../lib/firestore";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import Button from "../Button";

const INPUT = "w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none";
const CARD = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5";
const STATUS_STYLE = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const AUDIENCES = [
    { value: "campus", label: "Campus ambassadors" },
    { value: "class", label: "Class ambassadors" },
    { value: "both", label: "Both" },
    { value: "selected", label: "Choose people" },
];

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Super admin: Class Ambassador form, applications, and ambassador notifications. */
export default function AmbassadorProgram({ users = [] }) {
    const addToast = useToast();
    const [form, setForm] = useState({ title: "Become a Class Ambassador", description: "", published: false });
    const [formLoaded, setFormLoaded] = useState(false);
    const [savingForm, setSavingForm] = useState(false);
    const [applications, setApplications] = useState([]);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [busyId, setBusyId] = useState(null);
    const [note, setNote] = useState({ audience: "both", title: "", message: "", selected: [] });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const unsubForm = onSnapshot(doc(db, "settings", "classAmbassadorForm"), (snap) => {
            if (snap.exists()) setForm(f => ({ ...f, ...snap.data() }));
            setFormLoaded(true);
        });
        const unsubApps = onSnapshot(
            query(collection(db, "ambassadorApplications"), orderBy("createdAt", "desc")),
            (snap) => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => setApplications([])
        );
        return () => { unsubForm(); unsubApps(); };
    }, []);

    const campus = useMemo(() => users.filter(u => u.ambassadorType === "campus"), [users]);
    const classAmb = useMemo(() => users.filter(u => u.ambassadorType === "class"), [users]);
    const ambassadors = useMemo(() => [...campus, ...classAmb], [campus, classAmb]);
    const shownApps = statusFilter === "ALL" ? applications : applications.filter(a => a.status === statusFilter);

    const saveForm = async (published = form.published) => {
        setSavingForm(true);
        try {
            await setDoc(doc(db, "settings", "classAmbassadorForm"), {
                title: form.title.trim() || "Become a Class Ambassador",
                description: form.description.trim(),
                published,
                updatedAt: serverTimestamp(),
            });
            addToast(published ? "Form published — campus ambassadors can now share it" : "Form saved (not published)", "success");
        } catch (err) {
            addToast(err.message || "Could not save the form", "error");
        } finally {
            setSavingForm(false);
        }
    };

    const review = async (app, status) => {
        setBusyId(app.id);
        try {
            await api(`/api/admin/ambassador-applications/${encodeURIComponent(app.id)}`, { status });
            addToast(`${app.name} ${status === "APPROVED" ? "is now a Class Ambassador" : "was rejected"}`, status === "APPROVED" ? "success" : "info");
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setBusyId(null);
        }
    };

    const exportCsv = () => {
        const headers = ["Name", "Email", "Phone", "College", "Department", "Class", "Year", "Campus Ambassador", "Status", "Applied"];
        const rows = shownApps.map(a => [a.name, a.email, a.phone, a.college, a.department, a.className, a.year, a.campusAmbassadorName, a.status,
            a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : ""].map(csvCell).join(","));
        const url = URL.createObjectURL(new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "class_ambassador_applications.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const toggleSelected = (id) => setNote(n => ({ ...n, selected: n.selected.includes(id) ? n.selected.filter(x => x !== id) : [...n.selected, id] }));

    const send = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const { sent } = await api("/api/admin/notify", {
                audience: note.audience, title: note.title, message: note.message,
                userIds: note.audience === "selected" ? note.selected : undefined,
            });
            addToast(`Notification sent to ${sent} ambassador${sent === 1 ? "" : "s"}`, "success");
            setNote(n => ({ ...n, title: "", message: "", selected: [] }));
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setSending(false);
        }
    };

    const recipientCount = { campus: campus.length, class: classAmb.length, both: ambassadors.length, selected: note.selected.length }[note.audience];

    return (
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-ieee-blue" /> Ambassador Program</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Make campus ambassadors from User Management (📣 button). They recruit class ambassadors with the form below.</p>
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 tabular-nums">{campus.length} campus · {classAmb.length} class</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form settings */}
                <div className={CARD}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">Class Ambassador form</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${form.published ? STATUS_STYLE.APPROVED : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                            {form.published ? "Published" : "Not published"}
                        </span>
                    </div>
                    <div className="space-y-3">
                        <input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Form title" aria-label="Form title" maxLength={120} disabled={!formLoaded} />
                        <textarea className={`${INPUT} resize-none`} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="What class ambassadors do, perks, deadlines…" aria-label="Form description" maxLength={2000} disabled={!formLoaded} />
                        <p className="text-[11px] text-gray-500">Applicants fill: name, email, phone, college, department, class, year and an optional note.</p>
                        <div className="flex gap-2">
                            {form.published ? (
                                <>
                                    <Button type="button" onClick={() => saveForm(true)} isLoading={savingForm} className="flex-1"><Save className="w-4 h-4 mr-1.5" /> Save</Button>
                                    <Button type="button" variant="outline" onClick={() => saveForm(false)} disabled={savingForm} className="flex-1"><EyeOff className="w-4 h-4 mr-1.5" /> Unpublish</Button>
                                </>
                            ) : (
                                <Button type="button" onClick={() => saveForm(true)} isLoading={savingForm} disabled={!formLoaded} className="flex-1"><Eye className="w-4 h-4 mr-1.5" /> OK — Publish to campus ambassadors</Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notify */}
                <form onSubmit={send} className={CARD}>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Notify ambassadors</h3>
                    <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Recipients">
                        {AUDIENCES.map(a => (
                            <button type="button" key={a.value} role="radio" aria-checked={note.audience === a.value}
                                onClick={() => setNote({ ...note, audience: a.value })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${note.audience === a.value ? "bg-ieee-blue text-white border-ieee-blue" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-ieee-blue"}`}>
                                {a.label}
                            </button>
                        ))}
                    </div>
                    {note.audience === "selected" && (
                        <div className="max-h-40 overflow-y-auto mb-3 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                            {ambassadors.length === 0 ? <p className="p-3 text-xs text-gray-400">No ambassadors yet.</p> : ambassadors.map(u => (
                                <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                    <input type="checkbox" checked={note.selected.includes(u.id)} onChange={() => toggleSelected(u.id)} />
                                    <span className="text-gray-800 dark:text-gray-200">{u.name}</span>
                                    <span className="ml-auto text-[10px] font-bold uppercase text-gray-400">{u.ambassadorType}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    <div className="space-y-3">
                        <input className={INPUT} value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} placeholder="Title" aria-label="Notification title" maxLength={120} required />
                        <textarea className={`${INPUT} resize-none`} rows={3} value={note.message} onChange={(e) => setNote({ ...note, message: e.target.value })} placeholder="Message" aria-label="Notification message" maxLength={2000} required />
                        <Button type="submit" isLoading={sending} disabled={!recipientCount} className="w-full">
                            <Send className="w-4 h-4 mr-1.5" /> Send to {recipientCount || 0} {recipientCount === 1 ? "person" : "people"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Applications */}
            <div className={CARD}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white">Class Ambassador applications</h3>
                    <div className="flex gap-2">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter applications"
                            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white">
                            {["PENDING", "APPROVED", "REJECTED", "ALL"].map(s => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()} ({s === "ALL" ? applications.length : applications.filter(a => a.status === s).length})</option>)}
                        </select>
                        <button onClick={exportCsv} disabled={shownApps.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-ieee-blue text-white rounded-xl text-sm font-bold disabled:opacity-50"><Download className="w-4 h-4" /> CSV</button>
                    </div>
                </div>
                {shownApps.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No {statusFilter === "ALL" ? "" : statusFilter.toLowerCase()} applications.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[720px]">
                            <thead className="border-b border-gray-100 dark:border-gray-800">
                                <tr>{["Applicant", "Contact", "Class", "Campus ambassador", "Status", ""].map(h => <th key={h} className="py-2 pr-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {shownApps.map(a => (
                                    <tr key={a.id} className="align-top">
                                        <td className="py-3 pr-3">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{a.name}</p>
                                            <p className="text-[11px] text-gray-500">{a.college}</p>
                                            {a.about && <p className="text-[11px] text-gray-400 mt-1 max-w-xs line-clamp-2" title={a.about}>“{a.about}”</p>}
                                        </td>
                                        <td className="py-3 pr-3 text-xs text-gray-600 dark:text-gray-300">{a.email}<span className="block text-gray-400">{a.phone}</span></td>
                                        <td className="py-3 pr-3 text-xs text-gray-600 dark:text-gray-300">{a.department}<span className="block text-gray-400">{a.className} · {a.year}</span></td>
                                        <td className="py-3 pr-3 text-xs text-gray-600 dark:text-gray-300">{a.campusAmbassadorName || "—"}</td>
                                        <td className="py-3 pr-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLE[a.status] || STATUS_STYLE.PENDING}`}>{a.status}</span></td>
                                        <td className="py-3 text-right whitespace-nowrap">
                                            {a.status === "PENDING" && (
                                                <div className="inline-flex gap-1">
                                                    <button onClick={() => review(a, "APPROVED")} disabled={busyId === a.id} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50" title="Approve" aria-label={`Approve ${a.name}`}><CheckCircle className="w-5 h-5" /></button>
                                                    <button onClick={() => review(a, "REJECTED")} disabled={busyId === a.id} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50" title="Reject" aria-label={`Reject ${a.name}`}><XCircle className="w-5 h-5" /></button>
                                                </div>
                                            )}
                                            {a.status !== "PENDING" && <Clock className="w-4 h-4 text-gray-300 inline" aria-hidden="true" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
