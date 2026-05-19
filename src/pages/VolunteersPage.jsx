import { motion, AnimatePresence } from "framer-motion";
import { Award, Clock, Github, Linkedin, Search, Users, X, Mail, MapPin } from "lucide-react";
import { useState } from "react";
import MetaTags from "../shared/MetaTags";

const volunteers = [
    { name: "Priya Sharma", role: "Branch Chair", avatar: "P", hours: 420, badges: 5, points: 2400, gradient: "from-amber-400 to-yellow-300", bio: "Passionate about technology leadership and community building.", linkedin: "https://linkedin.com/in/priya-sharma", github: "https://github.com/priyasharma", email: "priya@ieee.org", college: "CEK", branch: "CS", year: "4th Year", badgeNames: ["Event Hero", "Core Volunteer", "Tech Mentor", "Innovation Lead", "Rising Star"] },
    { name: "James Rodriguez", role: "Technical Lead", avatar: "J", hours: 380, badges: 4, points: 1850, gradient: "from-ieee-blue to-cyan-400", bio: "Full-stack developer and open-source contributor.", linkedin: "https://linkedin.com/in/james-rodriguez", github: "https://github.com/jamesrodriguez", email: "james@ieee.org", college: "CEK", branch: "ECE", year: "3rd Year", badgeNames: ["Innovation Lead", "Core Volunteer", "Tech Mentor", "Rising Star"] },
    { name: "Aisha Khan", role: "Event Coordinator", avatar: "A", hours: 310, badges: 3, points: 1200, gradient: "from-violet-500 to-purple-400", bio: "Creative event planner making every IEEE event memorable.", linkedin: "https://linkedin.com/in/aisha-khan", github: "https://github.com/aishakhan", email: "aisha@ieee.org", college: "CEK", branch: "EEE", year: "3rd Year", badgeNames: ["Event Hero", "Rising Star", "Core Volunteer"] },
    { name: "Ravi Mehta", role: "Design Lead", avatar: "R", hours: 280, badges: 3, points: 980, gradient: "from-emerald-400 to-green-400", bio: "UI/UX designer passionate about accessible design.", linkedin: "https://linkedin.com/in/ravi-mehta", github: "https://github.com/ravimehta", email: "ravi@ieee.org", college: "CEK", branch: "CS", year: "3rd Year", badgeNames: ["Innovation Lead", "Core Volunteer", "Rising Star"] },
    { name: "Sara Thompson", role: "WIE Chair", avatar: "S", hours: 250, badges: 2, points: 750, gradient: "from-rose-400 to-pink-400", bio: "Empowering women in engineering through IEEE WIE initiatives.", linkedin: "https://linkedin.com/in/sara-thompson", github: "https://github.com/sarathompson", email: "sara@ieee.org", college: "CEK", branch: "ME", year: "4th Year", badgeNames: ["Event Hero", "Core Volunteer"] },
    { name: "Arjun Nair", role: "Web Developer", avatar: "AN", hours: 220, badges: 2, points: 680, gradient: "from-teal-400 to-cyan-400", bio: "Building beautiful web experiences for IEEE platforms.", linkedin: "https://linkedin.com/in/arjun-nair", github: "https://github.com/arjunnair", email: "arjun@ieee.org", college: "CEK", branch: "CS", year: "2nd Year", badgeNames: ["Tech Mentor", "Rising Star"] },
    { name: "Fatima Ali", role: "Content Writer", avatar: "F", hours: 190, badges: 2, points: 540, gradient: "from-orange-400 to-amber-400", bio: "Technical writer crafting stories that inspire student volunteers.", linkedin: "https://linkedin.com/in/fatima-ali", github: "https://github.com/fatimaali", email: "fatima@ieee.org", college: "CEK", branch: "CS", year: "2nd Year", badgeNames: ["Core Volunteer", "Rising Star"] },
    { name: "David Chen", role: "RAS Lead", avatar: "D", hours: 170, badges: 1, points: 420, gradient: "from-blue-400 to-indigo-400", bio: "Robotics enthusiast exploring the frontiers of automation.", linkedin: "https://linkedin.com/in/david-chen", github: "https://github.com/davidchen", email: "david@ieee.org", college: "CEK", branch: "ECE", year: "3rd Year", badgeNames: ["Innovation Lead"] },
];

