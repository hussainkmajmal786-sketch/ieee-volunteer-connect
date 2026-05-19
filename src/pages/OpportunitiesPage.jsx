import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { MapPin, Clock, Wifi, WifiOff, ChevronRight, Sparkles, Search, Filter, LogIn, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { useToast } from "../hooks/useToast";
import MetaTags from "../shared/MetaTags";

const FILTERS = ["All", "Technical", "Design", "Content", "Web Development", "Event Management", "Robotics"];

const STATIC_OPPS = [
    { id: "s1", title: "AI Workshop Facilitator", organizer: "IEEE CS Society", mode: "Offline", duration: "3 months", skills: ["Python", "ML", "Public Speaking"], category: "Technical", urgent: true },
    { id: "s2", title: "Event Poster Designer", organizer: "IEEE WIE", mode: "Online", duration: "1 month", skills: ["Figma", "Canva", "Branding"], category: "Design" },
    { id: "s3", title: "Technical Blog Writer", organizer: "IEEE SB CEK", mode: "Online", duration: "Ongoing", skills: ["Writing", "Research", "SEO"], category: "Content" },
    { id: "s4", title: "Website Developer", organizer: "IEEE CS Society", mode: "Online", duration: "2 months", skills: ["React", "Tailwind", "Firebase"], category: "Web Development", urgent: true },
    { id: "s5", title: "Hackathon Coordinator", organizer: "IEEE SB CEK", mode: "Offline", duration: "2 weeks", skills: ["Leadership", "Planning"], category: "Event Management" },
    { id: "s6", title: "Robotics Team Lead", organizer: "IEEE RAS", mode: "Offline", duration: "6 months", skills: ["Arduino", "ROS", "CAD"], category: "Robotics" },
];

export default function OpportunitiesPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [firestoreOpps, setFirestoreOpps] = useState([]);
    const [applying, setApplying] = useState(null);
    const [myApps, setMyApps] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();
    const addToast = useToast();

    // Subscribe to Firestore opportunities
    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "opportunities"), orderBy("createdAt", "desc")), snap => {
            setFirestoreOpps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    // Get user's existing applications
    useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(
            query(collection(db, "applications"), where("userId", "==", user.uid), where("targetType", "==", "opportunity")),
            snap => setMyApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => {}
        );
        return unsub;
    }, [user?.uid]);

    const opportunities = firestoreOpps.length > 0 ? firestoreOpps : STATIC_OPPS;

    const filtered = opportunities.filter(o => {
        const matchCat = activeFilter === "All" || o.category === activeFilter;
        const matchSearch = !searchQuery || o.title?.toLowerCase().includes(searchQuery.toLowerCase()) || o.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCat && matchSearch;
    });

    const handleApply = async (opp) => {
        if (!user) {
            navigate("/auth", { state: { from: { pathname: "/opportunities" } } });
            return;
        }
        if (user.approvalStatus === "PENDING") {
            addToast("Your account is pending admin approval. Please wait for approval before applying.", "warning");
            return;
        }
        // Check if already applied
        const alreadyApplied = myApps.find(a => a.targetId === opp.id);
        if (alreadyApplied) {
            addToast(`Already applied! Status: ${alreadyApplied.status}`, "info");
            return;
        }
        setApplying(opp.id);
        try {
            await adminService.createApplication(user.uid, "opportunity", opp.id, opp.title);
            addToast("Application submitted! Waiting for admin approval.", "success");
        } catch (err) {
            addToast("Failed to apply: " + err.message, "error");
        } finally {
            setApplying(null);
        }
    };

    const getAppStatus = (oppId) => myApps.find(a => a.targetId === oppId);

    return (
        <div className="min-h-screen">
            <MetaTags title="Opportunities" description="Find volunteering opportunities that match your skills at IEEE SB CEK." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400 font-semibold text-sm mb-4 border border-ieee-blue/20">
                            <Sparkles className="w-4 h-4" /> Open Positions
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Volunteer Opportunities</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">Find roles that match your skills and make an impact with IEEE.</p>
                        {!user && (
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
                                <LogIn className="w-4 h-4" /> <Link to="/auth" className="underline">Login</Link> to apply for opportunities
                            </div>
                        )}
                        {user && user.approvalStatus === "PENDING" && (
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
                                <ShieldAlert className="w-4 h-4" /> Your account is pending admin approval
                            </div>
                        )}
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title or skill..." className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-ieee-blue/50 outline-none text-sm" />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-wrap gap-2 mb-8">
                    <Filter className="w-5 h-5 text-gray-400 self-center mr-1" />
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFilter === f ? "bg-ieee-blue text-white shadow-lg" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-ieee-blue/40"}`}>{f}</button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((opp, i) => {
                        const appStatus = getAppStatus(opp.id);
                        return (
                            <motion.div key={opp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all relative">
                                {opp.urgent && <div className="absolute top-4 right-4 px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase rounded-lg animate-pulse">Urgent</div>}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-2.5 rounded-xl bg-ieee-blue/10 dark:bg-cyan-900/30">
                                        {opp.mode === "Online" ? <Wifi className="w-5 h-5 text-ieee-blue dark:text-cyan-400" /> : <MapPin className="w-5 h-5 text-ieee-blue dark:text-cyan-400" />}
                                    </div>
                                    <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{opp.title}</h3><p className="text-sm text-gray-500">{opp.organizer}</p></div>
                                </div>
                                <div className="flex gap-4 mb-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">{opp.mode === "Online" ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{opp.mode}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{opp.duration}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {(opp.skills || []).map(s => <span key={s} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg">{s}</span>)}
                                </div>
                                {appStatus ? (
                                    <div className="space-y-2">
                                        <div className={`w-full text-center py-2.5 rounded-xl text-sm font-bold ${appStatus.status === "APPROVED" ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : appStatus.status === "REJECTED" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"}`}>
                                            {appStatus.status === "APPROVED" && <><CheckCircle2 className="w-4 h-4 inline mr-1" />Approved!</>}
                                            {appStatus.status === "PENDING" && <>⏳ Application Pending</>}
                                            {appStatus.status === "REJECTED" && <>Application Rejected</>}
                                        </div>
                                        {appStatus.formUrl && (
                                            <a href={appStatus.formUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/20 dark:text-cyan-400 border border-ieee-blue/20 hover:bg-ieee-blue/20 transition-colors">
                                                📋 Fill Onboarding Form
                                            </a>
                                        )}
                                        {appStatus.formMessage && appStatus.formUrl && (
                                            <p className="text-xs text-gray-500 text-center px-2">{appStatus.formMessage}</p>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => handleApply(opp)} disabled={applying === opp.id} className="w-full btn-primary text-sm !py-2.5">
                                        {applying === opp.id ? "Applying..." : "Apply Now"} <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
                {filtered.length === 0 && <div className="text-center py-16 text-gray-500">No opportunities found matching your criteria.</div>}
            </section>
        </div>
    );
}
