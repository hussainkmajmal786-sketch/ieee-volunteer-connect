import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { getGrade, getNextGrade, getGradeProgress, GRADE_TIERS, getEarnedBadges } from "../utils/grades";

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        // Primary query: requires composite index (role + points desc)
        const q = query(
            collection(db, "users"),
            where("role", "in", ["VOLUNTEER", "ADMIN"]),
            orderBy("points", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({
                    id: doc.id,
                    name: data.name || 'Unknown User',
                    branch: data.branch || 'IEEE Branch',
                    points: data.points || 0,
                    tasksCompleted: data.tasksCompleted || 0,
                    shares: data.shares || 0,
                });
            });
            setLeaders(usersData);
            setLoading(false);
        }, (error) => {
            // Fallback: if composite index not ready, fetch all users and filter/sort client-side
            console.warn("Leaderboard index not ready, using fallback:", error.message);
            const fallbackQ = query(collection(db, "users"));
            onSnapshot(fallbackQ, (snapshot) => {
                const usersData = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.role === "VOLUNTEER" || data.role === "ADMIN") {
                        usersData.push({
                            id: doc.id,
                            name: data.name || 'Unknown User',
                            branch: data.branch || 'IEEE Branch',
                            points: data.points || 0,
                            tasksCompleted: data.tasksCompleted || 0,
                            shares: data.shares || 0,
                        });
                    }
                });
                usersData.sort((a, b) => b.points - a.points);
                setLeaders(usersData);
                setLoading(false);
            });
        });

        return unsubscribe;
    }, []);

    const filteredLeaders = activeFilter === 'All'
        ? leaders
        : leaders.filter(l => getGrade(l.points).name === activeFilter);

    const podiumColors = [
        { bg: "from-yellow-400 to-amber-500", text: "text-yellow-600", ring: "ring-yellow-400", icon: "👑" },
        { bg: "from-gray-300 to-gray-400", text: "text-gray-500", ring: "ring-gray-300", icon: "🥈" },
        { bg: "from-amber-600 to-amber-700", text: "text-amber-700", ring: "ring-amber-500", icon: "🥉" },
    ];

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-theme(spacing.20))] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <div className="text-center mb-10 max-w-xl mx-auto">
                <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Compete & Grow</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Leaderboard</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Top volunteers ranked by points earned this semester.</p>
            </div>

            {/* Grade Tier Legend */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                <button onClick={() => setActiveFilter('All')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'All' ? 'bg-ieee-blue text-white shadow-lg' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-ieee-blue/30'}`}>
                    All ({leaders.length})
                </button>
                {GRADE_TIERS.map(tier => {
                    const count = leaders.filter(l => getGrade(l.points).name === tier.name).length;
                    return (
                        <button key={tier.name} onClick={() => setActiveFilter(tier.name)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === tier.name ? `bg-gradient-to-r ${tier.bgClass} text-white shadow-lg` : `${tier.bgPill} ${tier.textClass} border ${tier.border} hover:opacity-80`}`}>
                            {tier.icon} {tier.name} ({count})
                        </button>
                    );
                })}
            </div>

            {filteredLeaders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-gray-500 font-medium">No volunteers in this tier yet.</p>
                </div>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {activeFilter === 'All' && filteredLeaders.length >= 3 && (
                        <div className="flex justify-center items-end gap-4 md:gap-8 mb-16">
                            {[filteredLeaders[1], filteredLeaders[0], filteredLeaders[2]].map((leader, i) => {
                                const podiumIdx = i === 1 ? 0 : i === 0 ? 1 : 2;
                                const style = podiumColors[podiumIdx];
                                const isFirst = podiumIdx === 0;
                                const grade = getGrade(leader.points);
                                const badges = getEarnedBadges(leader);
                                return (
                                    <motion.div key={leader.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 120 }} className={`flex flex-col items-center ${isFirst ? 'order-2 -mt-8' : i === 0 ? 'order-1' : 'order-3'}`}>
                                        <div className="text-3xl md:text-4xl mb-3 filter drop-shadow-md">{style.icon}</div>
                                        <div className={`relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-2xl ring-4 ${style.ring} ring-offset-4 ring-offset-white dark:ring-offset-gray-950 mb-3`}>
                                            {leader.name.charAt(0).toUpperCase()}
                                        </div>
                                        <h3 className="font-extrabold text-gray-900 dark:text-white text-base md:text-lg text-center leading-tight">{leader.name}</h3>
                                        <p className="text-xs text-gray-500 mb-1 font-medium">{leader.branch}</p>
                                        {/* Grade badge */}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md mb-2 ${grade.bgPill} ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                                        {/* Earned badges */}
                                        {badges.length > 0 && (
                                            <div className="flex gap-0.5 mb-2">
                                                {badges.slice(0, 4).map(b => <span key={b.id} className="text-sm" title={b.name}>{b.icon}</span>)}
                                            </div>
                                        )}
                                        <div className="bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
                                            <p className="text-lg md:text-xl font-black text-ieee-blue dark:text-cyan-400 leading-none">
                                                {leader.points.toLocaleString()} <span className="text-[10px] text-gray-400 capitalize inline-block ml-0.5">pts</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Full Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-5 w-20 text-center">Rank</th>
                                        <th className="px-6 py-5">Volunteer Profile</th>
                                        <th className="px-6 py-5 text-center">Grade</th>
                                        <th className="px-6 py-5 text-center">Badges</th>
                                        <th className="px-6 py-5 text-center">Progress</th>
                                        <th className="px-6 py-5 text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                    {filteredLeaders.map((leader, i) => {
                                        const rank = leaders.indexOf(leader) + 1;
                                        const grade = getGrade(leader.points);
                                        const nextGrade = getNextGrade(leader.points);
                                        const progress = getGradeProgress(leader.points);
                                        const badges = getEarnedBadges(leader);
                                        return (
                                            <motion.tr key={leader.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black transition-colors ${rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 ring-2 ring-yellow-400/50' : rank === 2 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ring-2 ring-gray-400/50' : rank === 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-500 ring-2 ring-amber-500/50' : 'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-cyan-900/30 group-hover:text-ieee-blue dark:group-hover:text-cyan-400'}`}>
                                                            {rank}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grade.bgClass} flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform`}>
                                                            {leader.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white sm:text-base">{leader.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{leader.branch}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-lg ${grade.bgPill} ${grade.textClass} border ${grade.border}`}>
                                                        {grade.icon} {grade.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-0.5">
                                                        {badges.length === 0 ? (
                                                            <span className="text-xs text-gray-400">—</span>
                                                        ) : (
                                                            <>
                                                                {badges.slice(0, 3).map(b => <span key={b.id} className="text-base" title={`${b.name}: ${b.desc}`}>{b.icon}</span>)}
                                                                {badges.length > 3 && <span className="text-xs text-gray-400 font-bold ml-1">+{badges.length - 3}</span>}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full max-w-[120px] mx-auto">
                                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                                            <span>{grade.icon}</span>
                                                            <span>{nextGrade ? nextGrade.icon : '✨'}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progress}%` }}
                                                                transition={{ duration: 1, delay: i * 0.05 }}
                                                                className={`h-full bg-gradient-to-r ${grade.bgClass} rounded-full`}
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-gray-400 mt-0.5 text-center">
                                                            {nextGrade ? `${nextGrade.min - leader.points} pts to ${nextGrade.name}` : 'Max Rank!'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{leader.points.toLocaleString()}</span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