const BADGE_COLORS = {
    "Event Hero": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Core Volunteer": "bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400",
    "Tech Mentor": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Innovation Lead": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "Rising Star": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function VolunteersPage() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const filtered = volunteers.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.role.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen">
            <MetaTags title="Volunteers" description="Meet the amazing volunteers of IEEE SB CEK." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Users className="w-10 h-10 text-ieee-blue dark:text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Our Volunteers</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-2">The incredible people who power IEEE SB CEK.</p>
                        <p className="text-sm text-gray-400 mb-8">Click on any volunteer to see their full profile & social links.</p>
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search volunteers..." className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-ieee-blue/50 outline-none text-sm" />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filtered.map((v, i) => (
                        <motion.div
                            key={v.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelected(v)}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all text-center cursor-pointer group"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${v.gradient} flex items-center justify-center text-white text-xl font-black shadow-lg mx-auto mb-3 group-hover:scale-110 transition-transform`}>{v.avatar}</div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{v.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{v.role}</p>
                            <div className="flex justify-center gap-4 mb-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{v.hours}h</span>
                                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{v.badges}</span>
                                <span className="font-bold text-ieee-blue dark:text-cyan-400">{v.points}pts</span>
                            </div>
                            <p className="text-xs text-ieee-blue dark:text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">View Profile →</p>
                        </motion.div>
                    ))}
                </div>
                {filtered.length === 0 && <div className="text-center py-16 text-gray-500">No volunteers found.</div>}
            </section>

            {/* ── Profile Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden">
                            {/* Gradient Header */}
                            <div className={`bg-gradient-to-br ${selected.gradient} p-6 relative`}>
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition"><X className="w-5 h-5" /></button>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-black shadow-xl border-2 border-white/30">{selected.avatar}</div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{selected.name}</h3>
                                        <p className="text-white/80 font-semibold">{selected.role}</p>
                                        <div className="flex items-center gap-1 mt-1 text-white/70 text-xs"><MapPin className="w-3 h-3" /> {selected.college} • {selected.branch} • {selected.year}</div>
                                    </div>
                                </div>
                            </div>
                            {/* Body */}
                            <div className="p-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{selected.bio}</p>
                                {/* Stats */}
                                <div className="flex gap-4 mb-5 py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex-1 text-center"><p className="text-2xl font-black text-ieee-blue dark:text-cyan-400">{selected.hours}</p><p className="text-[10px] text-gray-400 font-bold uppercase">Hours</p></div>
                                    <div className="w-px bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 text-center"><p className="text-2xl font-black text-amber-500">{selected.badges}</p><p className="text-[10px] text-gray-400 font-bold uppercase">Badges</p></div>
                                    <div className="w-px bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 text-center"><p className="text-2xl font-black text-emerald-500">{selected.points}</p><p className="text-[10px] text-gray-400 font-bold uppercase">Points</p></div>
                                </div>
                                {/* Badges */}
                                {selected.badgeNames && (
                                    <div className="mb-5">
                                        <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Badges</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selected.badgeNames.map(b => <span key={b} className={`px-3 py-1.5 text-xs font-bold rounded-xl ${BADGE_COLORS[b] || "bg-gray-100 text-gray-600"}`}>{b}</span>)}
                                        </div>
                                    </div>
                                )}
                                {/* Social Links */}
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Connect</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.linkedin && <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors text-sm font-semibold"><Linkedin className="w-4 h-4" /> LinkedIn</a>}
                                        {selected.github && <a href={selected.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors text-sm font-semibold"><Github className="w-4 h-4" /> GitHub</a>}
                                        {selected.email && <a href={`mailto:${selected.email}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors text-sm font-semibold"><Mail className="w-4 h-4" /> Email</a>}
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
