import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Cpu, Zap, Lightbulb, Radio, Users, Heart, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const ICON_MAP = { "IEEE CS": Cpu, "IEEE RAS": Zap, "IEEE PES": Lightbulb, "IEEE IAS": Radio, "IEEE WIE": Heart, "IEEE SPS": Users };

const STATIC = [
    { id: "c1", name: "IEEE CS", full: "Computer Society", color: "from-blue-500 to-blue-600", members: 120, projects: 8, desc: "Advancing computing for the benefit of humanity." },
    { id: "c2", name: "IEEE RAS", full: "Robotics & Automation", color: "from-orange-500 to-red-500", members: 85, projects: 5, desc: "Fostering innovation in robotics and automation." },
    { id: "c3", name: "IEEE PES", full: "Power & Energy", color: "from-yellow-500 to-amber-500", members: 60, projects: 3, desc: "Advancing power and energy technology." },
    { id: "c4", name: "IEEE IAS", full: "Industry Applications", color: "from-green-500 to-emerald-500", members: 45, projects: 4, desc: "Bridging industry and academia." },
    { id: "c5", name: "IEEE WIE", full: "Women in Engineering", color: "from-pink-500 to-rose-500", members: 95, projects: 6, desc: "Empowering women in technology." },
    { id: "c6", name: "IEEE SPS", full: "Signal Processing", color: "from-purple-500 to-violet-500", members: 50, projects: 2, desc: "Advancing signal processing science." },
];

export default function ChaptersSocieties() {
    const [data, setData] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "chapters"), orderBy("createdAt", "desc"), limit(6)), snap => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const societies = data.length > 0 ? data : STATIC;

    const handleJoin = () => {
        if (!user) { navigate("/auth", { state: { from: { pathname: "/chapters" } } }); return; }
        navigate("/chapters");
    };

    return (
        <section id="chapters" className="w-full py-14 sm:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">IEEE Societies</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Chapters & Societies</h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Explore our active IEEE societies and find your community.</p>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {societies.map((s, i) => {
                        const Icon = ICON_MAP[s.name] || Cpu;
                        return (
                            <motion.div key={s.id || s.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color || "from-blue-500 to-blue-600"} shadow-lg`}><Icon className="w-6 h-6 text-white" /></div>
                                    <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{s.name}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{s.full}</p></div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{s.desc}</p>
                                <div className="flex gap-4 mb-5 text-xs text-gray-500">
                                    <span><strong className="text-gray-900 dark:text-white">{s.members}</strong> Members</span>
                                    <span><strong className="text-gray-900 dark:text-white">{s.projects}</strong> Active Projects</span>
                                </div>
                                <button onClick={handleJoin} className="w-full btn-outline text-sm !py-2.5 group-hover:bg-ieee-blue group-hover:text-white group-hover:border-ieee-blue transition-all">
                                    Join Society <ChevronRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="text-center mt-10">
                    <Link to="/chapters" className="btn-primary !px-8 !py-3 text-sm">Explore All Chapters</Link>
                </div>
            </div>
        </section>
    );
}
