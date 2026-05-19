import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Cpu, Zap, Lightbulb, Radio, Heart, Users, ChevronRight, LogIn, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { useToast } from "../hooks/useToast";
import MetaTags from "../shared/MetaTags";

const ICON_MAP = { "IEEE CS": Cpu, "IEEE RAS": Zap, "IEEE PES": Lightbulb, "IEEE IAS": Radio, "IEEE WIE": Heart, "IEEE SPS": Users };

const STATIC_CHAPTERS = [
    { id: "c1", name: "IEEE CS", full: "Computer Society", color: "from-blue-500 to-blue-600", members: 120, projects: 8, desc: "Advancing computing for the benefit of humanity.", activities: ["AI/ML Workshops", "Coding Competitions", "Tech Talks", "Hackathons"] },
    { id: "c2", name: "IEEE RAS", full: "Robotics & Automation Society", color: "from-orange-500 to-red-500", members: 85, projects: 5, desc: "Fostering innovation in robotics and automation.", activities: ["Robot Building", "Drone Racing", "ROS Workshops", "Industry Visits"] },
    { id: "c3", name: "IEEE PES", full: "Power & Energy Society", color: "from-yellow-500 to-amber-500", members: 60, projects: 3, desc: "Advancing power and energy technology.", activities: ["Energy Audits", "Solar Projects", "Smart Grid Labs", "Seminars"] },
    { id: "c4", name: "IEEE IAS", full: "Industry Applications Society", color: "from-green-500 to-emerald-500", members: 45, projects: 4, desc: "Bridging industry and academia.", activities: ["Industry Tours", "PLC Training", "Automation Labs", "Case Studies"] },
    { id: "c5", name: "IEEE WIE", full: "Women in Engineering", color: "from-pink-500 to-rose-500", members: 95, projects: 6, desc: "Empowering women in technology.", activities: ["Mentorship Program", "Leadership Workshops", "STEM Outreach", "Networking Events"] },
    { id: "c6", name: "IEEE SPS", full: "Signal Processing Society", color: "from-purple-500 to-violet-500", members: 50, projects: 2, desc: "Advancing signal processing science.", activities: ["DSP Labs", "Image Processing", "Audio Engineering", "Research Papers"] },
];

export default function ChaptersPage() {
    const [firestoreChapters, setFirestoreChapters] = useState([]);
    const [myApps, setMyApps] = useState([]);
    const [joining, setJoining] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const addToast = useToast();

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "chapters"), orderBy("createdAt", "desc")), snap => {
            setFirestoreChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(
            query(collection(db, "applications"), where("userId", "==", user.uid), where("targetType", "==", "chapter")),
            snap => setMyApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => {}
        );
        return unsub;
    }, [user?.uid]);

    const societies = firestoreChapters.length > 0 ? firestoreChapters : STATIC_CHAPTERS;

    const handleJoin = async (chapter) => {
        if (!user) { navigate("/auth", { state: { from: { pathname: "/chapters" } } }); return; }
        if (user.approvalStatus === "PENDING") { addToast("Your account is pending admin approval.", "warning"); return; }
        const existing = myApps.find(a => a.targetId === chapter.id);
        if (existing) { addToast(`Already applied! Status: ${existing.status}`, "info"); return; }
        setJoining(chapter.id);
        try {
            await adminService.createApplication(user.uid, "chapter", chapter.id, chapter.name);
            addToast("Join request submitted! Waiting for approval.", "success");
        } catch (err) { addToast("Failed: " + err.message, "error"); }
        finally { setJoining(null); }
    };

    const getAppStatus = (chId) => myApps.find(a => a.targetId === chId);

    return (
        <div className="min-h-screen">
            <MetaTags title="Chapters & Societies" description="Explore IEEE societies and chapters at SB CEK." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Chapters & Societies</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Discover our active IEEE societies and find the community that matches your passion.</p>
                        {!user && (
                            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
                                <LogIn className="w-4 h-4" /> <a href="/auth" className="underline">Login</a> to join a society
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-8">
                    {societies.map((s, i) => {
                        const Icon = ICON_MAP[s.name] || Cpu;
                        const appStatus = getAppStatus(s.id);
                        return (
                            <motion.div key={s.id || s.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all overflow-hidden">
                                <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-6">
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${s.color || "from-blue-500 to-blue-600"} shadow-lg shrink-0 self-start`}>
                                        <Icon className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{s.name}</h2>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">— {s.full}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{s.desc}</p>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(s.activities || []).map(a => <span key={a} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg">{a}</span>)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <span className="text-sm text-gray-500"><strong className="text-gray-900 dark:text-white">{s.members}</strong> Members</span>
                                            <span className="text-sm text-gray-500"><strong className="text-gray-900 dark:text-white">{s.projects}</strong> Active Projects</span>
                                            {appStatus ? (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className={`px-4 py-2 rounded-xl text-sm font-bold ${appStatus.status === "APPROVED" ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : appStatus.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"}`}>
                                                        {appStatus.status === "APPROVED" && <><CheckCircle2 className="w-4 h-4 inline mr-1" />Member!</>}
                                                        {appStatus.status === "PENDING" && "⏳ Request Pending"}
                                                        {appStatus.status === "REJECTED" && "Request Declined"}
                                                    </span>
                                                    {appStatus.formUrl && (
                                                        <a href={appStatus.formUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-sm font-bold bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/20 dark:text-cyan-400 border border-ieee-blue/20 hover:bg-ieee-blue/20 transition-colors">
                                                            📋 Fill Onboarding Form
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <button onClick={() => handleJoin(s)} disabled={joining === (s.id || s.name)} className="btn-primary text-sm !py-2 !px-5">
                                                    {joining === (s.id || s.name) ? "Joining..." : "Join Society"} <ChevronRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
