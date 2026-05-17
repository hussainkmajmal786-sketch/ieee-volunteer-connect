import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

/**
 * Notification bell — reads the top-level `notifications` collection and the
 * most recent per-event `notifications` subcollection items, surfaces unread
 * counts via localStorage, and presents a dropdown feed.
 */
const READ_KEY = "ieee-vc:lastReadNotifications";

function formatRelative(ts) {
    if (!ts) return "";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [lastRead, setLastRead] = useState(() => {
        const stored = localStorage.getItem(READ_KEY);
        return stored ? parseInt(stored, 10) : 0;
    });
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // Subscribe to notifications (only while authenticated — collection is gated)
    useEffect(() => {
        if (!user) return undefined;
        const qRef = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const unsub = onSnapshot(
            qRef,
            (snap) => {
                const rows = [];
                snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
                setItems(rows);
            },
            (error) => {
                console.error("[NotificationBell] Firestore error:", error.code, error.message);
                setItems([]);
            }
        );
        return unsub;
    }, [user]);

    // Clear the list if the user logs out (derived during render, not in effect)
    const [lastUid, setLastUid] = useState(user?.uid || null);
    if ((user?.uid || null) !== lastUid) {
        setLastUid(user?.uid || null);
        if (!user && items.length > 0) setItems([]);
    }

    const unreadCount = useMemo(() => {
        return items.filter((n) => {
            const ts = n.createdAt?.toDate?.()?.getTime?.() ?? 0;
            return ts > lastRead;
        }).length;
    }, [items, lastRead]);

    const markAllRead = () => {
        const now = Date.now();
        setLastRead(now);
        localStorage.setItem(READ_KEY, String(now));
    };

    if (!user) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => {
                    setOpen((v) => !v);
                    if (!open) markAllRead();
                }}
                className="relative p-2 text-gray-500 hover:text-ieee-blue dark:text-gray-400 dark:hover:text-cyan-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={open}
                aria-haspopup="true"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-ieee-dark"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                        role="dialog"
                        aria-label="Notifications"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                Notifications
                            </h3>
                            <button
                                onClick={markAllRead}
                                className="text-xs font-semibold text-ieee-blue dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                            >
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="p-6 text-center text-sm text-gray-400">
                                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                    No notifications yet.
                                </div>
                            ) : (
                                items.map((n) => {
                                    const ts =
                                        n.createdAt?.toDate?.()?.getTime?.() ?? 0;
                                    const isUnread = ts > lastRead;
                                    return (
                                        <div
                                            key={n.id}
                                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                                                isUnread
                                                    ? "bg-ieee-blue/5 dark:bg-cyan-900/10"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {isUnread && (
                                                    <span
                                                        aria-hidden="true"
                                                        className="mt-1.5 w-2 h-2 rounded-full bg-ieee-blue dark:bg-cyan-400 shrink-0"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {n.title && (
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {n.title}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                        {n.message ||
                                                            n.body ||
                                                            "New update"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                                        {formatRelative(n.createdAt)}
                                                    </p>
                                                </div>
                                                {!isUnread && (
                                                    <Check
                                                        size={12}
                                                        className="text-gray-300 mt-1"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
