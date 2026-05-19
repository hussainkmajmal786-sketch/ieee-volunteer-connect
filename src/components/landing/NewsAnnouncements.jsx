import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Newspaper, GraduationCap, Trophy, Briefcase, Megaphone, ChevronRight, X, Calendar, ArrowRight } from "lucide-react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const TAG_CONFIG = {
    Hackathon: { icon: Trophy, color: "text-amber-500", bg: "bg-amber-500" },
    Scholarship: { icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-500" },
    Internship: { icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500" },
    Announcement: { icon: Megaphone, color: "text-violet-500", bg: "bg-violet-500" },
    Event: { icon: Newspaper, color: "text-ieee-blue", bg: "bg-ieee-blue" },
};

const STATIC = [
    { id: "n1", title: "IEEE Region 10 Hackathon 2026", desc: "Registration now open for the biggest IEEE hackathon in Asia-Pacific. Join us for a 48-hour coding marathon where you can build innovative solutions, win amazing prizes, and network with top tech leaders.", tag: "Hackathon", time: "2 hours ago", date: "August 15-17, 2026" },
    { id: "n2", title: "New Scholarship for IEEE Members", desc: "Apply for the IEEE Foundation scholarship — deadline August 2026. This scholarship aims to support outstanding student members who have shown exceptional dedication to engineering and technology.", tag: "Scholarship", time: "1 day ago", date: "Deadline: August 30, 2026" },
    { id: "n3", title: "Summer Internship at IEEE HQ", desc: "Exciting internship opportunities at IEEE headquarters in New Jersey. Gain hands-on experience working with global standards, publications, and technical activities.", tag: "Internship", time: "3 days ago", date: "Summer 2027" },
    { id: "n4", title: "IEEE SB CEK Wins Best Branch Award", desc: "Our student branch has been recognized as the best in Kerala Section for the year 2025. Thank you to all the volunteers and members for making this possible!", tag: "Announcement", time: "1 week ago", date: "May 10, 2026" },
];

export default function NewsAnnouncements() {
    const [data, setData] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc"), limit(4)), snap => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const news = data.length > 0 ? data : STATIC;

    return (
        <section id="news" className="w-full py-14 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Newspaper className="w-4 h-4" /> Latest Updates
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">News & Announcements</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {news.map((n, i) => {
                        const config = TAG_CONFIG[n.tag] || TAG_CONFIG.Announcement;
                        const Icon = config.icon;
                        return (
                            <motion.div 
                                key={n.id} 
                                initial={{ opacity: 0, y: 20 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: true }} 
                                transition={{ delay: i * 0.1 }} 
                                whileHover={{ x: 4 }} 
                                onClick={() => setSelected({ ...n, config })}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-ieee-blue/20 transition-all flex gap-4 cursor-pointer group"
                            >
                                <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 ${config.color} shrink-0 h-fit`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-ieee-blue dark:text-cyan-400 bg-ieee-blue/10 dark:bg-cyan-900/30 px-2 py-0.5 rounded">{n.tag}</span>
                                        <span className="text-[10px] text-gray-400">{n.time || "Recently"}</span>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors">{n.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 self-center group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors" />
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── News Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden"
                        >
                            <div className="relative h-24">
                                <div className={`absolute inset-0 opacity-20 ${selected.config.bg}`} />
                                <div className={`absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent`} />
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 backdrop-blur-sm transition-all z-10">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute -bottom-6 left-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border-4 border-white dark:border-gray-900 flex items-center justify-center ${selected.config.color}`}>
                                        <selected.config.icon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 pt-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-100 dark:bg-gray-800 ${selected.config.color}`}>
                                        {selected.tag}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {selected.date || selected.time || "Recently"}
                                    </span>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {selected.title}
                                </h3>
                                
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-8">
                                    <p className="whitespace-pre-line leading-relaxed">{selected.desc}</p>
                                </div>
                                
                                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <button 
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-all ${selected.config.bg} hover:opacity-90`}
                                        onClick={() => alert("Full details opening soon...")}
                                    >
                                        Read Full Details <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setSelected(null)}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
