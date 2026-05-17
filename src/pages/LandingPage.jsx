import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Users, Calendar, Award, ChevronRight, CheckCircle2, Zap, Share2, BarChart3, Star, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/constants";
import OptimizedImage from "../shared/OptimizedImage";
import MetaTags from "../shared/MetaTags";
import { EventCardSkeleton } from "../shared/Skeleton";
import { eventService } from "../services/eventService";
import Hero3D from "../components/Hero3D";

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
    const { user } = useAuth();
    const [liveEvents, setLiveEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const containerRef = useRef(null);
    useScroll({ target: containerRef, offset: ["start start", "end end"] });
    const heroY = useTransform(useScroll().scrollY, [0, 600], [0, -120]);
    const heroScale = useTransform(useScroll().scrollY, [0, 600], [1, 1.05]);
    const mockupRotateX = useTransform(useScroll().scrollY, [0, 400], [0, 8]);
    const mockupY = useTransform(useScroll().scrollY, [0, 500], [0, 60]);
    const springConfig = { stiffness: 100, damping: 30 };
    const heroYSpring = useSpring(heroY, springConfig);
    const dashPath = user ? (isAdminRole(user.role) ? '/admin' : '/volunteer') : '/auth';

    // Pull real events from Firestore using eventService
    useEffect(() => {
        const unsubscribe = eventService.subscribeToEvents((evts) => {
            setLiveEvents(evts);
            setLoadingEvents(false);
        }, 3);
        return unsubscribe;
    }, []);

    // Fallback events for when Firestore is empty (only show if not loading)
    const fallbackEvents = !loadingEvents && liveEvents.length === 0 ? [
        { id: '1', name: "AI & Machine Learning Bootcamp", date: "Oct 15", category: "Workshop", participants: 120, imageUrl: "https://images.unsplash.com/photo-1591453006520-21db4a3904e1?auto=format&fit=crop&w=400&q=80" },
        { id: '2', name: "CyberSecurity CTF Challenge", date: "Nov 02", category: "Competition", participants: 85, imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80" },
        { id: '3', name: "Future of Robotics Seminar", date: "Nov 15", category: "Seminar", participants: 200, imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80" },
    ] : [];

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
        <div ref={containerRef} className="flex flex-col items-center overflow-hidden">
            <MetaTags
                title="Connect, Collaborate, and Lead"
                description="The volunteer connect platform of IEEE Student Branch, College of Engineering Kidangoor. Manage events, track contributions, and grow together."
            />
            {/* ===== HERO SECTION ===== */}
            <section className="w-full relative min-h-[80vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-ieee-light via-white to-gray-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950 -z-20" />
                <motion.div style={{ y: heroYSpring, scale: heroScale }} className="absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-ieee-blue/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute bottom-1/4 left-1/2 w-[450px] h-[450px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: '4s' }} />
                </motion.div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <motion.div style={{ y: heroYSpring }} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400 font-semibold text-sm mb-6 border border-ieee-blue/20">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                IEEE Student Branch • CEK
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-[1.08] break-words">
                                Welcome to<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ieee-blue via-cyan-500 to-blue-400">IEEE VC CEK</span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-xl">
                                The volunteer connect platform of <strong>IEEE Student Branch, College of Engineering Kidangoor</strong>. Manage events, track contributions, and grow together.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12">
                                <Link to={dashPath} className="w-full sm:w-auto">
                                    <Button className="px-8 py-4 text-lg w-full sm:w-auto shadow-lg shadow-ieee-blue/20 hover:shadow-xl hover:scale-[1.02] transition-all">
                                        {user ? "Go to Dashboard" : "Join Now"} <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link to="/events" className="w-full sm:w-auto">
                                    <Button variant="outline" className="px-8 py-4 text-lg w-full sm:w-auto">
                                        Explore Events
                                    </Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {features.map((f, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{f}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 3D Animated Hero Scene */}
                        <motion.div
                            style={{ y: mockupY }}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.9, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            <Hero3D />
                        </motion.div>

                        {/* Legacy Dashboard Preview Mockup — kept for reference, hidden */}
                        <motion.div
                            style={{ y: mockupY, rotateX: mockupRotateX, transformPerspective: 1200 }}
                            initial={{ opacity: 0, scale: 0.92, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.2 }}
                            className="relative hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-ieee-blue/20 to-cyan-400/20 rounded-3xl transform rotate-1 scale-105 blur-2xl" />
                            <motion.div
                                whileHover={{ rotateY: -4, rotateX: 4, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                                className="relative rounded-3xl overflow-hidden shadow-2xl shadow-ieee-blue/10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                            >
                                {/* Fake Window Chrome */}
                                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <div className="px-4 py-1 bg-white dark:bg-gray-900 rounded-lg text-[10px] font-semibold text-gray-400 border border-gray-200 dark:border-gray-700">ieee-connect.web.app/dashboard</div>
                                    </div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-6 space-y-4">
                                    {/* Mini Stats Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: "Total Events", value: "24", color: "from-ieee-blue to-cyan-500" },
                                            { label: "Volunteers", value: "156", color: "from-emerald-500 to-green-400" },
                                            { label: "Points Earned", value: "8,420", color: "from-violet-500 to-purple-400" },
                                        ].map((stat, i) => (
                                            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.15 }} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                                <p className={`text-xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Mini Leaderboard */}
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <Award className="w-3.5 h-3.5 text-amber-500" /> Top Volunteers
                                        </p>
                                        <div className="space-y-2.5">
                                            {[
                                                { name: "Priya S.", pts: 2400, pct: 100, color: "from-amber-400 to-yellow-300" },
                                                { name: "James R.", pts: 1850, pct: 77, color: "from-ieee-blue to-cyan-400" },
                                                { name: "Aisha K.", pts: 1200, pct: 50, color: "from-violet-500 to-purple-400" },
                                            ].map((user, i) => (
                                                <div key={user.name} className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{user.name}</span>
                                                            <span className="text-[10px] font-black text-ieee-blue dark:text-cyan-400">{user.pts} pts</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${user.pct}%` }}
                                                                transition={{ duration: 1.2, delay: 1.2 + i * 0.2 }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${user.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Floating Badge: Volunteers Active */}
                            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }} className="absolute -right-4 top-12 bg-white dark:bg-gray-800 p-3 px-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                <div className="bg-green-100 dark:bg-green-900/40 p-2.5 rounded-xl">
                                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active</p>
                                </div>
                            </motion.div>

                            {/* Floating Badge: Leaderboard Live */}
                            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }} className="absolute -left-4 bottom-16 bg-white dark:bg-gray-800 p-3 px-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 animate-float">
                                <div className="bg-ieee-blue/10 dark:bg-ieee-blue/20 p-2.5 rounded-xl">
                                    <Star className="w-5 h-5 text-ieee-blue dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Leaderboard</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">Live 🔥</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== ANIMATED STATS ===== */}
            <section className="w-full relative z-10 -mt-8 md:-mt-16 mb-16 md:mb-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 text-center" style={{ perspective: "800px" }}>
                            {stats.map((s, idx) => {
                                const Icon = s.icon;
                                return (
                                    <motion.div key={idx} initial={{ opacity: 0, rotateX: -25, y: 20 }} whileInView={{ opacity: 1, rotateX: 0, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.15, type: "spring", stiffness: 150, damping: 18 }} className="flex flex-col items-center pt-6 md:pt-0">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" style={{ perspective: "1000px" }}>
                        {howItWorks.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, rotateX: -20, y: 40 }}
                                    whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                                    whileHover={{ rotateY: 6, rotateX: -4, scale: 1.03, z: 20 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                                    style={{ transformStyle: "preserve-3d" }}
                                    className="relative group cursor-default"
                                >
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
                            <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Don&apos;t Miss Out</p>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Upcoming Events</h2>
                        </div>
                        <Link to="/events" className="text-ieee-blue dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                            View All Events <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {loadingEvents ? (
                            Array(3).fill(0).map((_, i) => <EventCardSkeleton key={i} />)
                        ) : upcomingEvents.length > 0 ? (
                            upcomingEvents.map((evt, i) => (
                                <motion.div key={evt.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                    <Link to={`/event/${evt.id}`} className="group block">
                                        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-ieee-blue/30 transition-all hover:shadow-xl">
                                            <div className="relative h-48 overflow-hidden">
                                                {evt.imageUrl ? (
                                                    <OptimizedImage 
                                                        src={evt.imageUrl} 
                                                        alt={evt.name} 
                                                        containerClassName="h-48"
                                                        className="w-full h-full object-cover group-hover:scale-110" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                                        <ImageIcon className="w-12 h-12 text-ieee-blue/20" />
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
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                No upcoming events found.
                            </div>
                        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ perspective: "1200px" }}>
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, rotateY: -15, y: 30 }}
                                whileInView={{ opacity: 1, rotateY: 0, y: 0 }}
                                whileHover={{ rotateY: 4, scale: 1.02, z: 10 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, type: "spring", stiffness: 180, damping: 22 }}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed flex-grow italic">&quot;{t.text}&quot;</p>
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
                    <Link to={dashPath}>
                        <motion.button
                            whileHover={{ scale: 1.06, rotateX: -4 }}
                            whileTap={{ scale: 0.97 }}
                            style={{ transformPerspective: 600 }}
                            className="bg-white text-ieee-blue hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg shadow-xl transition-colors flex items-center gap-2 mx-auto"
                        >
                            {user ? "Back to Dashboard" : "Get Started — It's Free"} <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
