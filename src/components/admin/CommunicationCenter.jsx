import { useCallback, useEffect, useMemo, useState } from "react";
import { Share2, Upload, Trash2, Mail, MessageSquare, Send, Users, AlertTriangle, CheckCircle, FileText, Link as LinkIcon } from "lucide-react";
import { db, collection, query, orderBy, limit, onSnapshot, decode } from "../../lib/firestore";
import { api, apiGet, apiDelete, apiForm } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import Button from "../Button";
import { formatBytes } from "../../utils/format";

const INPUT = "w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none";
const CARD = "bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5";
const BATCH = 40;

const SHARE_AUDIENCES = [
    { value: "campus", label: "Campus ambassadors" },
    { value: "class", label: "Class ambassadors" },
    { value: "ambassadors", label: "All ambassadors" },
    { value: "volunteers", label: "All volunteers" },
    { value: "everyone", label: "Everyone" },
    { value: "selected", label: "Choose people" },
];
const AUDIENCE_LABEL = Object.fromEntries(SHARE_AUDIENCES.map(a => [a.value, a.label]));

const NEWSLETTER = "__newsletter__"; // matches NEWSLETTER_AUDIENCE on the server
const CHANNELS = [
    { value: "email", label: "Email", icon: Mail, setup: "Add BREVO_API_KEY and BREVO_SENDER_EMAIL" },
    { value: "sms", label: "SMS", icon: MessageSquare, setup: "Add FAST2SMS_API_KEY" },
    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, setup: "Add WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID" },
];

