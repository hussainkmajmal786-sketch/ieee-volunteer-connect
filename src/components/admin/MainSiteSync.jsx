import { useEffect, useState } from "react";
import { Link2, Copy, Check, RefreshCw, Upload, Loader2, CircleCheck, CircleDashed, FileSpreadsheet, Code2, ClipboardList } from "lucide-react";
import { api, apiGet } from "../../lib/api";
import { csvToObjects } from "../../utils/csv";
import { useToast } from "../../hooks/useToast";

const BATCH = 50;

function appsScript(url, key) {
    return `// IEEE Volunteer Connect: sends every response of this form to the
// ambassador tracker, so registrations count for the right ambassador.
const HOOK_URL = '${url}';
const HOOK_KEY = '${key}';

function toRow(response) {
  const answers = {};
  response.getItemResponses().forEach(function (r) {
    answers[r.getItem().getTitle()] = r.getResponse();
  });
  const email = response.getRespondentEmail();
  if (email) answers['Email address'] = email;
  return { answers: answers, submittedAt: response.getTimestamp().toISOString() };
}

function send(rows) {
  UrlFetchApp.fetch(HOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Webhook-Key': HOOK_KEY },
    payload: JSON.stringify({ rows: rows }),
  });
}

// Runs on every new response (add the trigger: see step 4).
function sendToTracker(e) {
  send([toRow(e.response)]);
}

// Run once to send the responses collected before this script existed.
function sendAllResponses() {
  const all = FormApp.getActiveForm().getResponses().map(toRow);
  for (let i = 0; i < all.length; i += ${BATCH}) send(all.slice(i, i + ${BATCH}));
}
`;
}

