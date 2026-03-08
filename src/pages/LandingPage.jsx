import { motion, useInView } from "framer-motion";
import { ArrowRight, Users, Calendar, Award, ChevronRight, CheckCircle2, Zap, Share2, BarChart3, Star, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import { db } from "../firebase/config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

function AnimatedCounter({ end, suffix = "", duration = 2 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const target = parseInt(end.replace(/,/g, ''));
        const step = Math.ceil(target / (duration * 60));
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            setCount(current);
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [isInView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
    const [liveEvents, setLiveEvents] = useState([]);

    // Pull real events from Firestore
    useEffect(() => {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const evts = [];
            snapshot.forEach((doc) => evts.push({ id: doc.id, ...doc.data() }));
            setLiveEvents(evts);
        });
        return unsubscribe;
    }, []);

    // Fallback events for when Firestore is empty
    const fallbackEvents = [
        { id: '1', name: "AI & Machine Learning Bootcamp", date: "Oct 15", category: "Workshop", participants: 120, imageUrl: "https://images.unsplash.com/photo-1591453006520-21db4a3904e1?auto=format&fit=crop&w=400&q=80" },
        { id: '2', name: "CyberSecurity CTF Challenge", date: "Nov 02", category: "Competition", participants: 85, imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80" },
        { id: '3', name: "Future of Robotics Seminar", date: "Nov 15", category: "Seminar", participants: 200, imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80" },
    ];

    const upcomingEvents = liveEvents.length > 0 ? liveEvents : fallbackEvents;

    const stats = [
        { value: "5000", suffix: "+", label: "Active Students", icon: Users },
        { value: "200", suffix: "+", label: "Events Hosted", icon: Calendar },
        { value: "50", suffix: "+", label: "Branches Worldwide", icon: Award },
    ];

    const features = [
        "Manage event registrations effortlessly",
        "Track volunteer participation and tasks",
        "Gamified grades, badges & leaderboard",
        "Share event links & earn bonus points"
    ];

    const howItWorks = [
        { step: "01", title: "Create Your Branch", desc: "Admins register their IEEE student branch and invite volunteers.", icon: Zap },
        { step: "02", title: "Launch Events", desc: "Create events with images, auto-generated share links and QR codes.", icon: Calendar },
        { step: "03", title: "Volunteers Share", desc: "Volunteers share links and earn points for every registrant.", icon: Share2 },
        { step: "04", title: "Track & Reward", desc: "Monitor analytics, award badges, and grow participation.", icon: BarChart3 },
    ];

    const testimonials = [
        { name: "Priya Sharma", role: "Branch Chair, IIT Delhi", text: "IEEE Connect transformed how we manage our 500+ member branch. Volunteer engagement jumped 3x in a single semester.", avatar: "P" },
        { name: "James Rodriguez", role: "Volunteer Lead, MIT", text: "The gamification system made volunteering genuinely exciting. Our team competes for the leaderboard every week!", avatar: "J" },
        { name: "Aisha Khan", role: "Event Coordinator, NUS", text: "Setting up events went from hours of spreadsheet work to minutes. The share link tracking is genius.", avatar: "A" },
    ];

    return (
        <div className="flex flex-col items-center overflow-hidden">
            {/* ===== HERO SECTION ===== */}
            <section className="w-full relative min-h-[92vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-ieee-light via-white to-gray-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950 -z-20" />
                <div className="absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-ieee-blue/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute bottom-1/4 left-1/2 w-[450px] h-[450px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400 font-semibold text-sm mb-6 border border-ieee-blue/20">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                v3.0 — Peak Performance
                            </div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.08]">
                                Elevate your<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ieee-blue via-cyan-500 to-blue-400">IEEE Branch</span>
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-xl">
                                The all-in-one platform for student leaders. Streamline events, track volunteer engagement, and reward participation with grades, badges & leaderboards.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <Link to="/auth">
                                    <Button className="px-8 py-4 text-lg w-full sm:w-auto shadow-lg shadow-ieee-blue/20 hover:shadow-xl hover:scale-[1.02] transition-all">
                                        Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link to="/events">
                                    <Button variant="outline" className="px-8 py-4 text-lg w-full sm:w-auto">
                                        View Events
                                    </Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {features.map((f, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{f}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }} className="relative hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-ieee-blue/30 to-cyan-400/30 rounded-3xl transform rotate-2 scale-105 blur-2xl" />
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-gray-700/50">
                                <img src="https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=1200&h=800" alt="Students at IEEE event" className="w-full h-[520px] object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                    <div className="text-white">
                                        <p className="text-sm font-medium opacity-80">Featured Event</p>
                                        <p className="text-xl font-bold">{upcomingEvents[0]?.name || 'AI Workshop 2026'}</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold">
                                        {upcomingEvents[0]?.participants || 120}+ Registered
                                    </div>
                                </div>
                            </div>
                            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="absolute -right-4 top-1/4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl">
                                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Week</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">+142 New</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== ANIMATED STATS ===== */}
            <section className="w-full relative z-10 -mt-16 mb-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 lg:p-12 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 text-center">
                            {stats.map((s, idx) => {
                                const Icon = s.icon;
                                return (
                                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15 }} className="flex flex-col items-center pt-6 md:pt-0">
                                        <div className="mb-3 bg-ieee-blue/10 dark:bg-cyan-900/20 p-3 rounded-2xl">
                                            <Icon className="w-7 h-7 text-ieee-blue dark:text-cyan-400" />
                                        </div>
                                        <h3 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                            <AnimatedCounter end={s.value} suffix={s.suffix} />
                                        </h3>
                                        <p className="text-base text-gray-500 dark:text-gray-400 font-medium mt-1">{s.label}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section className="w-full py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                        <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Simple Setup</p>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">How It Works</h2>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {howItWorks.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative group">
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 h-full hover:border-ieee-blue/30 transition-all hover:shadow-lg">
                                        <div className="text-6xl font-black text-ieee-blue/10 dark:text-cyan-900/30 absolute top-4 right-6">{item.step}</div>
                                        <div className="bg-ieee-blue/10 dark:bg-cyan-900/30 p-3 rounded-xl w-fit mb-6">
                                            <Icon className="w-7 h-7 text-ieee-blue dark:text-cyan-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== UPCOMING EVENTS (LIVE FROM FIRESTORE) ===== */}
            <section className="w-full py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                        <div>
                            <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Don't Miss Out</p>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Upcoming Events</h2>
                        </div>
                        <Link to="/events" className="text-ieee-blue dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                            View All Events <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {upcomingEvents.map((evt, i) => (
                            <motion.div key={evt.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <Link to={`/event/${evt.id}`} className="group block">
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-ieee-blue/30 transition-all hover:shadow-xl">
                                        <div className="relative h-48 overflow-hidden">
                                            {evt.imageUrl ? (
                                                <img src={evt.imageUrl} alt={evt.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                                    <Image className="w-12 h-12 text-ieee-blue/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-bold text-ieee-blue px-3 py-1 rounded-lg">{evt.category || 'Event'}</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors">{evt.name}</h3>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {evt.date}</span>
                                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {evt.participants || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section className="w-full py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                        <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Trusted Worldwide</p>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">What Branch Leaders Say</h2>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-grow italic">"{t.text}"</p>
                                    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white font-bold">{t.avatar}</div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{t.name}</p>
                                            <p className="text-xs text-gray-500">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="w-full py-20 bg-gradient-to-r from-ieee-blue to-cyan-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to transform your IEEE branch?</h2>
                    <p className="text-lg text-white/80 mb-8">Join hundreds of student branches worldwide already using IEEE Volunteer Connect.</p>
                    <Link to="/auth">
                        <button className="bg-white text-ieee-blue hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                            Get Started — It's Free <ChevronRight className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
