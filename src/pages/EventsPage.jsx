import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Search, Copy, Check, Share2, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useToast } from "../components/Toast";

export default function EventsPage() {
    const addToast = useToast();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = [];
            snapshot.forEach((doc) => eventsData.push({ id: doc.id, ...doc.data() }));
            setAllEvents(eventsData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const categories = ['All', 'Workshop', 'Competition', 'Seminar', 'Hackathon', 'Meetup'];

    const filteredEvents = allEvents.filter(e => {
        const matchesTab = activeTab === 'All' || e.category === activeTab;
        const matchesSearch = e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.desc?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const copyEventLink = async (e, eventId, eventName) => {
        e.preventDefault();
        e.stopPropagation();
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
        setCopiedId(eventId);
        addToast(`Link copied for "${eventName}"`, 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const shareWhatsApp = (e, event) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/event/${event.id}`;
        const text = `Check out this IEEE event: ${event.name} — ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 min-h-[calc(100vh-theme(spacing.20))]">
            <div className="text-center mb-12 max-w-2xl mx-auto">
                <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Browse & Register</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Upcoming Events</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">Find workshops, hackathons, and seminars to advance your skills.</p>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none transition" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {categories.map((cat) => (
                        <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === cat ? 'bg-ieee-blue text-white shadow-lg' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-ieee-blue/30'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            {!loading && <p className="text-sm text-gray-500 mb-6">{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found</p>}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Events Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => (
                        <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Link to={`/event/${event.id}`} className="group block h-full">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-full flex flex-col hover:border-ieee-blue/30 hover:shadow-xl transition-all">
                                    {/* Image or Gradient Fallback */}
                                    <div className="relative h-48 overflow-hidden">
                                        {event.imageUrl ? (
                                            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                                <Image className="w-12 h-12 text-ieee-blue/20" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-bold text-ieee-blue px-3 py-1 rounded-lg">{event.category || 'Event'}</span>
                                        </div>
                                        {/* Share buttons overlay */}
                                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => copyEventLink(e, event.id, event.name)}
                                                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg hover:bg-ieee-blue hover:text-white transition shadow-sm" title="Copy Link">
                                                {copiedId === event.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={(e) => shareWhatsApp(e, event)}
                                                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg hover:bg-green-500 hover:text-white transition shadow-sm" title="Share on WhatsApp">
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors line-clamp-2">{event.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">{event.desc || 'No description provided.'}</p>

                                        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-ieee-blue" />{event.date}</div>
                                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md text-xs"><Users className="w-3.5 h-3.5 text-ieee-blue" />{event.participants || 0} RSVPs</div>
                                            </div>
                                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-ieee-blue" />{event.venue}</div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && filteredEvents.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No events match your search criteria.</p>
                    <button onClick={() => { setSearchQuery(''); setActiveTab('All'); }} className="text-ieee-blue font-bold mt-3 hover:underline">Clear filters</button>
                </div>
            )}
        </div>
    );
}
