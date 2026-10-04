import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../Avatar";
import { apiGet } from "../../lib/api";
import { getGrade, BADGES } from "../../utils/grades";

const RANK_STYLE = [
    "bg-gradient-to-br from-amber-400 to-yellow-300 text-white",
    "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
    "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
];

/** Top 5 from the real leaderboard, plus the badges people can earn. */
export default function LeaderboardPreview() {
    const [top, setTop] = useState(null);

    useEffect(() => {
        apiGet("/api/public/leaderboard").then(r => setTop(r.leaders.slice(0, 5))).catch(() => setTop([]));
    }, []);

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
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Top Volunteers</h3>
                        {top === null ? (
                            <div className="space-y-3">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-700/50 animate-pulse" />)}</div>
                        ) : top.length === 0 ? (
                            <p className="text-sm text-gray-500 py-8 text-center">Be the first on the board — complete tasks and share event links to earn points.</p>
                        ) : (
                            <div className="space-y-3">
                                {top.map((u, i) => {
                                    const grade = getGrade(u.points);
                                    return (
                                        <Link to={`/volunteers/${u.id}`} key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${RANK_STYLE[i] || "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}>{i + 1}</div>
                                            <Avatar src={u.photoURL} name={u.name} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.name}</span>
                                                    <span className="text-sm font-black text-ieee-blue dark:text-cyan-400 whitespace-nowrap">{u.points} pts</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                                                    {u.referrals > 0 && <span className="flex items-center gap-0.5 text-[10px] text-gray-500"><Users className="w-3 h-3" />{u.referrals} referred</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2"><Medal className="w-5 h-5 text-ieee-blue dark:text-cyan-400" /> Badges you can earn</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {BADGES.map((b, i) => (
                                <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                                    className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 text-center">
                                    <div className="text-2xl mb-1.5">{b.icon}</div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{b.desc}</p>
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
