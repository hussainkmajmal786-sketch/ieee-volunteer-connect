import { useParams, useLocation } from "react-router-dom";
import { Calendar, MapPin, User, CheckCircle, Copy, Check, Share2, Image, Users, GraduationCap, Phone, Mail, Building2, ArrowLeft, Bell, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { db } from "../firebase/config";
import { doc, collection, addDoc, query, where, getDocs, updateDoc, increment, onSnapshot, orderBy, limit } from "firebase/firestore";
import MetaTags from "../shared/MetaTags";
import { trackingService } from "../services/trackingService";

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        const target = new Date(targetDate).getTime();
        const update = () => {
            const now = Date.now();
            const diff = target - now;
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
                expired: false
            });
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (timeLeft.expired) {
        return (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center shadow-lg">
                <div className="text-3xl font-black mb-1">🎉 Event Has Started!</div>
                <p className="text-green-100 font-medium">The event is happening now</p>
            </motion.div>
        );
    }

    const blocks = [
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-50%,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
            <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Timer className="w-5 h-5 text-violet-200" />
                    <span className="text-sm font-bold text-violet-200 uppercase tracking-wider">Event Starts In</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {blocks.map((b) => (
                        <div key={b.label} className="text-center">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                                <motion.div
                                    key={b.value}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-3xl sm:text-4xl font-black tabular-nums"
                                >
                                    {String(b.value).padStart(2, '0')}
                                </motion.div>
                            </div>
                            <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider mt-1.5 block">{b.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default function EventDetailPage() {
    const { id } = useParams();
    const location = useLocation();
    const referredBy = new URLSearchParams(location.search).get('ref') || null;
    const addToast = useToast();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registered, setRegistered] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [regCount, setRegCount] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', phone: '', college: '', year: '1st Year' });
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotifs, setDismissedNotifs] = useState(new Set());

    // Track page view + referral visit on mount
    useEffect(() => {
        trackingService.track('page_view', { eventId: id });
        if (referredBy) {
            trackingService.track('referral_visit', { eventId: id, refId: referredBy });
        }
    }, [id, referredBy]);

    // Fetch event data from Firestore (real-time for countdown/notification updates)
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "events", id), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setEvent(data);
                // Back-fill eventName on the already-fired page_view via a follow-up track
                trackingService.track('page_view', { eventId: id, eventName: data.name });
            }
            setLoading(false);
        });
        return unsubscribe;
    }, [id]);

    // Listen to registrations count in real-time
    useEffect(() => {
        const q = query(collection(db, "events", id, "registrations"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRegCount(snapshot.size);
        });
        return unsubscribe;
    }, [id]);

    // Listen to notifications for this event
    useEffect(() => {
        const q = query(collection(db, "events", id, "notifications"), orderBy("createdAt", "desc"), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = [];
            snapshot.forEach((doc) => notifs.push({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
        });
        return unsubscribe;
    }, [id]);

    const handleCopyLink = async () => {
        trackingService.track('share_click', { element: 'copy_link', eventId: id, eventName: event?.name });
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            addToast('Event link copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = window.location.href;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            addToast('Event link copied!', 'success');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareWhatsApp = () => {
        trackingService.track('share_click', { element: 'whatsapp', eventId: id, eventName: event?.name });
        const text = `Check out this IEEE event: ${event?.name} — ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleShareTwitter = () => {
        trackingService.track('share_click', { element: 'twitter', eventId: id, eventName: event?.name });
        const text = `I'm attending "${event?.name}" by IEEE! Join me 🚀`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        trackingService.track('register_click', { element: 'register_submit', eventId: id, eventName: event?.name });
        setSubmitting(true);
        try {
            const dupQuery = query(collection(db, "events", id, "registrations"), where("email", "==", form.email));
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
                addToast('You are already registered for this event!', 'warning');
                setSubmitting(false);
                return;
            }

            await addDoc(collection(db, "events", id, "registrations"), {
                ...form,
                registeredAt: new Date(),
                eventId: id,
                ...(referredBy ? { referredBy } : {}),
            });

            const eventRef = doc(db, "events", id);
            await updateDoc(eventRef, {
                participants: increment(1),
                ...(referredBy ? { [`refCounts.${referredBy}`]: increment(1) } : {}),
            });

            setRegistered(true);
            addToast('Successfully registered! 🎉', 'success');
        } catch (err) {
            console.error("Registration error:", err);
            addToast('Registration failed: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const dismissNotif = (notifId) => {
        setDismissedNotifs(prev => new Set([...prev, notifId]));
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h2>
                <p className="text-gray-500 mb-6">This event may have been removed or doesn&apos;t exist.</p>
                <Link to="/events"><Button>Browse Events</Button></Link>
            </div>
        );
    }

    const visibleNotifs = notifications.filter(n => !dismissedNotifs.has(n.id));

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <MetaTags 
                title={event.name} 
                description={event.desc || `Join us for ${event.name} at ${event.venue} on ${event.date}. Register now on IEEE Volunteer Connect.`}
                image={event.imageUrl}
            />
            {/* Back link */}
            <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-ieee-blue dark:hover:text-cyan-400 transition mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>

            {/* Notification Banners */}
            <AnimatePresence>
                {visibleNotifs.map((notif) => (
                    <motion.div key={notif.id} initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4">
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0 mt-0.5">
                                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">📢 Notification</p>
                                <p className="text-amber-700 dark:text-amber-200 text-sm mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-amber-500 mt-1">
                                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Just now'}
                                </p>
                            </div>
                            <button onClick={() => dismissNotif(notif.id)} className="text-amber-400 hover:text-amber-600 transition shrink-0 p-1">
                                ✕
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Countdown Timer */}
            {event.countdownDate && (
                <div className="mb-6">
                    <CountdownTimer targetDate={event.countdownDate} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Banner Image */}
                        <div className="rounded-2xl overflow-hidden mb-6 border border-gray-100 dark:border-gray-800 shadow-lg">
                            {event.imageUrl ? (
                                <img src={event.imageUrl} alt={event.name} className="w-full h-64 sm:h-80 object-cover" />
                            ) : (
                                <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                    <Image className="w-16 h-16 text-ieee-blue/30" />
                                </div>
                            )}
                        </div>

                        {/* Event Info */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1.5 bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                                {event.category || 'Event'}
                            </span>
                            <span className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3" /> {regCount} Registered
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                            {event.name}
                        </h1>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                    <Calendar className="w-5 h-5 text-ieee-blue dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{event.date}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                    <MapPin className="w-5 h-5 text-ieee-blue dark:text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue</p>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{event.venue}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About This Event</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {event.desc || 'No description provided for this event.'}
                            </p>
                        </div>

                        {/* Share Section */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-ieee-blue" /> Share This Event
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={handleCopyLink}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-ieee-blue hover:text-white border border-gray-200 dark:border-gray-600'}`}>
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Link Copied!' : 'Copy Link'}
                                </button>
                                <button onClick={handleShareWhatsApp}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-green-500 text-white hover:bg-green-600 transition">
                                    📱 WhatsApp
                                </button>
                                <button onClick={handleShareTwitter}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-gray-900 dark:bg-gray-600 text-white hover:bg-gray-800 transition">
                                    𝕏 Twitter / X
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Registration Sidebar */}
                <div className="lg:col-span-2">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="sticky top-24">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl">
                            <div className="bg-gradient-to-r from-ieee-blue to-cyan-500 p-5 text-white">
                                <h3 className="text-lg font-bold">Register for this Event</h3>
                                <p className="text-white/80 text-xs mt-1">Fill in your details below to secure your spot</p>
                            </div>

                            <AnimatePresence mode="wait">
                                {registered ? (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You&apos;re Registered!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">We look forward to seeing you at <span className="font-semibold text-gray-700 dark:text-gray-300">{event.name}</span>.</p>
                                        <p className="text-xs text-gray-400">Share this event with your friends!</p>
                                        <button onClick={handleCopyLink} className="mt-4 flex items-center justify-center gap-2 mx-auto px-6 py-2 rounded-xl text-sm font-semibold bg-ieee-blue/10 text-ieee-blue hover:bg-ieee-blue hover:text-white transition">
                                            <Copy className="w-4 h-4" /> Copy Event Link
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleRegister} className="p-5 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                <User className="w-3 h-3 inline mr-1" /> Full Name
                                            </label>
                                            <input type="text" placeholder="John Doe" value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                <Mail className="w-3 h-3 inline mr-1" /> Email
                                            </label>
                                            <input type="email" placeholder="john@example.com" value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                <Phone className="w-3 h-3 inline mr-1" /> Phone Number
                                            </label>
                                            <input type="tel" placeholder="+91 9876543210" value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                <Building2 className="w-3 h-3 inline mr-1" /> College / University
                                            </label>
                                            <input type="text" placeholder="MIT, Stanford, etc." value={form.college}
                                                onChange={(e) => setForm({ ...form, college: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                <GraduationCap className="w-3 h-3 inline mr-1" /> Year of Study
                                            </label>
                                            <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-ieee-blue outline-none">
                                                <option>1st Year</option>
                                                <option>2nd Year</option>
                                                <option>3rd Year</option>
                                                <option>4th Year</option>
                                                <option>Postgraduate</option>
                                            </select>
                                        </div>
                                        <Button type="submit" isLoading={submitting} className="w-full py-3 text-base shadow-lg hover:shadow-xl">
                                            Register Now
                                        </Button>
                                        <p className="text-[10px] text-gray-400 text-center">By registering, you agree to receive event updates via email.</p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
