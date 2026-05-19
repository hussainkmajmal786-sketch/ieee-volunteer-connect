import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, X, Calendar, FolderPlus, Users, BookOpen, AlertTriangle, Sparkles, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isAdminRole } from "../../utils/constants";

export default function QuickActionPanel() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const isAdmin = isAdminRole(user.role);

    const actions = [
        { label: "Browse Events", icon: Calendar, color: "bg-ieee-blue", action: () => navigate("/events") },
        { label: "Find Opportunities", icon: Sparkles, color: "bg-violet-500", action: () => navigate("/opportunities") },
        { label: "Join a Society", icon: Cpu, color: "bg-emerald-500", action: () => navigate("/chapters") },
        { label: "View Projects", icon: FolderPlus, color: "bg-amber-500", action: () => navigate("/projects") },
        { label: "Resources", icon: BookOpen, color: "bg-cyan-500", action: () => navigate("/resources") },
        { label: "Meet Volunteers", icon: Users, color: "bg-pink-500", action: () => navigate("/volunteers") },
        { label: "Contact / Report", icon: AlertTriangle, color: "bg-red-500", action: () => navigate("/contact") },
    ];

    // Admin gets dashboard shortcut at top
    if (isAdmin) {
        actions.unshift({ label: "Admin Dashboard", icon: Calendar, color: "bg-gray-800 dark:bg-white dark:text-gray-900", action: () => navigate("/admin") });
    }

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2"
                    >
                        {actions.map((a, i) => {
                            const Icon = a.icon;
                            return (
                                <motion.div
                                    key={a.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: i * 0.04 }}
                                >
                                    <button
                                        onClick={() => { setOpen(false); a.action(); }}
                                        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all whitespace-nowrap group w-full text-left"
                                    >
                                        <div className={`p-1.5 rounded-lg ${a.color}`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-ieee-blue dark:group-hover:text-cyan-400 transition-colors">{a.label}</span>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all ${open ? "bg-gray-800 dark:bg-gray-600 rotate-45" : "bg-gradient-to-br from-ieee-blue to-cyan-500"}`}
            >
                {open ? <X className="w-6 h-6 -rotate-45" /> : <Plus className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
