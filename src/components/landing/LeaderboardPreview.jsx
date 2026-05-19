import { motion } from "framer-motion";
import { Trophy, Medal, Flame, Star, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const BADGES = [
    { name: "Event Hero", icon: "🏆", desc: "Organized 10+ events", color: "from-amber-400 to-yellow-300" },
    { name: "Tech Mentor", icon: "🧑‍💻", desc: "Mentored 5+ students", color: "from-emerald-400 to-green-300" },
    { name: "Core Volunteer", icon: "⭐", desc: "100+ volunteer hours", color: "from-ieee-blue to-cyan-400" },
    { name: "Innovation Lead", icon: "💡", desc: "Led 3+ projects", color: "from-violet-400 to-purple-300" },
];

const weeklyTop = [
    { name: "Priya S.", pts: 2400, streak: 12, level: "Diamond" },
    { name: "James R.", pts: 1850, streak: 8, level: "Platinum" },
    { name: "Aisha K.", pts: 1200, streak: 5, level: "Gold" },
    { name: "Ravi M.", pts: 980, streak: 4, level: "Gold" },
    { name: "Sara T.", pts: 750, streak: 3, level: "Silver" },
];

const LEVEL_COLORS = { Diamond: "text-cyan-400", Platinum: "text-gray-300", Gold: "text-amber-400", Silver: "text-gray-400" };

export default function LeaderboardPreview() {
    return (
        <section id="leaderboard-preview" className="w-full py-14 sm:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Gamification
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Leaderboard & Badges</h2>
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Weekly Leaderboard */}
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Weekly Leaderboard</h3>
                        <div className="space-y-3">
                            {weeklyTop.map((u, i) => (
                                <div key={u.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? "bg-gradient-to-br from-amber-400 to-yellow-300 text-white" : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" : i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</span>
                                            <span className="text-sm font-black text-ieee-blue dark:text-cyan-400">{u.pts} pts</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-bold"><Flame className="w-3 h-3" />{u.streak} streak</span>
                                            <span className={`text-[10px] font-bold ${LEVEL_COLORS[u.level]}`}>{u.level}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    {/* Achievement Badges */}
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Medal className="w-5 h-5 text-ieee-blue dark:text-cyan-400" /> Achievement Badges</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {BADGES.map((b, i) => (
                                <motion.div key={b.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.05 }} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 text-center hover:shadow-lg transition-all cursor-default">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg`}>{b.icon}</div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{b.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{b.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
                <div className="text-center mt-10">
                    <Link to="/leaderboard" className="btn-primary !px-8 !py-3 text-sm">View Full Leaderboard <ChevronRight className="w-4 h-4" /></Link>
                </div>
            </div>
        </section>
    );
}
