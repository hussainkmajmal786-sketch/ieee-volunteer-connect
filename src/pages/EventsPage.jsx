import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Users, Search, Copy, Check, Share2, Image, SlidersHorizontal, Clock, Trophy, Wifi, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { db } from "../lib/backend";
import { collection, query, orderBy, onSnapshot } from "../lib/firestore";
import { useToast } from "../hooks/useToast";
import MetaTags from "../shared/MetaTags";
import PosterImage from "../components/PosterImage";
import { formatEventDate } from "../utils/format";
import { copyText } from "../utils/shortLink";
import { EVENT_CATEGORIES, EVENT_MODES, categoryColor, closesAt, eventTime, registrationState, CLOSED_LABEL, feeLabel } from "../utils/events";

const SORTS = {
    closing: "Closing first",
    soonest: "Starting soonest",
    newest: "Newest added",
    popular: "Most popular",
    name: "Name (A–Z)",
};

/** "Closes in 3 days" / "Closes today" for open events closing within two weeks. */
function closingSoon(event, now) {
    const t = closesAt(event);
    if (t == null || t < now) return null;
    const days = Math.floor((t - now) / 86400000);
    if (days > 14) return null;
    return days === 0 ? "Closes today" : days === 1 ? "Closes tomorrow" : `Closes in ${days} days`;
}