/** Super admin: share files/links with ambassadors & volunteers, and message registered participants. */
export default function CommunicationCenter({ users = [], events = [] }) {
    const addToast = useToast();

    // ── Shared files ──
    const [shares, setShares] = useState([]);
    const [share, setShare] = useState({ title: "", description: "", audience: "ambassadors", url: "", selected: [] });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);

    const loadShares = useCallback(async () => {
        try { setShares(decode((await apiGet("/api/shared-files")).files)); } catch { setShares([]); }
    }, []);
    useEffect(() => { loadShares(); }, [loadShares]);

    const people = useMemo(() => users.filter(u => u.role === "VOLUNTEER" || u.ambassadorType).sort((a, b) => (a.name || "").localeCompare(b.name || "")), [users]);

    const submitShare = async (e) => {
        e.preventDefault();
        if (!file && !share.url.trim()) return addToast("Attach a file or add a link", "error");
        setUploading(true);
        try {
            const form = new FormData();
            form.append("title", share.title);
            form.append("description", share.description);
            form.append("audience", share.audience);
            if (share.audience === "selected") form.append("userIds", JSON.stringify(share.selected));
            if (file) form.append("file", file, file.name);
            else form.append("url", share.url.trim());
            const { recipients } = await apiForm("/api/shared-files", form);
            addToast(`Shared with ${recipients} ${recipients === 1 ? "person" : "people"}`, "success");
            setShare({ title: "", description: "", audience: share.audience, url: "", selected: [] });
            setFile(null);
            setFileInputKey(k => k + 1);
            loadShares();
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const removeShare = async (f) => {
        if (!window.confirm(`Delete "${f.title}"? People will no longer be able to open it.`)) return;
        try { await apiDelete(`/api/shared-files/${encodeURIComponent(f.id)}`); loadShares(); } catch (err) { addToast(err.message, "error"); }
    };

    // ── Participant messaging ──
    const [eventId, setEventId] = useState("");
    const [roster, setRoster] = useState(null);
    const [channel, setChannel] = useState("email");
    const [msg, setMsg] = useState({ subject: "", message: "" });
    const [progress, setProgress] = useState(null);   // { done, total, sent, failed, error }
    const [history, setHistory] = useState([]);

    useEffect(() => {
        let cancelled = false;
        apiGet(`/api/admin/participants${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`)
            .then(r => { if (!cancelled) setRoster(r); })
            .catch(() => { if (!cancelled) setRoster(null); });
        return () => { cancelled = true; };
    }, [eventId]);

    useEffect(() => onSnapshot(
        query(collection(db, "broadcasts"), orderBy("createdAt", "desc"), limit(8)),
        (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        () => setHistory([])
    ), []);

    const isNewsletter = eventId === NEWSLETTER;
    const reachable = roster ? roster.participants.filter(p => (channel === "email" ? p.email : p.phone)) : [];
    const channelReady = roster?.channels?.[channel];
    const sending = progress && progress.done < progress.total;

    const send = async (e) => {
        e.preventDefault();
        const label = CHANNELS.find(c => c.value === channel).label;
        if (!window.confirm(`Send this ${label} to ${reachable.length} participant${reachable.length === 1 ? "" : "s"}?`)) return;
        const eventName = isNewsletter ? "Newsletter subscribers" : events.find(ev => ev.id === eventId)?.name || "All events";
        let logId = null;
        const state = { done: 0, total: reachable.length, sent: 0, failed: 0, error: null };
        setProgress({ ...state });
        for (let i = 0; i < reachable.length; i += BATCH) {
            const batch = reachable.slice(i, i + BATCH).map(({ name, email, phone }) => ({ name, email, phone }));
            try {
                const r = await api("/api/admin/broadcast", {
                    channel, subject: msg.subject, message: msg.message, recipients: batch,
                    audience: isNewsletter ? "newsletter" : undefined,
                    logId, eventId: isNewsletter ? null : (eventId || null), eventName, total: reachable.length,
                });
                logId = r.logId;
                state.sent += r.sent;
                state.failed += r.failed;
                state.error = state.error || r.error || null;
            } catch (err) {
                state.failed += batch.length;
                state.error = state.error || err.message;
            }
            state.done = Math.min(reachable.length, i + BATCH);
            setProgress({ ...state });
        }
        addToast(`${label}: ${state.sent} sent${state.failed ? `, ${state.failed} failed` : ""}`, state.failed ? "warning" : "success");
    };

    const preview = msg.message.replace(/\{\{name\}\}/g, roster?.participants?.[0]?.name || "Asha");

    return (
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Share2 className="w-5 h-5 text-ieee-blue" /> Communication Center</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share files with your team, and message everyone who registered for your events.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Share files */}
                <form onSubmit={submitShare} className={CARD}>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-amber-500" /> Share a file or link</h3>
                    <div className="space-y-3">
                        <input className={INPUT} placeholder="Title (e.g. Event poster, Report template)" value={share.title} onChange={(e) => setShare({ ...share, title: e.target.value })} aria-label="Share title" maxLength={150} required />
                        <textarea className={`${INPUT} resize-none`} rows={2} placeholder="Note (optional)" value={share.description} onChange={(e) => setShare({ ...share, description: e.target.value })} aria-label="Share note" maxLength={2000} />
                        <label className="block border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-500 cursor-pointer hover:border-ieee-blue transition">
                            <input key={fileInputKey} type="file" className="sr-only" aria-label="File to share" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            {file ? <span className="text-gray-800 dark:text-gray-200 font-semibold">{file.name} · {formatBytes(file.size)}</span> : "Choose a file — PDF, image, photo, document… (up to 25 MB)"}
                        </label>
                        {!file && <input className={INPUT} type="url" placeholder="…or paste a link (Google Drive, YouTube, website)" value={share.url} onChange={(e) => setShare({ ...share, url: e.target.value })} aria-label="Link to share" />}
                        <select className={INPUT} value={share.audience} onChange={(e) => setShare({ ...share, audience: e.target.value })} aria-label="Share with">
                            {SHARE_AUDIENCES.map(a => <option key={a.value} value={a.value}>Share with: {a.label}</option>)}
                        </select>
                        {share.audience === "selected" && (
                            <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                                {people.map(u => (
                                    <label key={u.id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer">
                                        <input type="checkbox" checked={share.selected.includes(u.id)}
                                            onChange={() => setShare(s => ({ ...s, selected: s.selected.includes(u.id) ? s.selected.filter(x => x !== u.id) : [...s.selected, u.id] }))} />
                                        <span className="text-gray-800 dark:text-gray-200">{u.name}</span>
                                        <span className="ml-auto text-[10px] uppercase font-bold text-gray-400">{u.ambassadorType || "volunteer"}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <Button type="submit" isLoading={uploading} className="w-full"><Share2 className="w-4 h-4 mr-1.5" /> Share</Button>
                    </div>
                    {shares.length > 0 && (
                        <ul className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 max-h-56 overflow-y-auto">
                            {shares.map(f => (
                                <li key={f.id} className="flex items-center gap-2 text-sm">
                                    {f.url ? <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 shrink-0" />}
                                    <a href={f.url || `/api/shared-files/${encodeURIComponent(f.id)}/download`} target={f.url ? "_blank" : undefined} rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-gray-800 dark:text-gray-200 hover:text-ieee-blue">{f.title}</a>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{AUDIENCE_LABEL[f.audience]}{f.audience === "selected" ? ` (${f.userIds?.length || 0})` : ""}</span>
                                    <button type="button" onClick={() => removeShare(f)} className="p-1 text-gray-300 hover:text-red-500" aria-label={`Delete ${f.title}`}><Trash2 className="w-4 h-4" /></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </form>

                {/* Message participants */}
                <form onSubmit={send} className={CARD}>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-ieee-blue" /> Message registered participants</h3>
                    <div className="space-y-3">
                        <select className={INPUT} value={eventId} onChange={(e) => { setEventId(e.target.value); setProgress(null); if (e.target.value === NEWSLETTER) setChannel("email"); }} aria-label="Participants of">
                            <option value="">Everyone who registered for any event</option>
                            <option value={NEWSLETTER}>📰 Newsletter subscribers</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-500 tabular-nums">
                            {roster ? (isNewsletter
                                ? `${roster.counts.total} confirmed subscribers${roster.counts.pending ? ` · ${roster.counts.pending} waiting to confirm` : ""}${roster.counts.unsubscribed ? ` · ${roster.counts.unsubscribed} unsubscribed` : ""} · email only, with an unsubscribe link`
                                : `${roster.counts.total} people · ${roster.counts.withEmail} with email · ${roster.counts.withPhone} with mobile number`) : "Loading participants…"}
                        </p>
                        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Channel">
                            {CHANNELS.map(c => {
                                const ready = roster?.channels?.[c.value];
                                return (
                                    <button type="button" key={c.value} role="radio" aria-checked={channel === c.value} disabled={isNewsletter && c.value !== "email"} onClick={() => { setChannel(c.value); setProgress(null); }}
                                        className={`px-3 py-2 rounded-xl text-sm font-bold border flex items-center justify-center gap-1.5 transition disabled:opacity-40 ${channel === c.value ? "bg-ieee-blue text-white border-ieee-blue" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
                                        <c.icon className="w-4 h-4" /> {c.label}
                                        {!ready && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-label="not set up" />}
                                    </button>
                                );
                            })}
                        </div>
                        {roster && !channelReady && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {CHANNELS.find(c => c.value === channel).label} isn&apos;t set up yet — {CHANNELS.find(c => c.value === channel).setup} as Cloudflare secrets.
                            </p>
                        )}
                        {channel === "email" && (
                            <input className={INPUT} placeholder="Subject" value={msg.subject} onChange={(e) => setMsg({ ...msg, subject: e.target.value })} aria-label="Email subject" maxLength={200} required />
                        )}
                        <textarea className={`${INPUT} resize-none`} rows={5} value={msg.message} onChange={(e) => setMsg({ ...msg, message: e.target.value })} aria-label="Message"
                            placeholder={channel === "email" ? "Hi {{name}},\n\nReminder: the workshop starts at 10 AM tomorrow…" : "Reminder: the workshop starts at 10 AM tomorrow at the Main Hall."}
                            maxLength={channel === "email" ? 10000 : 1000} required />
                        <p className="text-[11px] text-gray-500">
                            {channel === "email" && <>Write <code>{"{{name}}"}</code> to insert each person&apos;s name. Free Brevo plan: 300 emails/day.</>}
                            {channel === "sms" && <>Same text to everyone · keep it under 160 characters for 1 SMS ({msg.message.length}/160). Fast2SMS charges per SMS.</>}
                            {channel === "whatsapp" && <>Sent with your approved template as &quot;Hi &lt;name&gt;, &lt;your message&gt;&quot;. Meta charges per message.</>}
                        </p>
                        {channel === "email" && msg.message && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 whitespace-pre-line max-h-28 overflow-y-auto"><b>Preview:</b> {preview}</div>
                        )}
                        {progress && (
                            <div aria-live="polite">
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-ieee-blue transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 100}%` }} />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 flex items-center gap-1">
                                    {!sending && progress.failed === 0 && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                    {progress.done}/{progress.total} processed · {progress.sent} sent{progress.failed ? ` · ${progress.failed} failed` : ""}
                                </p>
                                {progress.error && <p className="text-[11px] text-red-500 mt-1 break-words">{progress.error}</p>}
                            </div>
                        )}
                        <Button type="submit" isLoading={sending} disabled={!channelReady || reachable.length === 0 || sending} className="w-full">
                            <Send className="w-4 h-4 mr-1.5" /> Send {CHANNELS.find(c => c.value === channel).label} to {reachable.length} participant{reachable.length === 1 ? "" : "s"}
                        </Button>
                    </div>
                </form>
            </div>

            {history.length > 0 && (
                <div className={CARD}>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Recent messages</h3>
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {history.map(h => (
                            <li key={h.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                                <span className="font-bold uppercase text-[10px] text-ieee-blue w-20">{h.channel}</span>
                                <span className="flex-1 min-w-0 truncate text-gray-800 dark:text-gray-200">{h.subject || h.message}</span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{h.eventName} · {h.sent}/{h.total} sent{h.failed ? ` · ${h.failed} failed` : ""}</span>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{h.createdAt?.toDate?.().toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
