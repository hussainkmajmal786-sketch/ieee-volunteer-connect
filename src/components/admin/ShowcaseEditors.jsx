// Editors for content that carries media: projects, volunteer spotlights and
// the home page "Who are we" section.
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { db, doc, collection, addDoc, updateDoc, setDoc, getDoc, serverTimestamp } from "../../lib/firestore";
import { apiGet } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { safeUrl, youtubeId } from "../../utils/links";
import MediaInput from "./MediaInput";

const INPUT = "w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none";
// The label wraps its control so screen readers announce it.
const Field = ({ label, children }) => <label className="mb-4 block"><span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</span>{children}</label>;
const Group = ({ label, children }) => <div className="mb-4" role="group" aria-label={label}><span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</span>{children}</div>;
const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map(s => String(s).trim()).filter(Boolean);
const Buttons = ({ saving, onClose, label }) => (
    <div className="flex gap-3 mt-5">
        <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 flex-1">{saving ? "Saving…" : label}</button>
        <button type="button" onClick={onClose} className="btn-secondary text-sm !py-2.5 flex-1">Cancel</button>
    </div>
);

function LinksEditor({ value, onChange }) {
    const links = value || [];
    const set = (i, k, v) => onChange(links.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
    return (
        <Group label="Links (demo, GitHub, slides, video…)">
            <div className="space-y-2">
                {links.map((l, i) => (
                    <div key={i} className="flex gap-2">
                        <input className={INPUT} value={l.label} onChange={e => set(i, "label", e.target.value)} placeholder="Label" aria-label="Link label" />
                        <input className={INPUT} type="url" value={l.url} onChange={e => set(i, "url", e.target.value)} placeholder="https://…" aria-label="Link URL" />
                        <button type="button" onClick={() => onChange(links.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-500" aria-label="Remove link"><X className="w-4 h-4" /></button>
                    </div>
                ))}
                <button type="button" onClick={() => onChange([...links, { label: "", url: "" }])} className="text-xs font-semibold text-ieee-blue flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add link</button>
            </div>
        </Group>
    );
}

export function ProjectForm({ item, onClose }) {
    const addToast = useToast();
    const [f, setF] = useState(() => ({
        title: item?.title || "", desc: item?.desc || "", category: item?.category || "Web", status: item?.status || "Active",
        team: list(item?.team).join(", "), tech: list(item?.tech).join(", "),
        coverUrl: item?.coverUrl || "", images: (item?.images || []).map(u => (typeof u === "string" ? { url: u, name: u.split("/").pop() } : u)),
        docs: item?.docs || [],
        links: item?.links || [
            ...(safeUrl(item?.demo) ? [{ label: "Demo", url: item.demo }] : []),
            ...(safeUrl(item?.github) ? [{ label: "GitHub", url: item.github }] : []),
        ],
    }));
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const links = f.links.filter(l => l.url.trim());
        const bad = links.find(l => !safeUrl(l.url));
        if (bad) return addToast(`"${bad.label || bad.url}" must be a full https:// link`, "error");
        setSaving(true);
        const data = {
            title: f.title.trim(), desc: f.desc.trim(), category: f.category, status: f.status,
            team: list(f.team), tech: list(f.tech), coverUrl: f.coverUrl,
            images: f.images.map(i => i.url), docs: f.docs, links: links.map(l => ({ label: l.label.trim() || "Link", url: l.url.trim() })),
            github: links.find(l => /github\.com/i.test(l.url))?.url || "", demo: links.find(l => !/github\.com/i.test(l.url))?.url || "",
        };
        try {
            if (item?.id) await updateDoc(doc(db, "projects", item.id), data);
            else await addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
            addToast(item?.id ? "Project updated" : "Project added", "success");
            onClose();
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <Field label="Title *"><input className={INPUT} value={f.title} onChange={set("title")} required maxLength={200} /></Field>
            <Field label="Description"><textarea className={`${INPUT} resize-none`} rows={4} value={f.desc} onChange={set("desc")} /></Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Category"><select className={INPUT} value={f.category} onChange={set("category")}>{["AI", "IoT", "Web", "Robotics", "Sustainability", "Other"].map(c => <option key={c}>{c}</option>)}</select></Field>
                <Field label="Status"><select className={INPUT} value={f.status} onChange={set("status")}>{["Active", "In Progress", "Completed"].map(c => <option key={c}>{c}</option>)}</select></Field>
            </div>
            <Field label="Team (comma-separated)"><input className={INPUT} value={f.team} onChange={set("team")} /></Field>
            <Field label="Tech stack (comma-separated)"><input className={INPUT} value={f.tech} onChange={set("tech")} /></Field>
            <MediaInput label="Cover photo" folder="projects" accept="image/jpeg,image/png,image/webp,image/gif" value={f.coverUrl} onChange={v => setF(p => ({ ...p, coverUrl: v }))} hint="Shown on the project card. Up to 5 MB." />
            <MediaInput label="Photo gallery" folder="projects" accept="image/jpeg,image/png,image/webp,image/gif" multiple value={f.images} onChange={v => setF(p => ({ ...p, images: v }))} />
            <MediaInput label="Documents (PDF)" folder="project-docs" accept="application/pdf" multiple value={f.docs} onChange={v => setF(p => ({ ...p, docs: v }))} hint="Reports, posters, slides — up to 15 MB each." />
            <LinksEditor value={f.links} onChange={v => setF(p => ({ ...p, links: v }))} />
            <Buttons saving={saving} onClose={onClose} label={item?.id ? "Save changes" : "Add project"} />
        </form>
    );
}

export function SpotlightForm({ item, onClose }) {
    const addToast = useToast();
    const [people, setPeople] = useState([]);
    const [f, setF] = useState(() => ({
        name: item?.name || "", role: item?.role || "", bio: item?.bio || "", achievements: item?.achievements || "",
        badges: list(item?.badges).join(", "), hours: item?.hours ?? "", rank: item?.rank ?? "",
        photoURL: item?.photoURL || "", userId: item?.userId || "", linkedin: item?.linkedin || "", github: item?.github || "",
        email: item?.email || "", college: item?.college || "", branch: item?.branch || "", year: item?.year || "",
        gradient: item?.gradient || "from-ieee-blue to-cyan-400",
    }));
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    useEffect(() => { apiGet("/api/public/people").then(r => setPeople(r.people)).catch(() => {}); }, []);

    const fromVolunteer = (id) => {
        const p = people.find(x => x.id === id);
        if (!p) return setF({ ...f, userId: "" });
        setF({
            ...f, userId: p.id, name: p.name, photoURL: p.photoURL || f.photoURL, bio: p.bio || f.bio,
            college: p.college, branch: p.department, year: p.year,
            linkedin: p.socials.linkedin || "", github: p.socials.github || "", email: p.email || f.email,
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = {
            name: f.name.trim(), role: f.role.trim(), bio: f.bio.trim(), achievements: f.achievements.trim(),
            badges: list(f.badges), hours: parseInt(f.hours, 10) || 0, rank: parseInt(f.rank, 10) || 99,
            avatar: f.name.trim().charAt(0).toUpperCase(), photoURL: f.photoURL, userId: f.userId,
            linkedin: safeUrl(f.linkedin) || "", github: safeUrl(f.github) || "", email: f.email.trim(),
            college: f.college, branch: f.branch, year: f.year, gradient: f.gradient,
        };
        try {
            if (item?.id) await updateDoc(doc(db, "spotlights", item.id), data);
            else await addDoc(collection(db, "spotlights"), { ...data, createdAt: serverTimestamp() });
            addToast(item?.id ? "Spotlight updated" : "Spotlight added", "success");
            onClose();
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <Field label="Fill from a volunteer's profile (optional)">
                <select className={INPUT} value={f.userId} onChange={e => fromVolunteer(e.target.value)}>
                    <option value="">— Choose a volunteer —</option>
                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </Field>
            <MediaInput label="Photo" folder="spotlights" accept="image/jpeg,image/png,image/webp,image/gif" value={f.photoURL} onChange={v => setF(p => ({ ...p, photoURL: v }))} hint="Shown on the home page. Square photos look best." />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Name *"><input className={INPUT} value={f.name} onChange={set("name")} required /></Field>
                <Field label="Role *"><input className={INPUT} value={f.role} onChange={set("role")} placeholder="e.g. Campus Ambassador" required /></Field>
            </div>
            <Field label="Bio *"><textarea className={`${INPUT} resize-none`} rows={3} value={f.bio} onChange={set("bio")} required /></Field>
            <Field label="Achievements"><input className={INPUT} value={f.achievements} onChange={set("achievements")} /></Field>
            <div className="grid grid-cols-3 gap-3">
                <Field label="Hours"><input className={INPUT} type="number" min="0" value={f.hours} onChange={set("hours")} /></Field>
                <Field label="Order (1 = first)"><input className={INPUT} type="number" min="1" value={f.rank} onChange={set("rank")} /></Field>
                <Field label="Badges"><input className={INPUT} value={f.badges} onChange={set("badges")} placeholder="comma-separated" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="LinkedIn"><input className={INPUT} type="url" value={f.linkedin} onChange={set("linkedin")} /></Field>
                <Field label="GitHub"><input className={INPUT} type="url" value={f.github} onChange={set("github")} /></Field>
            </div>
            <Buttons saving={saving} onClose={onClose} label={item?.id ? "Save changes" : "Add spotlight"} />
        </form>
    );
}

/** Home page "Who are we": text on the left, video (upload or YouTube) on the right. */
export function AboutForm() {
    const addToast = useToast();
    const [f, setF] = useState({ title: "Who are we", description: "", videoType: "youtube", youtubeUrl: "", videoUrl: "", published: true });
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

    useEffect(() => {
        getDoc(doc(db, "settings", "about")).then(s => { if (s.exists()) setF(p => ({ ...p, ...s.data() })); }).finally(() => setLoaded(true));
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (f.videoType === "youtube" && f.youtubeUrl && !youtubeId(f.youtubeUrl)) return addToast("That doesn't look like a YouTube video link", "error");
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "about"), {
                title: f.title.trim() || "Who are we", description: f.description.trim(), videoType: f.videoType,
                youtubeUrl: f.youtubeUrl.trim(), videoUrl: f.videoUrl, published: f.published, updatedAt: serverTimestamp(),
            });
            addToast("Home page section saved", "success");
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (!loaded) return <p className="text-sm text-gray-400 p-4">Loading…</p>;
    return (
        <form onSubmit={submit} className="p-1 max-w-2xl">
            <Field label="Title"><input className={INPUT} value={f.title} onChange={set("title")} maxLength={100} /></Field>
            <Field label="Description (left side)"><textarea className={`${INPUT} resize-none`} rows={6} value={f.description} onChange={set("description")} placeholder="Who we are, what we do, why join…" maxLength={3000} /></Field>
            <Group label="Video (right side)">
                <div className="flex gap-2 mb-2" role="radiogroup" aria-label="Video source">
                    {[["youtube", "YouTube link"], ["upload", "Upload a video"]].map(([v, l]) => (
                        <button type="button" key={v} role="radio" aria-checked={f.videoType === v} onClick={() => setF({ ...f, videoType: v })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${f.videoType === v ? "bg-ieee-blue text-white border-ieee-blue" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>{l}</button>
                    ))}
                </div>
                {f.videoType === "youtube" ? (
                    <input className={INPUT} type="url" value={f.youtubeUrl} onChange={set("youtubeUrl")} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube link" />
                ) : (
                    <MediaInput label="Video file (MP4/WebM, up to 25 MB)" folder="about" accept="video/mp4,video/webm" value={f.videoUrl} onChange={v => setF(p => ({ ...p, videoUrl: v }))} />
                )}
            </Group>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-4"><input type="checkbox" checked={f.published} onChange={set("published")} /> Show this section on the home page</label>
            <button type="submit" disabled={saving} className="btn-primary text-sm !py-2.5 w-full">{saving ? "Saving…" : "Save section"}</button>
        </form>
    );
}