function CopyBox({ value, label, multiline = false }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard blocked: the text is selectable */ }
    };
    return (
        <div className="relative">
            {multiline ? (
                <pre className="text-[11px] leading-relaxed bg-gray-900 text-gray-100 rounded-xl p-3 pr-12 overflow-x-auto max-h-72">{value}</pre>
            ) : (
                <code className="block text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 pr-12 break-all">{value}</code>
            )}
            <button type="button" onClick={copy} aria-label={`Copy ${label}`}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white/90 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:text-ieee-blue shadow-sm">
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

/**
 * Super admin: connect the main website's registration form so its
 * registrations (and who referred them) show up in the Ambassador Monitor.
 */
export default function MainSiteSync({ event, onImported }) {
    const addToast = useToast();
    const [hook, setHook] = useState({ eventId: null, data: null, error: null });
    const [refParam, setRefParam] = useState("");
    const [tab, setTab] = useState("google");
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(null);
    const eventId = event?.id;

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;
        apiGet(`/api/admin/events/${encodeURIComponent(eventId)}/hook`)
            .then(data => { if (!cancelled) { setHook({ eventId, data, error: null }); setRefParam(data.refParam); } })
            .catch(err => !cancelled && setHook({ eventId, data: null, error: err.message }));
        return () => { cancelled = true; };
    }, [eventId]);

    const save = async (body) => {
        setSaving(true);
        try {
            const data = await api(`/api/admin/events/${encodeURIComponent(eventId)}/hook`, body);
            setHook({ eventId, data, error: null });
            setRefParam(data.refParam);
            addToast(body.rotate ? "New key created. Update it in your form script." : "Saved", "success");
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const importCsv = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const rows = csvToObjects(await file.text());
        if (rows.length === 0) return addToast("No rows found in that CSV", "error");
        const total = { created: 0, updated: 0, skipped: 0 };
        setImporting({ done: 0, total: rows.length });
        try {
            for (let i = 0; i < rows.length; i += BATCH) {
                const r = await api(`/api/admin/events/${encodeURIComponent(eventId)}/import`, { rows: rows.slice(i, i + BATCH) });
                for (const k of Object.keys(total)) total[k] += r[k] || 0;
                setImporting({ done: Math.min(i + BATCH, rows.length), total: rows.length });
            }
            addToast(`Imported: ${total.created} new, ${total.updated} updated, ${total.skipped} unchanged`, "success");
            onImported?.();
        } catch (err) {
            addToast(`Import stopped: ${err.message}`, "error");
        } finally {
            setImporting(null);
        }
    };

    if (hook.eventId !== eventId) return <p className="text-xs text-gray-400 py-2">Loading main website settings…</p>;
    if (hook.error) return <p className="text-xs text-red-500 py-2">{hook.error}</p>;
    const h = hook.data;
    const exampleLink = `${window.location.origin}/r/${eventId}/AMBASSADOR_ID`;

    const tabs = [
        { id: "google", label: "Google Form", icon: ClipboardList },
        { id: "website", label: "Own website", icon: Code2 },
        { id: "csv", label: "Import CSV", icon: FileSpreadsheet },
    ];

    return (
        <div className="rounded-2xl border border-ieee-blue/20 bg-white dark:bg-gray-900 p-4 md:p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-ieee-blue" /> Main website registrations</h3>
                {h.lastReceivedAt ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400"><CircleCheck className="w-4 h-4" /> Connected: {h.received} received, last {new Date(h.lastReceivedAt).toLocaleString()}</span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400"><CircleDashed className="w-4 h-4" /> Waiting for the first registration</span>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Ambassador links send people to the main website with the ambassador’s code added (<code>?ref=…</code>).
                Connect the registration form below and every registration, with all form answers, is counted for the right ambassador.
            </p>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 w-fit" role="tablist">
                {tabs.map(t => (
                    <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${tab === t.id ? "bg-white dark:bg-gray-700 text-ieee-blue shadow-sm" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === "google" && (
                <ol className="space-y-4 text-sm text-gray-700 dark:text-gray-300 list-decimal pl-5">
                    <li>
                        In the Google Form add a <b>Short answer</b> question titled <b>Referral code</b> (not required).
                    </li>
                    <li>
                        Form <b>⋮ → Get pre-filled link</b>, type <code>x</code> in Referral code, click <b>Get link</b> and copy it.
                        In the link find the part like <code>entry.123456789=x</code> and paste <code>entry.123456789</code> here:
                        <div className="flex gap-2 mt-2 max-w-md">
                            <input value={refParam} onChange={e => setRefParam(e.target.value)} placeholder="entry.123456789" aria-label="Referral field"
                                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none" />
                            <button type="button" disabled={saving || refParam === h.refParam} onClick={() => save({ refParam })}
                                className="px-4 py-2 bg-ieee-blue text-white rounded-xl text-sm font-bold disabled:opacity-50">Save</button>
                        </div>
                        <span className="block text-[11px] text-gray-400 mt-1">Ambassador links then fill the code in automatically. The event’s main website link must be the form’s <code>…/viewform</code> link.</span>
                    </li>
                    <li>
                        Form <b>⋮ → Apps Script</b>, replace everything with this code and save:
                        <div className="mt-2"><CopyBox label="Apps Script code" value={appsScript(h.url, h.secret)} multiline /></div>
                    </li>
                    <li>
                        In Apps Script open <b>Triggers (⏰) → Add trigger</b>: function <code>sendToTracker</code>, event source <b>From form</b>, event type <b>On form submit</b> → Save and allow access.
                    </li>
                    <li>
                        Already have responses? Choose <code>sendAllResponses</code> at the top and click <b>Run</b> once.
                    </li>
                </ol>
            )}

            {tab === "website" && (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                        Read the <code>ref</code> value from the registration page URL (for example {exampleLink} → <code>…?ref=AMBASSADOR_ID</code>), keep it with the form, and after each registration send a POST from your server:
                    </p>
                    <div><span className="text-xs font-semibold text-gray-500">URL</span><CopyBox label="webhook URL" value={h.url} /></div>
                    <div><span className="text-xs font-semibold text-gray-500">Header X-Webhook-Key</span><CopyBox label="webhook key" value={h.secret} /></div>
                    <CopyBox label="example body" multiline value={JSON.stringify({ ref: "AMBASSADOR_ID", answers: { Name: "Asha", Email: "asha@example.com", Phone: "9876543210", College: "CE Kidangoor", Year: "2nd year", "T-shirt size": "M" } }, null, 2)} />
                    <p className="text-[11px] text-gray-400">Any form fields can go in <code>answers</code>; name, email, phone, college and year are recognised from the question titles. Send up to {BATCH} at once as <code>{"{ rows: [...] }"}</code>. Keep the key secret — don’t put it in browser code.</p>
                </div>
            )}

            {tab === "csv" && (
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <p>Download the responses as CSV from the main website (Google Forms: <b>Responses → Link to Sheets → File → Download → CSV</b>) and import them here. Importing again only adds new people and updates changed answers.</p>
                    <p className="text-[11px] text-gray-400">To credit ambassadors, the CSV needs a column like <b>Referral code</b> or <b>Ambassador</b> holding the ambassador’s code, account email or exact name.</p>
                    <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer ${importing ? "bg-gray-200 dark:bg-gray-700 text-gray-500" : "bg-ieee-blue text-white hover:bg-ieee-blue/90"}`}>
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {importing ? `Importing ${importing.done}/${importing.total}…` : "Choose CSV file"}
                        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={importCsv} disabled={!!importing} aria-label="Import registrations CSV" />
                    </label>
                </div>
            )}

            {tab !== "csv" && (
                <button type="button" onClick={() => window.confirm("Create a new key? The current script/website will stop working until you update the key there.") && save({ rotate: true })}
                    disabled={saving} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600">
                    <RefreshCw className="w-3.5 h-3.5" /> Create a new key
                </button>
            )}
        </div>
    );
}
