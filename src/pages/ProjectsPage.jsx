import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Github, ExternalLink, Search, Filter, FolderOpen, X, Users, Cpu } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import MetaTags from "../shared/MetaTags";

const CATS = ["All", "AI", "IoT", "Web", "Robotics", "Sustainability"];
const CAT_COLORS = { AI: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", IoT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", Web: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", Robotics: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", Sustainability: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
const STATUS = { Active: "bg-green-500", Completed: "bg-blue-500", "In Progress": "bg-amber-500" };
const CAT_GRADIENTS = { AI: "from-violet-500 to-purple-600", IoT: "from-teal-500 to-cyan-600", Web: "from-blue-500 to-indigo-600", Robotics: "from-orange-500 to-red-600", Sustainability: "from-green-500 to-emerald-600" };

const STATIC_PROJECTS = [
    { id: "p1", title: "Smart Campus Navigator", desc: "Indoor navigation system using BLE beacons for seamless campus wayfinding. Features real-time location tracking, accessible routing, and building floor plans.", team: ["Arjun", "Priya", "Sara"], tech: ["React", "Firebase", "BLE"], category: "Web", status: "Active", github: "https://github.com", demo: "https://example.com" },
    { id: "p2", title: "AI Study Buddy", desc: "AI-powered study assistant with personalized learning paths. Uses machine learning to recommend materials and create adaptive quizzes.", team: ["James", "David"], tech: ["Python", "TensorFlow", "Flask"], category: "AI", status: "In Progress", github: "https://github.com", demo: "https://example.com" },
    { id: "p3", title: "Smart Plant Watering", desc: "IoT automated plant watering with soil moisture monitoring, weather integration, and mobile app control for precision agriculture.", team: ["Ravi", "Fatima", "Aisha"], tech: ["Arduino", "MQTT", "React"], category: "IoT", status: "Completed", github: "https://github.com", demo: "https://example.com" },
    { id: "p4", title: "Drone Delivery Sim", desc: "Autonomous drone delivery system simulation with path planning, obstacle avoidance, and package tracking using ROS and computer vision.", team: ["David", "Arjun"], tech: ["ROS", "Python", "Gazebo"], category: "Robotics", status: "Active", github: "https://github.com", demo: "https://example.com" },
    { id: "p5", title: "Carbon Tracker", desc: "Mobile app to track personal carbon footprint with gamification, community challenges, and AI-powered sustainability tips.", team: ["Sara", "Fatima", "Priya"], tech: ["React Native", "Node.js"], category: "Sustainability", status: "In Progress", github: "https://github.com", demo: "https://example.com" },
    { id: "p6", title: "IEEE Event Platform", desc: "Full-stack event management for IEEE student branches featuring registration, attendance tracking, certificates, and analytics dashboards.", team: ["James", "Arjun", "Ravi"], tech: ["React", "Tailwind", "Firebase"], category: "Web", status: "Completed", github: "https://github.com", demo: "https://example.com" },
];

export default function ProjectsPage() {
    const [cat, setCat] = useState("All");
    const [search, setSearch] = useState("");
    const [firestoreProjects, setFirestoreProjects] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "projects"), orderBy("createdAt", "desc")), snap => {
            setFirestoreProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const projects = firestoreProjects.length > 0 ? firestoreProjects : STATIC_PROJECTS;

    const filtered = projects.filter(p => {
        const mc = cat === "All" || p.category === cat;
        const ms = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.tech?.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return mc && ms;
    });

    return (
        <div className="min-h-screen">
            <MetaTags title="Projects" description="Explore innovative projects built by IEEE SB CEK students." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <FolderOpen className="w-10 h-10 text-ieee-blue dark:text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Project Showcase</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-2">Innovative projects built by IEEE SB CEK students.</p>
                        <p className="text-sm text-gray-400 mb-8">Click on any project to see details, team, and links.</p>
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or technologies..." className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-ieee-blue/50 outline-none text-sm" />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-wrap gap-2 mb-8">
                    <Filter className="w-5 h-5 text-gray-400 self-center mr-1" />
                    {CATS.map(c => <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${cat === c ? "bg-ieee-blue text-white shadow-lg" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>{c}</button>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }} onClick={() => setSelected(p)} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${CAT_COLORS[p.category] || "bg-gray-100 text-gray-600"}`}>{p.category}</span>
                                <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${STATUS[p.status] || "bg-gray-400"}`} /><span className="text-xs font-semibold text-gray-500">{p.status}</span></div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors">{p.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{p.desc}</p>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {(p.tech || []).map(t => <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[11px] font-semibold rounded-md text-gray-600 dark:text-gray-300">{t}</span>)}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex -space-x-2">
                                    {(p.team || []).slice(0, 4).map(m => <div key={m} className="w-7 h-7 rounded-full bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-800">{typeof m === "string" ? m[0] : "?"}</div>)}
                                </div>
                                <span className="text-xs text-ieee-blue dark:text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
                {filtered.length === 0 && <div className="text-center py-16 text-gray-500">No projects found.</div>}
            </section>

            {/* ── Project Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto">
                            {/* Gradient Header */}
                            <div className={`bg-gradient-to-br ${CAT_GRADIENTS[selected.category] || "from-gray-500 to-gray-600"} p-6 relative`}>
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition"><X className="w-5 h-5" /></button>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg">{selected.category}</span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
                                        <span className={`w-2 h-2 rounded-full ${STATUS[selected.status] || "bg-white"}`} /> {selected.status}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white">{selected.title}</h3>
                            </div>
                            {/* Body */}
                            <div className="p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{selected.desc || "No description available."}</p>

                                {/* Tech Stack */}
                                <div className="mb-5">
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Tech Stack</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(selected.tech || []).map(t => <span key={t} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700">{t}</span>)}
                                    </div>
                                </div>

                                {/* Team */}
                                <div className="mb-5">
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Team ({(selected.team || []).length} members)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(selected.team || []).map(m => (
                                            <div key={m} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">{typeof m === "string" ? m[0] : "?"}</div>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* External Links */}
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Links</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.github && selected.github !== "#" && (
                                            <a href={selected.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-sm font-semibold border border-gray-700">
                                                <Github className="w-4 h-4" /> View on GitHub
                                            </a>
                                        )}
                                        {selected.demo && selected.demo !== "#" && (
                                            <a href={selected.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ieee-blue text-white hover:bg-ieee-blue/90 transition-colors text-sm font-semibold">
                                                <ExternalLink className="w-4 h-4" /> Live Demo
                                            </a>
                                        )}
                                        {(!selected.github || selected.github === "#") && (!selected.demo || selected.demo === "#") && (
                                            <p className="text-sm text-gray-400 italic">No external links available yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
