import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick, Globe, TrendingUp, Users, Activity, ExternalLink, CalendarDays } from "lucide-react";
import { trackingService } from "../../services/trackingService";

const SOURCE_META = {
    direct:    { dot: 'bg-gray-500',    bar: 'bg-gray-400',       text: 'text-gray-500 dark:text-gray-400' },
    google:    { dot: 'bg-blue-500',    bar: 'bg-blue-500',       text: 'text-blue-600 dark:text-blue-400' },
    whatsapp:  { dot: 'bg-green-500',   bar: 'bg-green-500',      text: 'text-green-600 dark:text-green-400' },
    twitter:   { dot: 'bg-sky-500',     bar: 'bg-sky-500',        text: 'text-sky-600 dark:text-sky-400' },
    instagram: { dot: 'bg-pink-500',    bar: 'bg-pink-500',       text: 'text-pink-600 dark:text-pink-400' },
    facebook:  { dot: 'bg-blue-600',    bar: 'bg-blue-600',       text: 'text-blue-700 dark:text-blue-300' },
    linkedin:  { dot: 'bg-blue-700',    bar: 'bg-blue-700',       text: 'text-blue-800 dark:text-blue-200' },
    telegram:  { dot: 'bg-cyan-500',    bar: 'bg-cyan-500',       text: 'text-cyan-600 dark:text-cyan-400' },
};

