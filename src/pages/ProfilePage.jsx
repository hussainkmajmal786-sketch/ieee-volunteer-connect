import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Save, ExternalLink, X, Plus } from "lucide-react";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import MetaTags from "../shared/MetaTags";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { db, doc, updateDoc } from "../lib/firestore";
import { apiForm } from "../lib/api";
import { SOCIALS, safeUrl } from "../utils/links";
import ComboBox from "../components/ComboBox";
import { useDirectory } from "../hooks/useDirectory";

const INPUT = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none";
const YEARS = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Alumni", "Faculty"];

function fromUser(u) {
    const socials = {};
    for (const s of SOCIALS) socials[s.key] = u?.socials?.[s.key] || (typeof u?.[s.key] === "string" ? u[s.key] : "") || "";
    return {
        name: u?.name || "",
        headline: u?.headline || "",
        bio: u?.bio || "",
        college: u?.college || "",
        department: u?.department || "",
        year: u?.year || "",
        contactEmail: u?.contactEmail || u?.email || "",
        showEmail: !!u?.showEmail,
        skills: Array.isArray(u?.skills) ? u.skills : Array.isArray(u?.interests) ? u.interests : [],
        socials,
    };
}

/** Edit your own portfolio: photo, details, skills, contact and social links. */
export default function ProfilePage() {
    const { user } = useAuth();
    const addToast = useToast();
    const [form, setForm] = useState(() => fromUser(user));
    const [skill, setSkill] = useState("");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const loadedFor = useRef(user?.uid);
    const { colleges, departments } = useDirectory();

    // Fill the form once the profile arrives (or the account changes).
    useEffect(() => {
        if (user?.uid && loadedFor.current !== user.uid) {
            loadedFor.current = user.uid;
            setForm(fromUser(user));
        }
    }, [user]);

    if (!user) return null;
    const isTeam = user.role === "VOLUNTEER" || user.role === "ADMIN" || user.role === "SUPER_ADMIN" || !!user.ambassadorType;

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
    const setSocial = (k) => (e) => setForm({ ...form, socials: { ...form.socials, [k]: e.target.value } });
    const addSkill = () => {
        const s = skill.trim().slice(0, 40);
        if (!s || form.skills.includes(s) || form.skills.length >= 25) return setSkill("");
        setForm({ ...form, skills: [...form.skills, s] });
        setSkill("");
    };

    const uploadPhoto = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file, file.name);
            await apiForm("/api/me/avatar", fd);
            addToast("Profile photo updated", "success");
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setUploading(false);
        }
    };

    const save = async (e) => {
        e.preventDefault();
        const bad = SOCIALS.find(s => form.socials[s.key] && !safeUrl(form.socials[s.key]));
        if (bad) return addToast(`${bad.label} must be a full link starting with https://`, "error");
        setSaving(true);
        try {
            const socials = Object.fromEntries(SOCIALS.map(s => [s.key, form.socials[s.key].trim()]));
            await updateDoc(doc(db, "users", user.uid), {
                name: form.name.trim() || user.name,
                headline: form.headline.trim(),
                bio: form.bio.trim(),
                college: form.college.trim(),
                department: form.department.trim(),
                year: form.year,
                contactEmail: form.contactEmail.trim(),
                showEmail: form.showEmail,
                skills: form.skills,
                socials,
            });
            addToast("Profile saved", "success");
        } catch (err) {
            addToast(err.message || "Could not save your profile", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <MetaTags title="My Profile" description="Edit your IEEE Volunteer Connect profile." />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Profile</h1>
                {isTeam && (
                    <Link to={`/volunteers/${user.uid}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ieee-blue hover:underline">
                        View my public portfolio <ExternalLink className="w-4 h-4" />
                    </Link>
                )}
            </div>

            <form onSubmit={save} className="space-y-6">
                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                        <Avatar src={user.photoURL} name={user.name} size="xl" />
                        <label className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-ieee-blue text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-ieee-blue/90" title="Change photo">
                            <Camera className={`w-4 h-4 ${uploading ? "animate-pulse" : ""}`} />
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={uploadPhoto} aria-label="Upload profile photo" disabled={uploading} />
                        </label>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                        <input className={INPUT} value={form.name} onChange={set("name")} placeholder="Full name" aria-label="Full name" maxLength={100} required />
                        <input className={INPUT} value={form.headline} onChange={set("headline")} placeholder="Headline — e.g. ECE · S5 · Robotics enthusiast" aria-label="Headline" maxLength={120} />
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
                    <h2 className="font-bold text-gray-900 dark:text-white">About</h2>
                    <textarea className={`${INPUT} resize-none`} rows={4} value={form.bio} onChange={set("bio")} placeholder="A few lines about you, what you do and what you're looking for" aria-label="Bio" maxLength={1000} />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ComboBox inputClassName={INPUT} options={colleges} value={form.college} onChange={(college) => setForm(f => ({ ...f, college }))} placeholder="College" label="College" maxLength={200} />
                        <ComboBox inputClassName={INPUT} options={departments} value={form.department} onChange={(department) => setForm(f => ({ ...f, department }))} placeholder="Department / Branch" label="Department" maxLength={120} />
                        <select className={INPUT} value={form.year} onChange={set("year")} aria-label="Year">
                            {YEARS.map(y => <option key={y} value={y}>{y || "Year…"}</option>)}
                        </select>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
                    <h2 className="font-bold text-gray-900 dark:text-white">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {form.skills.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-ieee-blue/10 text-ieee-blue dark:text-cyan-400 text-xs font-semibold">
                                {s}
                                <button type="button" onClick={() => setForm({ ...form, skills: form.skills.filter(x => x !== s) })} className="p-0.5 rounded-full hover:bg-ieee-blue/20" aria-label={`Remove ${s}`}><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                        {form.skills.length === 0 && <span className="text-xs text-gray-400">No skills added yet.</span>}
                    </div>
                    <div className="flex gap-2">
                        <input className={INPUT} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add a skill — e.g. Python, Event management, Canva"
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }} aria-label="New skill" maxLength={40} />
                        <Button type="button" variant="outline" onClick={addSkill} aria-label="Add skill"><Plus className="w-4 h-4" /></Button>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
                    <h2 className="font-bold text-gray-900 dark:text-white">Contact & social links</h2>
                    <input className={INPUT} type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="Contact email" aria-label="Contact email" maxLength={200} />
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input type="checkbox" checked={form.showEmail} onChange={set("showEmail")} /> Show my email on my public portfolio
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {SOCIALS.map(s => (
                            <label key={s.key} className="block">
                                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</span>
                                <input className={INPUT} type="url" value={form.socials[s.key]} onChange={setSocial(s.key)} placeholder={s.placeholder} />
                            </label>
                        ))}
                    </div>
                </section>

                <Button type="submit" isLoading={saving} className="w-full py-3"><Save className="w-4 h-4 mr-2" /> Save profile</Button>
            </form>
        </div>
    );
}
