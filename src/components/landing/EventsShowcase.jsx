import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, Radio, ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { eventService } from "../../services/eventService";
import OptimizedImage from "../../shared/OptimizedImage";
import { EventCardSkeleton } from "../../shared/Skeleton";

function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0 });

    useEffect(() => {
        const update = () => {
            const diff = new Date(targetDate) - new Date();
            if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, mins: 0 }); return; }
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                mins: Math.floor((diff % 3600000) / 60000),
            });
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [targetDate]);

    return (
        <div className="flex gap-2">
            {[
                { v: timeLeft.days, l: "d" },
                { v: timeLeft.hours, l: "h" },
                { v: timeLeft.mins, l: "m" },
            ].map(({ v, l }) => (
                <div key={l} className="bg-ieee-blue/10 dark:bg-cyan-900/30 px-2 py-1 rounded-lg text-center min-w-[36px]">
                    <span className="text-sm font-black text-ieee-blue dark:text-cyan-400">{v}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase ml-0.5">{l}</span>
                </div>
            ))}
        </div>
    );
}

export default function EventsShowcase() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = eventService.subscribeToEvents((evts) => {
            setEvents(evts);
            setLoading(false);
        }, 6);
        return unsub;
    }, []);

    const fallback = !loading && events.length === 0 ? [
        { id: "f1", name: "AI & Machine Learning Bootcamp", date: "Jun 15, 2026", category: "Workshop", participants: 120, venue: "Main Auditorium", imageUrl: "https://images.unsplash.com/photo-1591453006520-21db4a3904e1?auto=format&fit=crop&w=400&q=80", isLive: true },
        { id: "f2", name: "CyberSecurity CTF Challenge", date: "Jul 02, 2026", category: "Competition", participants: 85, venue: "CS Lab", imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80" },
        { id: "f3", name: "Future of Robotics Seminar", date: "Jul 15, 2026", category: "Seminar", participants: 200, venue: "Online", imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80" },
        { id: "f4", name: "IEEE Innovation Hackathon", date: "Aug 01, 2026", category: "Hackathon", participants: 300, venue: "Innovation Hub", imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80" },
        { id: "f5", name: "IoT Workshop Series", date: "Aug 20, 2026", category: "Workshop", participants: 60, venue: "Electronics Lab", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80" },
        { id: "f6", name: "Women in Engineering Summit", date: "Sep 10, 2026", category: "Conference", participants: 250, venue: "Main Auditorium", imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=400&q=80" },
    ] : [];

    const displayEvents = events.length > 0 ? events : fallback;

    return (
        <section id="upcoming-events" className="w-full py-14 sm:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                    <div>
                        <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Don&apos;t Miss Out</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Upcoming Events</h2>
                    </div>
                    <Link to="/events" className="text-ieee-blue dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                        View All Events <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => <EventCardSkeleton key={i} />)
                    ) : displayEvents.length > 0 ? (
                        displayEvents.map((evt, i) => (
                            <motion.div key={evt.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                                <Link to={`/event/${evt.id}`} className="group block">
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-ieee-blue/30 transition-all hover:shadow-xl">
                                        <div className="relative h-48 overflow-hidden">
                                            {evt.imageUrl ? (
                                                <OptimizedImage src={evt.imageUrl} alt={evt.name} containerClassName="h-48" className="w-full h-full object-cover group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                                    <Calendar className="w-12 h-12 text-ieee-blue/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex items-center gap-2">
                                                <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-bold text-ieee-blue px-3 py-1 rounded-lg">{evt.category || "Event"}</span>
                                                {evt.isLive && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                                                        <Radio className="w-3 h-3" /> LIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors line-clamp-1">{evt.name}</h3>
                                            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{evt.date}</span>
                                                {evt.venue && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{evt.venue}</span>}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Countdown targetDate={evt.date} />
                                                <span className="text-xs font-semibold text-gray-400">{evt.participants || 0} registered</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-500">No upcoming events found.</div>
                    )}
                </div>
            </div>
        </section>
    );
}
