import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { MapPin, Clock, Wifi, WifiOff, ChevronRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const FILTERS = ["All", "Technical", "Design", "Content", "Web Development", "Event Management", "Robotics"];

const STATIC = [
    { id: "s1", title: "AI Workshop Facilitator", organizer: "IEEE CS Society", mode: "Offline", duration: "3 months", skills: ["Python", "ML", "Public Speaking"], category: "Technical", urgent: true },
    { id: "s2", title: "Event Poster Designer", organizer: "IEEE WIE", mode: "Online", duration: "1 month", skills: ["Figma", "Canva", "Branding"], category: "Design" },
    { id: "s3", title: "Technical Blog Writer", organizer: "IEEE SB CEK", mode: "Online", duration: "Ongoing", skills: ["Writing", "Research", "SEO"], category: "Content" },
    { id: "s4", title: "Website Developer", organizer: "IEEE CS Society", mode: "Online", duration: "2 months", skills: ["React", "Tailwind", "Firebase"], category: "Web Development", urgent: true },
    { id: "s5", title: "Hackathon Coordinator", organizer: "IEEE SB CEK", mode: "Offline", duration: "2 weeks", skills: ["Leadership", "Planning"], category: "Event Management" },
    { id: "s6", title: "Robotics Team Lead", organizer: "IEEE RAS", mode: "Offline", duration: "6 months", skills: ["Arduino", "ROS", "CAD"], category: "Robotics" },
];

export default function FeaturedOpportunities() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [data, setData] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "opportunities"), orderBy("createdAt", "desc"), limit(6)), snap => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const opportunities = data.length > 0 ? data : STATIC;
    const filtered = activeFilter === "All" ? opportunities : opportunities.filter(o => o.category === activeFilter);

    const handleApply = () => {
        if (!user) { navigate("/auth", { state: { from: { pathname: "/opportunities" } } }); return; }
        navigate("/opportunities");
    };

    return (
        <section id="featured-opportunities" className="w-full py-14 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Volunteer Now
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Featured Opportunities</h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Find the perfect volunteering role that matches your skills and interests.</p>
                </motion.div>
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFilter === f ? "bg-ieee-blue text-white shadow-lg shadow-ieee-blue/25" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-ieee-blue/40"}`}>{f}</button>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((opp, i) => (
                        <motion.div key={opp.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-ieee-blue/30 hover:shadow-xl transition-all relative group">
                            {opp.urgent && <div className="absolute top-4 right-4 px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg animate-pulse">Urgent</div>}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-ieee-blue/10 dark:bg-cyan-900/30">
                                    {opp.mode === "Online" ? <Wifi className="w-5 h-5 text-ieee-blue dark:text-cyan-400" /> : <MapPin className="w-5 h-5 text-ieee-blue dark:text-cyan-400" />}
                                </div>
                                <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{opp.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{opp.organizer}</p></div>
                            </div>
                            <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">{opp.mode === "Online" ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{opp.mode}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{opp.duration}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {(opp.skills || []).map(s => <span key={s} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg">{s}</span>)}
                            </div>
                            <button onClick={handleApply} className="w-full btn-primary text-sm !py-2.5 group-hover:shadow-lg transition-all">
                                Apply Now <ChevronRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Link to="/opportunities" className="btn-outline !px-8 !py-3 text-sm">View All Opportunities <ChevronRight className="w-4 h-4" /></Link>
                </div>
            </div>
        </section>
    );
}
