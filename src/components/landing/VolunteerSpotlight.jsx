import { motion, AnimatePresence } from "framer-motion";
import { Award, Clock, Github, Linkedin, Trophy, X, Globe, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const spotlights = [
    { name: "Priya Sharma", role: "Branch Chair", avatar: "P", hours: 420, badges: ["Event Hero", "Core Volunteer", "Tech Mentor"], achievements: "Led 15+ events with 2000+ participants", gradient: "from-amber-400 to-yellow-300", rank: 1, bio: "Passionate about technology leadership and community building. Leading IEEE SB CEK to new heights.", linkedin: "https://linkedin.com/in/priya-sharma", github: "https://github.com/priyasharma", email: "priya@ieee.org", college: "CEK", branch: "Computer Science", year: "4th Year" },
    { name: "James Rodriguez", role: "Technical Lead", avatar: "J", hours: 380, badges: ["Innovation Lead", "Core Volunteer"], achievements: "Built 3 IEEE projects, mentored 20+ students", gradient: "from-ieee-blue to-cyan-400", rank: 2, bio: "Full-stack developer and open-source contributor. Love building tools that make a difference.", linkedin: "https://linkedin.com/in/james-rodriguez", github: "https://github.com/jamesrodriguez", email: "james@ieee.org", college: "CEK", branch: "Electronics", year: "3rd Year" },
    { name: "Aisha Khan", role: "Event Coordinator", avatar: "A", hours: 310, badges: ["Event Hero", "Rising Star"], achievements: "Organized 10+ events, 95% satisfaction rate", gradient: "from-violet-500 to-purple-400", rank: 3, bio: "Creative event planner with a knack for making every IEEE event memorable and impactful.", linkedin: "https://linkedin.com/in/aisha-khan", github: "https://github.com/aishakhan", email: "aisha@ieee.org", college: "CEK", branch: "EEE", year: "3rd Year" },
];

const BADGE_COLORS = {
    "Event Hero": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Core Volunteer": "bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400",
    "Tech Mentor": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Innovation Lead": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "Rising Star": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function VolunteerSpotlight() {
    const [selected, setSelected] = useState(null);

    return (
        <section id="volunteer-spotlight" className="w-full py-14 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Trophy className="w-4 h-4" /> Stars of IEEE
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Volunteer Spotlight</h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Click on a volunteer to see their full profile.</p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {spotlights.map((vol, i) => (
                        <motion.div
                            key={vol.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12 }}
                            whileHover={{ y: -6 }}
                            onClick={() => setSelected(vol)}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all relative cursor-pointer group"
                        >
                            <div className="absolute top-4 right-4">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${vol.gradient} flex items-center justify-center shadow-lg`}>
                                    <span className="text-white font-black text-sm">#{vol.rank}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center mb-5">
                                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${vol.gradient} flex items-center justify-center text-white text-2xl font-black shadow-xl mb-3 group-hover:scale-105 transition-transform`}>{vol.avatar}</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{vol.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{vol.role}</p>
                            </div>
                            <div className="flex justify-center gap-6 mb-4 py-3 border-y border-gray-100 dark:border-gray-700">
                                <div className="text-center">
                                    <div className="flex items-center gap-1 text-ieee-blue dark:text-cyan-400"><Clock className="w-4 h-4" /><span className="text-lg font-black">{vol.hours}</span></div>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Hours</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center gap-1 text-amber-500"><Award className="w-4 h-4" /><span className="text-lg font-black">{vol.badges.length}</span></div>
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Badges</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">{vol.achievements}</p>
                            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                                {vol.badges.map(b => (
                                    <span key={b} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg ${BADGE_COLORS[b] || "bg-gray-100 text-gray-600"}`}>{b}</span>
                                ))}
                            </div>
                            <p className="text-xs text-center text-ieee-blue dark:text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Click to view full profile →</p>
                        </motion.div>
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Link to="/volunteers" className="btn-outline !px-8 !py-3 text-sm">Meet All Volunteers</Link>
                </div>
            </div>

            {/* ── Profile Detail Modal ── */}
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
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className={`bg-gradient-to-br ${selected.gradient} p-6 relative`}>
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-black shadow-xl border-2 border-white/30">
                                        {selected.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{selected.name}</h3>
                                        <p className="text-white/80 font-semibold">{selected.role}</p>
                                        <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
                                            <MapPin className="w-3 h-3" /> {selected.college} • {selected.branch} • {selected.year}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Bio */}
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{selected.bio}</p>

                                {/* Stats */}
                                <div className="flex gap-4 mb-5 py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex-1 text-center">
                                        <p className="text-2xl font-black text-ieee-blue dark:text-cyan-400">{selected.hours}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Hours</p>
                                    </div>
                                    <div className="w-px bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 text-center">
                                        <p className="text-2xl font-black text-amber-500">{selected.badges.length}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Badges</p>
                                    </div>
                                    <div className="w-px bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 text-center">
                                        <p className="text-2xl font-black text-emerald-500">#{selected.rank}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Rank</p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="mb-5">
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Badges & Achievements</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selected.badges.map(b => (
                                            <span key={b} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${BADGE_COLORS[b] || "bg-gray-100 text-gray-600"}`}>{b}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{selected.achievements}</p>
                                </div>

                                {/* Social Links */}
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Connect</p>
                                    <div className="flex gap-2">
                                        {selected.linkedin && (
                                            <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-semibold">
                                                <Linkedin className="w-4 h-4" /> LinkedIn
                                            </a>
                                        )}
                                        {selected.github && (
                                            <a href={selected.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-semibold">
                                                <Github className="w-4 h-4" /> GitHub
                                            </a>
                                        )}
                                        {selected.email && (
                                            <a href={`mailto:${selected.email}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-semibold">
                                                <Mail className="w-4 h-4" /> Email
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