function sourceMeta(source) {
    return SOURCE_META[source] || { dot: 'bg-violet-500', bar: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' };
}

const TYPE_LABEL = {
    page_view:      'Page View',
    referral_visit: 'Referral Visit',
    click:          'Click',
    share_click:    'Share',
    register_click: 'Register',
    cta_click:      'CTA Click',
};

const GRAD_COLORS = [
    'from-ieee-blue to-cyan-400',
    'from-violet-500 to-purple-400',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
    'from-pink-500 to-rose-400',
    'from-sky-500 to-blue-400',
];

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function LinkTrackingPanel({ volunteers = [], events = [] }) {
    const [liveClicks, setLiveClicks] = useState([]);
    const [historicalClicks, setHistoricalClicks] = useState([]);
    const [totalTracked, setTotalTracked] = useState(0);
    const [timeRange, setTimeRange] = useState(7); // default 7 days
    const [loadingLive, setLoadingLive] = useState(true);


    useEffect(() => {
        const unsub = trackingService.subscribeToClicks((data) => {
            setLiveClicks(data);
            setLoadingLive(false);
        });
        return unsub;
    }, []);

    // Track the timeRange that was last fetched so we can derive loading state
    const [fetchedRange, setFetchedRange] = useState(null);
    // Derive loading: true whenever timeRange !== the last successfully fetched range
    const isHistoricalLoading = fetchedRange !== timeRange;

    useEffect(() => {
        let cancelled = false;
        trackingService.getClickStats(timeRange).then(res => {
            if (cancelled) return;
            setTotalTracked(res.totalTracked);
            setHistoricalClicks(res.data);
            setFetchedRange(timeRange);
        });
        return () => { cancelled = true; };
    }, [timeRange]);

    const today = useMemo(() => todayStr(), []);

    const stats = useMemo(() => {
        const todayClicks = historicalClicks.filter(c => {
            const ts = c.timestamp?.toDate?.();
            if (!ts) return false;
            const ds = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
            return ds === today;
        });
        return {
            total: timeRange === 0 ? totalTracked : historicalClicks.length, // Display grand total or period total based on selection
            today: todayClicks.length,
            uniqueSessions: new Set(historicalClicks.map(c => c.sessionId).filter(Boolean)).size,
            referralVisits: historicalClicks.filter(c => c.refId).length,
        };
    }, [historicalClicks, totalTracked, timeRange, today]);

    const sourceBreakdown = useMemo(() => {
        const counts = {};
        historicalClicks.forEach(c => { const s = c.source || 'direct'; counts[s] = (counts[s] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    }, [historicalClicks]);

    const topEvents = useMemo(() => {
        const counts = {};
        const names = {};
        historicalClicks.forEach(c => {
            if (!c.eventId) return;
            counts[c.eventId] = (counts[c.eventId] || 0) + 1;
            if (c.eventName) names[c.eventId] = c.eventName;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]).slice(0, 6)
            .map(([id, count]) => ({
                id, count,
                name: names[id] || events.find(e => e.id === id)?.name || 'Unknown Event',
            }));
    }, [historicalClicks, events]);

    const volunteerReferrals = useMemo(() => {
        const counts = {};
        historicalClicks.forEach(c => { if (c.refId) counts[c.refId] = (counts[c.refId] || 0) + 1; });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1]).slice(0, 8)
            .map(([uid, count]) => ({
                uid, count,
                name: volunteers.find(v => v.id === uid || v.uid === uid)?.name || 'Unknown',
            }));
    }, [historicalClicks, volunteers]);

    const maxSource = sourceBreakdown[0]?.[1] || 1;
    const maxEvent  = topEvents[0]?.count || 1;
    const maxRef    = volunteerReferrals[0]?.count || 1;

    if (loadingLive && isHistoricalLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Loading Overlay for Data Fetching */}
            <AnimatePresence>
                {isHistoricalLoading && !loadingLive && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"
                    >
                        <div className="w-6 h-6 border-2 border-ieee-blue border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panel header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MousePointerClick className="w-5 h-5 text-ieee-blue" /> Link & Traffic Tracking
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Real-time insights — where visitors come from and what they click
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="relative flex items-center">
                        <CalendarDays className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(Number(e.target.value))}
                            className="pl-8 pr-3 py-1.5 bg-transparent text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none cursor-pointer appearance-none min-w-[120px]"
                        >
                            <option value={1}>Today</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={0}>All Time</option>
                        </select>
                    </div>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-[pulse_1.5s_ease-in-out_infinite]" /> Live
                    </span>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: timeRange === 0 ? 'Grand Total' : 'Total in Period', value: stats.total, icon: MousePointerClick, grad: 'from-ieee-blue to-cyan-500', desc: timeRange === 0 ? 'All tracked events' : 'Filtered total' },
                    { label: 'Today',            value: stats.today,          icon: Activity,          grad: 'from-emerald-500 to-teal-400',  desc: "Today's activity" },
                    { label: 'Referral Clicks',  value: stats.referralVisits, icon: Users,             grad: 'from-violet-500 to-purple-400', desc: 'Via volunteer links' },
                    { label: 'Unique Sessions',  value: stats.uniqueSessions, icon: Globe,             grad: 'from-amber-500 to-orange-400',  desc: 'Distinct visitors' },
                ].map((s, i) => (
                    <motion.div key={s.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
                    >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-3 shadow-sm`}>
                            <s.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value.toLocaleString()}</p>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* Sources + Top Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic sources */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <Globe className="w-4 h-4 text-ieee-blue" /> Traffic Sources
                        <span className="ml-auto text-[10px] font-semibold text-gray-400">where visitors come from</span>
                    </h3>
                    {sourceBreakdown.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400 italic">No data yet — tracking begins on first visit</p>
                    ) : (
                        <div className="space-y-3">
                            {sourceBreakdown.map(([source, count]) => {
                                const pct = Math.round((count / maxSource) * 100);
                                const m = sourceMeta(source);
                                return (
                                    <div key={source}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.dot}`} />
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">{source}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black ${m.text}`}>{pct}%</span>
                                                <span className="text-xs font-bold text-gray-400 w-6 text-right">{count}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                className={`h-full rounded-full ${m.bar}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top events */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Events by Traffic
                        <span className="ml-auto text-[10px] font-semibold text-gray-400">most visited</span>
                    </h3>
                    {topEvents.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400 italic">No event traffic tracked yet</p>
                    ) : (
                        <div className="space-y-3">
                            {topEvents.map((evt, i) => {
                                const pct = Math.round((evt.count / maxEvent) * 100);
                                return (
                                    <div key={evt.id}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xs font-black text-gray-300 dark:text-gray-600 w-4 shrink-0">#{i + 1}</span>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{evt.name}</span>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 shrink-0 ml-2">{evt.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Volunteer referral leaderboard + Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Referral leaderboard */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <Users className="w-4 h-4 text-violet-500" /> Volunteer Referral Traffic
                        <span className="ml-auto text-[10px] font-semibold text-gray-400">link clicks per volunteer</span>
                    </h3>
                    {volunteerReferrals.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400 italic">No referral clicks yet</p>
                    ) : (
                        <div className="space-y-3">
                            {volunteerReferrals.map((ref, i) => {
                                const pct = Math.round((ref.count / maxRef) * 100);
                                const grad = GRAD_COLORS[i % GRAD_COLORS.length];
                                return (
                                    <div key={ref.uid} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                                            {ref.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{ref.name}</span>
                                                <span className="text-xs font-black text-gray-400 shrink-0 ml-2">{ref.count} clicks</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                                                    className={`h-full rounded-full bg-gradient-to-r ${grad}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Live activity feed */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                        <Activity className="w-4 h-4 text-amber-500" /> Recent Activity
                        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-green-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
                        </span>
                    </h3>
                    {liveClicks.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400 italic">No activity yet</p>
                    ) : (
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {liveClicks.map((click, i) => {
                                const ts = click.timestamp?.toDate?.();
                                const time = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
                                const date = ts ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                                const m = sourceMeta(click.source);
                                const label = TYPE_LABEL[click.eventType] || click.eventType || 'Event';
                                return (
                                    <motion.div
                                        key={click.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                    >
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</span>
                                                {click.element && (
                                                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">{click.element}</span>
                                                )}
                                                {click.eventName && (
                                                    <span className="text-[10px] text-ieee-blue dark:text-cyan-400 font-medium truncate max-w-[110px]">{click.eventName}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`text-[10px] font-semibold capitalize ${m.text}`}>{click.source || 'direct'}</span>
                                                <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                                                <span className="text-[10px] text-gray-400">{click.device}</span>
                                                {click.refId && (
                                                    <>
                                                        <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                                                        <span className="text-[10px] font-semibold text-violet-500 flex items-center gap-0.5">
                                                            <ExternalLink className="w-2.5 h-2.5" /> ref
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold text-gray-400">{time}</p>
                                            <p className="text-[10px] text-gray-300 dark:text-gray-600">{date}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
