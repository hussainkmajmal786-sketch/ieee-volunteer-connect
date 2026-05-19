import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, X, Sparkles, FolderOpen, BookOpen, Cpu, MessageSquare, Building, Newspaper, CheckCircle, XCircle, Clock, FileText, Send, Link2, ExternalLink } from "lucide-react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { adminService } from "../../services/adminService";
import { useToast } from "../../hooks/useToast";

const TABS = [
    { key: "opportunities", label: "Opportunities", icon: Sparkles },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "resources", label: "Resources", icon: BookOpen },
    { key: "chapters", label: "Chapters", icon: Cpu },
    { key: "testimonials", label: "Testimonials", icon: MessageSquare },
    { key: "sponsors", label: "Sponsors", icon: Building },
    { key: "news", label: "News", icon: Newspaper },
    { key: "applications", label: "Applications", icon: FileText },
];

// ── Generic modal wrapper ──
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-5">{children}</div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function FormField({ label, children }) {
    return <div className="mb-4"><label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</label>{children}</div>;
}

const inputCls = "w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none";

export default function ContentManager() {
    const [tab, setTab] = useState("opportunities");
    const [data, setData] = useState({});
    const [modal, setModal] = useState(null); // null | 'add' | 'sendForm'
    const [sendFormApp, setSendFormApp] = useState(null);
    const [formUrl, setFormUrl] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [userEmails, setUserEmails] = useState({});
    const addToast = useToast();

    // Subscribe to all collections
    useEffect(() => {
        const unsubs = TABS.filter(t => t.key !== "applications").map(t => {
            return onSnapshot(query(collection(db, t.key), orderBy("createdAt", "desc")), snap => {
                setData(prev => ({ ...prev, [t.key]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
            });
        });
        // Applications
        unsubs.push(onSnapshot(query(collection(db, "applications"), orderBy("createdAt", "desc")), snap => {
            const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setData(prev => ({ ...prev, applications: apps }));
            // Fetch user emails for each application
            apps.forEach(async (app) => {
                if (app.userId && !userEmails[app.userId]) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", app.userId));
                        if (userDoc.exists()) {
                            setUserEmails(prev => ({ ...prev, [app.userId]: { email: userDoc.data().email, name: userDoc.data().name } }));
                        }
                    } catch { /* silent */ }
                }
            });
        }));
        return () => unsubs.forEach(u => u());
    }, []);

    const items = data[tab] || [];

    // ── DELETE HANDLER ──
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this item permanently?")) return;
        try {
            const methods = { opportunities: "deleteOpportunity", projects: "deleteProject", resources: "deleteResource", chapters: "deleteChapter", testimonials: "deleteTestimonial", sponsors: "deleteSponsor", news: "deleteNews", applications: "deleteApplication" };
            await adminService[methods[tab]](id);
            addToast("Deleted!", "info");
        } catch (err) { addToast("Delete failed: " + err.message, "error"); }
    };

    // ── ADD HANDLERS ──
    const handleAddOpportunity = async (form) => {
        await adminService.createOpportunity({ title: form.title, organizer: form.organizer, mode: form.mode, duration: form.duration, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean), category: form.category, urgent: form.urgent === "true", status: "Active" });
    };
    const handleAddProject = async (form) => {
        await adminService.createProject({ title: form.title, desc: form.desc, team: form.team.split(",").map(s => s.trim()).filter(Boolean), tech: form.tech.split(",").map(s => s.trim()).filter(Boolean), category: form.category, status: form.status, github: form.github, demo: form.demo });
    };
    const handleAddResource = async (form) => {
        await adminService.createResource({ title: form.title, category: form.category, type: form.type, size: form.size, downloadUrl: form.downloadUrl || "" });
    };
    const handleAddChapter = async (form) => {
        await adminService.createChapter({ name: form.name, full: form.full, desc: form.desc, color: form.color, activities: form.activities.split(",").map(s => s.trim()).filter(Boolean), members: parseInt(form.members) || 0, projects: parseInt(form.projects) || 0 });
    };
    const handleAddTestimonial = async (form) => {
        await adminService.createTestimonial({ name: form.name, role: form.role, college: form.college, text: form.text, avatar: form.name?.charAt(0)?.toUpperCase() || "?" });
    };
    const handleAddSponsor = async (form) => {
        await adminService.createSponsor({ name: form.name, logo: form.logo || form.name });
    };
    const handleAddNews = async (form) => {
        await adminService.createNews({ title: form.title, desc: form.desc, tag: form.tag, time: "Just now" });
    };

    const handleAdd = async (form) => {
        try {
            const handlers = { opportunities: handleAddOpportunity, projects: handleAddProject, resources: handleAddResource, chapters: handleAddChapter, testimonials: handleAddTestimonial, sponsors: handleAddSponsor, news: handleAddNews };
            await handlers[tab](form);
            addToast("Created successfully!", "success");
            setModal(null);
        } catch (err) { addToast("Failed: " + err.message, "error"); }
    };

    const handleApproveApp = async (id) => {
        try { await adminService.approveApplication(id); addToast("Application approved!", "success"); }
        catch (err) { addToast("Failed: " + err.message, "error"); }
    };
    const handleRejectApp = async (id) => {
        try { await adminService.rejectApplication(id); addToast("Application rejected", "info"); }
        catch (err) { addToast("Failed: " + err.message, "error"); }
    };

    // ── SEND FORM LINK ──
    const handleOpenSendForm = (app) => {
        setSendFormApp(app);
        setFormUrl("");
        setFormMessage(`Hi! Your application for "${app.targetName}" has been approved. Please fill out the following form to complete your onboarding:`);
        setModal("sendForm");
    };

    const handleSendFormLink = async () => {
        if (!formUrl.trim()) { addToast("Please enter a Google Forms URL", "warning"); return; }
        try {
            await updateDoc(doc(db, "applications", sendFormApp.id), {
                formUrl: formUrl.trim(),
                formMessage: formMessage.trim(),
                formSentAt: serverTimestamp(),
            });
            addToast("Form link sent to volunteer!", "success");
            setModal(null);
            setSendFormApp(null);
        } catch (err) { addToast("Failed: " + err.message, "error"); }
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Content Manager
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-lg ml-2">Super Admin</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Add, edit, and delete all platform content.</p>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 px-4">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const count = (data[t.key] || []).length;
                    const pendingCount = t.key === "applications" ? (data.applications || []).filter(a => a.status === "PENDING").length : 0;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? "border-ieee-blue text-ieee-blue dark:text-cyan-400 dark:border-cyan-400" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                            <Icon className="w-4 h-4" /> {t.label}
                            {t.key === "applications" && pendingCount > 0 ? (
                                <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-md font-bold animate-pulse">{pendingCount}</span>
                            ) : count > 0 ? (
                                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md font-bold">{count}</span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="p-6">
                {tab !== "applications" && (
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setModal("add")} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" /> Add {TABS.find(t => t.key === tab)?.label?.slice(0, -1) || "Item"}
                        </button>
                    </div>
                )}

                {/* Items List */}
                {items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">No {tab} added yet.</p>
                    </div>
                ) : tab === "applications" ? (
                    <div className="space-y-3">
                        {items.map(app => {
                            const userInfo = userEmails[app.userId];
                            return (
                                <div key={app.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {app.targetType === "chapter" ? "🏛️ Society: " : "✨ Opportunity: "}{app.targetName}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                {userInfo ? (
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{userInfo.name}</span> — {userInfo.email}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">User: {app.userId?.slice(0, 16)}...</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${app.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : app.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                    {app.status === "PENDING" ? <Clock className="w-3 h-3" /> : app.status === "APPROVED" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {app.status}
                                                </span>
                                                {app.formUrl && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Link2 className="w-3 h-3" /> Form Sent
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0">
                                            {app.status === "PENDING" && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleApproveApp(app.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">Approve</button>
                                                    <button onClick={() => handleRejectApp(app.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">Reject</button>
                                                </div>
                                            )}
                                            {app.status === "APPROVED" && (
                                                <button onClick={() => handleOpenSendForm(app)} className="flex items-center gap-1.5 px-3 py-1.5 bg-ieee-blue text-white rounded-lg text-xs font-bold hover:bg-ieee-blue/90 transition-colors">
                                                    <Send className="w-3 h-3" /> {app.formUrl ? "Update Form" : "Send Form"}
                                                </button>
                                            )}
                                            {app.formUrl && (
                                                <a href={app.formUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                                    <ExternalLink className="w-3 h-3" /> View Form
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-ieee-blue/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title || item.name || item.text?.slice(0, 50)}</p>
                                    <p className="text-xs text-gray-400 truncate">{item.category || item.full || item.role || item.tag || item.logo || ""}</p>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0 ml-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal open={modal === "add"} onClose={() => setModal(null)} title={`Add ${TABS.find(t => t.key === tab)?.label?.slice(0, -1) || "Item"}`}>
                <AddForm type={tab} onSubmit={handleAdd} onClose={() => setModal(null)} />
            </Modal>

            {/* Send Form Modal */}
            <Modal open={modal === "sendForm"} onClose={() => { setModal(null); setSendFormApp(null); }} title="Send Google Form to Volunteer">
                {sendFormApp && (
                    <div>
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">{sendFormApp.targetType === "chapter" ? "🏛️ Society" : "✨ Opportunity"}: {sendFormApp.targetName}</p>
                            {userEmails[sendFormApp.userId] && (
                                <p className="text-xs text-green-600 dark:text-green-500 mt-1">To: {userEmails[sendFormApp.userId].name} ({userEmails[sendFormApp.userId].email})</p>
                            )}
                        </div>
                        <FormField label="Google Forms URL *">
                            <input value={formUrl} onChange={e => setFormUrl(e.target.value)} className={inputCls} placeholder="https://forms.gle/..." required />
                        </FormField>
                        <FormField label="Message to Volunteer">
                            <textarea value={formMessage} onChange={e => setFormMessage(e.target.value)} className={inputCls + " resize-none"} rows={3} />
                        </FormField>
                        <p className="text-xs text-gray-400 mb-4">The volunteer will see this form link when they check their application status.</p>
                        <div className="flex gap-3">
                            <button onClick={handleSendFormLink} className="btn-primary text-sm !py-2.5 flex-1 flex items-center justify-center gap-2">
                                <Send className="w-4 h-4" /> Send Form Link
                            </button>
                            <button onClick={() => { setModal(null); setSendFormApp(null); }} className="btn-secondary text-sm !py-2.5 flex-1">Cancel</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

// ── Dynamic Add Form ──
function AddForm({ type, onSubmit, onClose }) {
    const [form, setForm] = useState({});
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(form);
        setLoading(false);
    };

    const fields = {
        opportunities: [
            { key: "title", label: "Title", required: true },
            { key: "organizer", label: "Organizer", required: true },
            { key: "mode", label: "Mode", type: "select", options: ["Online", "Offline"] },
            { key: "duration", label: "Duration" },
            { key: "skills", label: "Skills (comma-separated)" },
            { key: "category", label: "Category", type: "select", options: ["Technical", "Design", "Content", "Web Development", "Event Management", "Robotics"] },
            { key: "urgent", label: "Urgent?", type: "select", options: ["false", "true"] },
        ],
        projects: [
            { key: "title", label: "Title", required: true },
            { key: "desc", label: "Description" },
            { key: "team", label: "Team Members (comma-separated)" },
            { key: "tech", label: "Tech Stack (comma-separated)" },
            { key: "category", label: "Category", type: "select", options: ["AI", "IoT", "Web", "Robotics", "Sustainability"] },
            { key: "status", label: "Status", type: "select", options: ["Active", "In Progress", "Completed"] },
            { key: "github", label: "GitHub URL" },
            { key: "demo", label: "Demo URL" },
        ],
        resources: [
            { key: "title", label: "Title", required: true },
            { key: "category", label: "Category", type: "select", options: ["Event Templates", "Presentation Kits", "Design Assets", "IEEE Branding Guide", "Workshop Kits", "Certificate Templates"] },
            { key: "type", label: "File Type (e.g. PDF, DOCX)" },
            { key: "size", label: "File Size (e.g. 2.1 MB)" },
            { key: "downloadUrl", label: "Download URL" },
        ],
        chapters: [
            { key: "name", label: "Short Name (e.g. IEEE CS)", required: true },
            { key: "full", label: "Full Name" },
            { key: "desc", label: "Description" },
            { key: "color", label: "Gradient (e.g. from-blue-500 to-blue-600)" },
            { key: "activities", label: "Activities (comma-separated)" },
            { key: "members", label: "Member Count" },
            { key: "projects", label: "Active Projects Count" },
        ],
        testimonials: [
            { key: "name", label: "Name", required: true },
            { key: "role", label: "Role" },
            { key: "college", label: "College" },
            { key: "text", label: "Testimonial Text", type: "textarea" },
        ],
        sponsors: [
            { key: "name", label: "Sponsor Name", required: true },
            { key: "logo", label: "Logo Text (displayed)" },
        ],
        news: [
            { key: "title", label: "Title", required: true },
            { key: "desc", label: "Description" },
            { key: "tag", label: "Tag", type: "select", options: ["Hackathon", "Scholarship", "Internship", "Announcement", "Event"] },
        ],
    };

    const currentFields = fields[type] || [];

    return (
        <form onSubmit={handleSubmit}>
            {currentFields.map(f => (
                <FormField key={f.key} label={f.label}>
                    {f.type === "select" ? (
                        <select value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} className={inputCls} required={f.required}>
                            <option value="">Select...</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ) : f.type === "textarea" ? (
                        <textarea value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} className={inputCls + " resize-none"} rows={3} required={f.required} />
                    ) : (
                        <input value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} className={inputCls} required={f.required} />
                    )}
                </FormField>
            ))}
            <div className="flex gap-3 mt-5">
                <button type="submit" disabled={loading} className="btn-primary text-sm !py-2.5 flex-1">
                    {loading ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={onClose} className="btn-secondary text-sm !py-2.5 flex-1">Cancel</button>
            </div>
        </form>
    );
}
