import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Megaphone, CheckCircle, LogIn, User, Mail, Phone, Building2, GraduationCap, Users, BookOpen } from "lucide-react";
import Button from "../components/Button";
import MetaTags from "../shared/MetaTags";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { db, doc, getDoc } from "../lib/firestore";
import { httpsCallable, functions } from "../lib/functions";
import ComboBox from "../components/ComboBox";
import { useDirectory } from "../hooks/useDirectory";

const FIELD = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none";
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

/**
 * Class Ambassador application. Campus ambassadors share
 * /ambassador/apply?ca=<their uid>; submissions reach them and the super admin.
 */
export default function ClassAmbassadorApplyPage() {
    const [params] = useSearchParams();
    const caId = params.get("ca");
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const addToast = useToast();

    const [settings, setSettings] = useState(undefined);
    const [ca, setCa] = useState(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", college: "", department: "", year: "1st Year", className: "", about: "" });

    useEffect(() => {
        getDoc(doc(db, "settings", "classAmbassadorForm"))
            .then(snap => setSettings(snap.exists() ? snap.data() : null))
            .catch(() => setSettings(null));
    }, []);

    // The campus ambassador's name (profiles are visible once signed in).
    useEffect(() => {
        if (!user || !caId) return;
        getDoc(doc(db, "users", caId))
            .then(snap => setCa(snap.exists() ? snap.data() : null))
            .catch(() => setCa(null));
    }, [user, caId]);

    useEffect(() => {
        if (!user) return;
        setForm(f => ({ ...f, name: f.name || user.name || user.displayName || "", email: f.email || user.email || "", college: f.college || user.college || "" }));
    }, [user]);

    const { colleges, departments } = useDirectory();
    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await httpsCallable(functions, "applyClassAmbassador")({ campusAmbassadorId: caId, form });
            setDone(true);
        } catch (err) {
            addToast(err.message || "Could not submit your application", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const shell = (body) => (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <MetaTags title={settings?.title || "Become a Class Ambassador"} description="Apply to be an IEEE SB CEK Class Ambassador." />
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-ieee-blue to-cyan-500 p-6 text-white">
                    <h1 className="text-2xl font-black flex items-center gap-2"><Megaphone className="w-6 h-6" /> {settings?.title || "Become a Class Ambassador"}</h1>
                    {settings?.description && <p className="text-white/85 text-sm mt-2 whitespace-pre-line">{settings.description}</p>}
                    {ca?.name && <p className="text-white/75 text-xs mt-3">Invited by Campus Ambassador <span className="font-bold text-white">{ca.name}</span></p>}
                </div>
                <div className="p-6">{body}</div>
            </div>
        </div>
    );

    if (settings === undefined) {
        return <div className="min-h-[50vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (!settings?.published) {
        return shell(<p className="text-sm text-gray-500 text-center py-6">Applications are not open right now. Please check back later.</p>);
    }
    if (!caId) {
        return shell(<p className="text-sm text-gray-500 text-center py-6">This link is incomplete — please use the link your Campus Ambassador shared.</p>);
    }
    if (done) {
        return shell(
            <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application submitted!</h2>
                <p className="text-sm text-gray-500">You&apos;ll get a notification when it&apos;s reviewed.</p>
                <Link to="/dashboard"><Button className="mt-2">Go to my dashboard</Button></Link>
            </div>
        );
    }
    if (!user) {
        return shell(
            <div className="text-center py-4 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Sign in or create a free account to apply. You&apos;ll come straight back here.</p>
                <Button onClick={() => navigate("/auth", { state: { from: location } })} className="w-full py-3"><LogIn className="w-4 h-4 mr-2" /> Sign in to Apply</Button>
            </div>
        );
    }
    if (user.ambassadorType) {
        return shell(<p className="text-sm text-gray-600 dark:text-gray-300 text-center py-6">You are already a <b>{user.ambassadorType}</b> ambassador. 🎉</p>);
    }

    const fields = [
        { key: "name", label: "Full Name", icon: User, type: "text", placeholder: "Your name" },
        { key: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
        { key: "phone", label: "Phone / WhatsApp", icon: Phone, type: "tel", placeholder: "+91 9876543210" },
        { key: "college", label: "College", icon: Building2, options: colleges, placeholder: "Search or type your college" },
        { key: "department", label: "Department / Branch", icon: BookOpen, options: departments, placeholder: "Search or type your department" },
        { key: "className", label: "Class / Division", icon: Users, type: "text", placeholder: "e.g. S5 CSE B" },
    ];

    return shell(
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(f => (
                    f.options ? (
                        <div key={f.key}>
                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"><f.icon className="w-3 h-3 inline mr-1" /> {f.label}</span>
                            <ComboBox label={f.label} options={f.options} value={form[f.key]} onChange={(v) => setForm(prev => ({ ...prev, [f.key]: v }))}
                                placeholder={f.placeholder} inputClassName={FIELD} required />
                        </div>
                    ) : (
                        <label key={f.key} className="block">
                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"><f.icon className="w-3 h-3 inline mr-1" /> {f.label}</span>
                            <input type={f.type} value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className={FIELD} required />
                        </label>
                    )
                ))}
                <label className="block">
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"><GraduationCap className="w-3 h-3 inline mr-1" /> Year</span>
                    <select value={form.year} onChange={set("year")} className={FIELD}>
                        {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                </label>
            </div>
            <label className="block">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Why do you want to be a Class Ambassador? (optional)</span>
                <textarea rows={3} value={form.about} onChange={set("about")} className={`${FIELD} resize-none`} maxLength={1000} />
            </label>
            <Button type="submit" isLoading={submitting} className="w-full py-3 text-base">Submit Application</Button>
        </form>
    );
}