export default function EventsPage() {
    const addToast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("cat") || "All");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [sortBy, setSortBy] = useState(SORTS[searchParams.get("sort")] ? searchParams.get("sort") : "closing");
    const [mode, setMode] = useState(searchParams.get("mode") || "");
    const [price, setPrice] = useState(searchParams.get("price") || "");
    const [showClosed, setShowClosed] = useState(searchParams.get("closed") === "1");
    const [filtersOpen, setFiltersOpen] = useState(!!(searchParams.get("mode") || searchParams.get("price")));
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [now] = useState(() => Date.now());

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

    // Keep URL params in sync with filter state (shareable links!)
    useEffect(() => {
        const next = {};
        if (searchQuery) next.q = searchQuery;
        if (activeTab && activeTab !== "All") next.cat = activeTab;
        if (sortBy !== "closing") next.sort = sortBy;
        if (mode) next.mode = mode;
        if (price) next.price = price;
        if (showClosed) next.closed = "1";
        setSearchParams(next, { replace: true });
    }, [searchQuery, activeTab, sortBy, mode, price, showClosed, setSearchParams]);

    const { visible, closedHidden } = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const matches = allEvents.filter((e) => {
            if (activeTab !== "All" && e.category !== activeTab) return false;
            if (mode && (e.mode || "Offline") !== mode) return false;
            if (price === "free" && Number(e.fee) > 0) return false;
            if (price === "paid" && !(Number(e.fee) > 0)) return false;
            if (!q) return true;
            return [e.name, e.desc, e.venue, e.organizer, e.category, ...(Array.isArray(e.tags) ? e.tags : [])]
                .some(v => typeof v === "string" && v.toLowerCase().includes(q));
        }).map(e => ({ ...e, _state: registrationState(e, now) }));
        const open = matches.filter(e => e._state.open);
        const big = Number.MAX_SAFE_INTEGER;
        const sorters = {
            closing: (a, b) => (closesAt(a) ?? big) - (closesAt(b) ?? big),
            soonest: (a, b) => (eventTime(a.date) ?? big) - (eventTime(b.date) ?? big),
            newest: () => 0, // already newest-added first from the query
            popular: (a, b) => (b.participants || 0) - (a.participants || 0),
            name: (a, b) => (a.name || "").localeCompare(b.name || ""),
        };
        const sorted = [...(showClosed ? matches : open)].sort(sorters[sortBy]);
        // Closed events always go after open ones.
        sorted.sort((a, b) => Number(!a._state.open) - Number(!b._state.open));
        return { visible: sorted, closedHidden: showClosed ? 0 : matches.length - open.length };
    }, [allEvents, activeTab, searchQuery, sortBy, mode, price, showClosed, now]);

    const copyEventLink = async (e, eventId, eventName) => {
        e.preventDefault();
        e.stopPropagation();
        await copyText(`${window.location.origin}/event/${eventId}`);
        setCopiedId(eventId);
        addToast(`Link copied for "${eventName}"`, 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const shareWhatsApp = (e, event) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/event/${event.id}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this IEEE event: ${event.name} — ${url}`)}`, '_blank');
    };

    const clearAll = () => { setSearchQuery(''); setActiveTab('All'); setMode(''); setPrice(''); setSortBy('closing'); };
    const activeFilters = (mode ? 1 : 0) + (price ? 1 : 0);
    const chip = (active) => `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition whitespace-nowrap ${active
        ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'}`;

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 min-h-[calc(100vh-theme(spacing.20))]">
            <MetaTags
                title="Upcoming Events"
                description="Explore hackathons, workshops, tech fests and more hosted by IEEE Student Branch CEK. Register now and enhance your skills."
            />
            <div className="text-center mb-10 max-w-2xl mx-auto">
                <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Browse & Register</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Upcoming Events</h1>
                <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">Hackathons, workshops, tech fests and more — register in one tap.</p>
            </div>

            {/* Search + filters + sort */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search events, organisers, tags…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search events"
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue outline-none transition"
                        />
                    </div>
                    <button type="button" onClick={() => setFiltersOpen(o => !o)} aria-expanded={filtersOpen}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold border transition ${filtersOpen || activeFilters ? 'border-ieee-blue text-ieee-blue bg-ieee-blue/5' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900'}`}>
                        <SlidersHorizontal className="w-4 h-4" /> Filters{activeFilters ? ` · ${activeFilters}` : ''}
                    </button>
                </div>

                <AnimatePresence initial={false}>
                    {filtersOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-x-8 gap-y-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Mode">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Mode</span>
                                    {["", ...EVENT_MODES].map(m => (
                                        <button key={m || 'any'} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={chip(mode === m)}>{m || 'Any'}</button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Price">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Price</span>
                                    {[['', 'Any'], ['free', 'Free'], ['paid', 'Paid']].map(([v, l]) => (
                                        <button key={l} type="button" role="radio" aria-checked={price === v} onClick={() => setPrice(v)} className={chip(price === v)}>{l}</button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event categories">
                    {[{ name: "All" }, ...EVENT_CATEGORIES].map((cat) => (
                        <button key={cat.name} onClick={() => setActiveTab(cat.name)} role="tab" aria-selected={activeTab === cat.name} className={chip(activeTab === cat.name)}>
                            {cat.color && <span className={`w-2.5 h-2.5 rounded-sm ${cat.color}`} aria-hidden="true" />}
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Count · closed toggle · sort */}
            {!loading && (
                <div className="flex flex-wrap items-center justify-between gap-3 py-4 mb-6 border-t-2 border-gray-900 dark:border-gray-200">
                    <p className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {visible.length} event{visible.length !== 1 ? 's' : ''}
                        {(closedHidden > 0 || showClosed) && (
                            <> · <button type="button" onClick={() => setShowClosed(s => !s)} className="underline underline-offset-4 text-gray-500 hover:text-ieee-blue">
                                {showClosed ? 'Hide closed' : `${closedHidden} closed hidden`}
                            </button></>
                        )}
                    </p>
                    <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                        Sort
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort events"
                            className="normal-case tracking-normal font-semibold px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-ieee-blue outline-none">
                            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </label>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Masonry: every card is as tall as its poster */}
            {!loading && (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
                    {visible.map((event, index) => {
                        const st = event._state;
                        const soon = st.open ? closingSoon(event, now) : null;
                        return (
                            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}
                                className="break-inside-avoid mb-6">
                                <Link to={`/event/${event.id}`} className="group block">
                                    <div className={`bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-ieee-blue/30 hover:shadow-xl transition-all ${st.open ? '' : 'opacity-75'}`}>
                                        <div className="relative">
                                            {event.imageUrl ? (
                                                <PosterImage src={event.imageUrl} alt={event.name} maxHeight="max-h-[34rem]" hoverZoom />
                                            ) : (
                                                <div className="w-full aspect-video bg-gradient-to-br from-ieee-blue/20 via-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                                                    <Image className="w-12 h-12 text-ieee-blue/20" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                                <span className="inline-flex items-center gap-1.5 bg-white/95 dark:bg-gray-900/95 text-[11px] font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100 px-2.5 py-1 rounded-lg shadow-sm">
                                                    <span className={`w-2 h-2 rounded-sm ${categoryColor(event.category)}`} aria-hidden="true" />{event.category || 'Event'}
                                                </span>
                                                {!st.open && <span className="bg-gray-900/90 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">{CLOSED_LABEL[st.reason]}</span>}
                                                {soon && <span className="bg-amber-400 text-gray-900 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">{soon}</span>}
                                            </div>
                                            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => copyEventLink(e, event.id, event.name)} aria-label={`Copy link to ${event.name}`}
                                                    className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg hover:bg-ieee-blue hover:text-white transition shadow-sm" title="Copy Link">
                                                    {copiedId === event.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={(e) => shareWhatsApp(e, event)} aria-label={`Share ${event.name} on WhatsApp`}
                                                    className="bg-white/90 dark:bg-gray-900/90 p-2 rounded-lg hover:bg-green-500 hover:text-white transition shadow-sm" title="Share on WhatsApp">
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors line-clamp-2">{event.name}</h3>
                                            {event.organizer && <p className="text-xs font-semibold text-gray-400 mb-2">by {event.organizer}</p>}
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{event.desc || 'No description provided.'}</p>

                                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-ieee-blue shrink-0" />{formatEventDate(event.date)}</div>
                                                <div className="flex items-center gap-2">
                                                    {(event.mode || 'Offline') === 'Online' ? <Wifi className="w-4 h-4 text-ieee-blue shrink-0" /> : <MapPin className="w-4 h-4 text-ieee-blue shrink-0" />}
                                                    <span className="truncate">{(event.mode || 'Offline') === 'Online' ? 'Online' : event.venue}{event.mode === 'Hybrid' ? ' · Hybrid' : ''}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${Number(event.fee) > 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>{feeLabel(event.fee)}</span>
                                                    {event.prize && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Trophy className="w-3 h-3" />{event.prize}</span>}
                                                    {st.open && st.seatsLeft != null && st.seatsLeft <= 20 && <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">{st.seatsLeft} seats left</span>}
                                                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400"><Users className="w-3.5 h-3.5" />{event.participants || 0}</span>
                                                </div>
                                                {event.registrationDeadline && st.open && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3.5 h-3.5 shrink-0" />Register by {formatEventDate(event.registrationDeadline)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!loading && visible.length === 0 && (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                        {closedHidden > 0 ? `No open events match — ${closedHidden} closed ${closedHidden === 1 ? 'is' : 'are'} hidden.` : 'No events match your search.'}
                    </p>
                    <div className="flex justify-center gap-4 mt-3">
                        {closedHidden > 0 && <button onClick={() => setShowClosed(true)} className="text-ieee-blue font-bold hover:underline">Show closed</button>}
                        <button onClick={clearAll} className="inline-flex items-center gap-1 text-ieee-blue font-bold hover:underline"><X className="w-4 h-4" /> Clear filters</button>
                    </div>
                </div>
            )}
        </div>
    );
}
