import { useState, useEffect, useRef } from "react";
import { Award, Share2, CheckCircle, Clock, Calendar, ChevronRight, Copy, Check, Users, Sparkles, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, updateDoc, collection, query, onSnapshot, arrayUnion } from "firebase/firestore";
import Button from "../components/Button";
import { useToast } from "../components/Toast";
import { getGrade, getNextGrade, getGradeProgress, getEarnedBadges, getLockedBadges, BADGES } from "../utils/grades";

export default function VolunteerDashboard() {
    const { user } = useAuth();
    const addToast = useToast();
    const [tasks, setTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [copiedLink, setCopiedLink] = useState(null);
    const [prevPoints, setPrevPoints] = useState(null);
    const [showPointsAnim, setShowPointsAnim] = useState(false);
    const [pointsDelta, setPointsDelta] = useState(0);
    const [displayPoints, setDisplayPoints] = useState(0);
    const autoCompletedRef = useRef(new Set());

    // Fetch User's Tasks
    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "tasks"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tasksData = [];
            snapshot.forEach((doc) => tasksData.push({ id: doc.id, ...doc.data() }));
            setTasks(tasksData.map(t => ({ ...t, status: t.completedBy?.includes(user.uid) ? 'completed' : 'pending' })));
        });
        return unsubscribe;
    }, [user]);

    // Fetch Events for sharing + auto-complete checks
    useEffect(() => {
        const q = query(collection(db, "events"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evts = [];
            snapshot.forEach((doc) => evts.push({ id: doc.id, ...doc.data() }));
            setEvents(evts);
        });
        return unsubscribe;
    }, []);

    // Auto-complete tasks when event target is met
    useEffect(() => {
        if (!user || tasks.length === 0 || events.length === 0) return;

        tasks.forEach(async (task) => {
            // Skip already completed or already auto-completed tasks
            if (task.status === 'completed') return;
            if (autoCompletedRef.current.has(task.id)) return;
            if (!task.eventId || !task.target) return;

            const linkedEvent = events.find(e => e.id === task.eventId);
            if (!linkedEvent) return;

            const currentProgress = linkedEvent.participants || 0;
            const targetMet = currentProgress >= task.target;

            if (targetMet) {
                autoCompletedRef.current.add(task.id);
                try {
                    // Mark task as completed for this user
                    const taskRef = doc(db, "tasks", task.id);
                    await updateDoc(taskRef, { completedBy: arrayUnion(user.uid) });

                    // Award points
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, { points: (user.points || 0) + task.points });

                    addToast(`🎯 Target reached! "${task.title}" auto-completed! +${task.points} pts`, 'success');
                } catch (error) {
                    console.error("Error auto-completing task:", error);
                    autoCompletedRef.current.delete(task.id);
                }
            }
        });
    }, [tasks, events, user]);

    // Live points animation
    const totalPoints = user?.points || 0;

    useEffect(() => {
        if (prevPoints !== null && totalPoints > prevPoints) {
            setPointsDelta(totalPoints - prevPoints);
            setShowPointsAnim(true);
            setTimeout(() => setShowPointsAnim(false), 2000);
        }
        setPrevPoints(totalPoints);
    }, [totalPoints]);

    // Animated counter for points display
    useEffect(() => {
        const target = totalPoints;
        const start = displayPoints;
        if (start === target) return;
        const diff = target - start;
        const steps = Math.min(Math.abs(diff), 30);
        const stepSize = diff / steps;
        let current = start;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            current += stepSize;
            if (step >= steps) {
                current = target;
                clearInterval(timer);
            }
            setDisplayPoints(Math.round(current));
        }, 30);
        return () => clearInterval(timer);
    }, [totalPoints]);

    const grade = getGrade(totalPoints);
    const nextGrade = getNextGrade(totalPoints);
    const progress = getGradeProgress(totalPoints);
    const earnedBadges = getEarnedBadges(user || {});
    const lockedBadges = getLockedBadges(user || {});

    const completeTask = async (taskId, points) => {
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { points: totalPoints + points });
            const taskRef = doc(db, "tasks", taskId);
            await updateDoc(taskRef, { completedBy: arrayUnion(user.uid) });
            addToast(`+${points} points earned! 🎉`, 'success');
        } catch (error) {
            console.error("Error completing task", error);
            addToast('Failed to complete task', 'error');
        }
    };

    const copyLink = async (eventId, eventName) => {
        const url = `${window.location.origin}/event/${eventId}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopiedLink(eventId);
        addToast(`Link copied for "${eventName}"`, 'success');
        setTimeout(() => setCopiedLink(null), 2000);
    };

    // Helper: get task progress from linked event
    const getTaskProgress = (task) => {
        if (!task.eventId || !task.target) return { current: 0, target: 1, pct: 0, met: false };
        const linkedEvent = events.find(e => e.id === task.eventId);
        const current = linkedEvent?.participants || 0;
        const target = task.target || 1;
        return { current, target, pct: Math.min(100, Math.round((current / target) * 100)), met: current >= target };
    };

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 min-h-[calc(100vh-theme(spacing.20))]">
            {/* Profile Header */}
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Background accent */}
                <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${grade.bgClass} opacity-10 blur-3xl`} />

                <div className="flex items-center gap-5 relative z-10">
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${grade.bgClass} shadow-lg flex items-center justify-center text-white text-3xl font-bold`}>
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className={`absolute -bottom-1.5 -right-1.5 ${grade.bgPill} ${grade.textClass} text-[10px] font-black px-2 py-0.5 rounded-lg shadow border-2 border-white dark:border-gray-900`}>
                            {grade.icon} {grade.name}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-ieee-blue dark:text-cyan-400 font-medium text-sm flex items-center gap-2">
                            <span className="uppercase tracking-wider text-[10px] font-black">{user.role}</span> • {user.branch || 'IEEE Branch'}
                        </p>
                        {/* Earned badges inline */}
                        {earnedBadges.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                                {earnedBadges.map(b => (
                                    <span key={b.id} className="text-base cursor-default" title={`${b.name}: ${b.desc}`}>{b.icon}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-80 relative z-10">
                    {/* Points with animation */}
                    <div className="relative flex justify-between items-center mb-2">
                        <span className={`text-xs font-black uppercase tracking-wider ${grade.textClass}`}>{grade.icon} {grade.name}</span>
                        <div className="relative">
                            <span className="text-sm font-black text-ieee-blue dark:text-cyan-400">{displayPoints} pts</span>
                            <AnimatePresence>
                                {showPointsAnim && (
                                    <motion.span
                                        initial={{ opacity: 1, y: 0 }}
                                        animate={{ opacity: 0, y: -30 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute -top-1 right-0 text-green-500 font-black text-sm pointer-events-none"
                                    >
                                        +{pointsDelta}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="w-full h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${grade.bgClass} rounded-full relative`}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                        </motion.div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-right">
                        {nextGrade ? `${nextGrade.min - totalPoints} pts to ${nextGrade.icon} ${nextGrade.name}` : '✨ Max Rank Achieved!'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tasks */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Tasks</h2>
                        <div className="flex gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">{tasks.filter(t => t.status === 'completed').length} Done</span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">{tasks.filter(t => t.status === 'pending').length} Pending</span>
                        </div>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <p className="text-gray-500 font-medium">No active tasks right now. Great job!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task, i) => {
                                const tp = getTaskProgress(task);
                                return (
                                    <motion.div key={task.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                                        <div className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border transition-all ${task.status === 'completed' ? 'border-green-200/50 dark:border-green-900/30 opacity-70 hover:opacity-100' : 'border-gray-100 dark:border-gray-800 border-l-4 border-l-ieee-blue'}`}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                <div className="flex-1 w-full">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.date || 'Anytime'}</span>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <span className="text-[10px] font-bold text-ieee-blue dark:text-cyan-400 uppercase tracking-wider">{task.event || 'General'}</span>
                                                    </div>
                                                    <h3 className={`font-bold text-gray-900 dark:text-white ${task.status === 'completed' ? 'line-through decoration-green-400 text-gray-500' : ''}`}>{task.title}</h3>

                                                    {/* Target progress bar */}
                                                    {task.target && task.eventId && (
                                                        <div className="mt-3 mb-2">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                                                    <Target className="w-3 h-3" /> Target: {tp.current}/{tp.target} {task.targetType || 'registrations'}
                                                                </span>
                                                                <span className={`text-[10px] font-black ${tp.met ? 'text-green-500' : 'text-ieee-blue'}`}>
                                                                    {tp.pct}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${tp.pct}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                    className={`h-full rounded-full ${tp.met ? 'bg-green-500' : 'bg-gradient-to-r from-ieee-blue to-cyan-400'}`}
                                                                />
                                                            </div>
                                                            {tp.met && task.status !== 'completed' && (
                                                                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1 flex items-center gap-1">
                                                                    <Sparkles className="w-3 h-3" /> Target reached! Auto-completing...
                                                                </motion.p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 mt-2">
                                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/20 dark:text-cyan-400 border border-ieee-blue/10">+{task.points} pts</span>
                                                        {task.status === 'completed' ? (
                                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {task.status !== 'completed' && user.role !== 'STUDENT' && !tp.met && (
                                                    <Button onClick={() => completeTask(task.id, task.points)} className="shrink-0 text-sm px-4 py-2 group">
                                                        Complete <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Share Links */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="bg-gradient-to-r from-ieee-blue to-cyan-500 p-5 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Share2 className="w-5 h-5" /> Share & Earn</h3>
                            <p className="text-white/80 text-xs mt-0.5">+10 pts per student registration via your links</p>
                        </div>
                        <div className="p-4 space-y-3">
                            {events.length === 0 ? (
                                <p className="text-sm border p-3 border-gray-100 dark:border-gray-800 rounded-xl text-gray-500 text-center">No active events to share.</p>
                            ) : events.slice(0, 5).map((evt) => (
                                <div key={evt.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-ieee-blue/30 transition group">
                                    <div className="overflow-hidden flex items-center gap-3">
                                        {evt.imageUrl ? (
                                            <img src={evt.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-ieee-blue/10 flex items-center justify-center shrink-0">
                                                <Calendar className="w-4 h-4 text-ieee-blue/40" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{evt.name}</p>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {evt.participants || 0} registered</p>
                                        </div>
                                    </div>
                                    <button onClick={() => copyLink(evt.id, evt.name)} className="p-2 shrink-0 rounded-lg bg-gray-50 dark:bg-gray-800 text-ieee-blue hover:bg-ieee-blue hover:text-white transition">
                                        {copiedLink === evt.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> My Badges</h3>
                            <Link to="/leaderboard" className="text-xs text-ieee-blue font-semibold hover:underline">View Rank</Link>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {BADGES.map((badge) => {
                                const earned = badge.condition(user || {});
                                return (
                                    <div key={badge.id} className={`flex flex-col items-center ${!earned ? 'opacity-30 grayscale' : 'cursor-pointer group'}`} title={`${badge.name}: ${badge.desc}`}>
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-1.5 transition-transform ${earned ? 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 shadow-md group-hover:scale-110 border border-yellow-200/50 dark:border-yellow-800/30' : 'bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600'}`}>
                                            {badge.icon}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-500 text-center leading-tight">{badge.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400">
                                <span className="font-bold text-gray-600 dark:text-gray-300">{earnedBadges.length}</span>/{BADGES.length} badges earned
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
