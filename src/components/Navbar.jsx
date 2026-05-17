import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut, User, ChevronDown, LayoutDashboard, Shield } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/constants";
import NotificationBell from "./NotificationBell";
import InstallPWAButton from "./InstallPWAButton";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const profileRef = useRef(null);

    // Scroll-aware navbar — becomes more opaque + has shadow on scroll
    const handleScroll = useCallback(() => {
        setScrolled(window.scrollY > 20);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Close mobile menu + profile dropdown on route change — derived from
    // location.pathname during render to avoid the set-state-in-effect rule.
    const [lastPath, setLastPath] = useState(location.pathname);
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname);
        setIsOpen(false);
        setProfileOpen(false);
    }

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        { name: "Leaderboard", path: "/leaderboard" },
    ];

    if (user) {
        navLinks.push({
            name: "Dashboard",
            path: isAdminRole(user.role) ? "/admin" : "/volunteer"
        });
    }

    const isActive = (path) => location.pathname === path;

    // User initial for avatar
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';

    const handleSignOut = async () => {
        setProfileOpen(false);
        await logout();
        navigate('/auth');
    };

    return (
        <nav
            role="navigation"
            aria-label="Main navigation"
            className={`fixed w-full z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 dark:bg-ieee-dark/95 backdrop-blur-xl shadow-lg shadow-black/[0.03] dark:shadow-black/20 border-b border-gray-200/80 dark:border-gray-800/80'
                    : 'bg-white/80 dark:bg-ieee-dark/80 backdrop-blur-lg border-b border-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-18">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group" aria-label="IEEE Volunteer Connect Home">
                        <div className="bg-gradient-to-br from-ieee-blue to-[#004e7c] px-2.5 py-1.5 rounded-xl group-hover:shadow-lg group-hover:shadow-ieee-blue/20 transition-all duration-300">
                            <span className="text-white font-black text-[11px] leading-none block tracking-tight">IEEE</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                                Volunteer <span className="text-ieee-blue dark:text-cyan-400">Connect</span>
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-widest uppercase leading-tight">SB CEK</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`relative px-4 py-2 text-sm font-semibold transition-colors rounded-xl ${
                                    isActive(link.path)
                                        ? 'text-ieee-blue dark:text-cyan-400'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-ieee-blue dark:hover:text-cyan-400'
                                }`}
                            >
                                {link.name}
                                {isActive(link.path) && (
                                    <motion.div
                                        layoutId="activeNavIndicator"
                                        className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-ieee-blue dark:bg-cyan-400 rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}

                        <div className="flex items-center gap-2 pl-4 ml-4 border-l border-gray-200 dark:border-gray-700">
                            <InstallPWAButton />
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 hover:text-ieee-blue dark:text-gray-400 dark:hover:text-cyan-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <NotificationBell />
                            {user ? (
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200 ${
                                            profileOpen
                                                ? 'bg-gray-100 dark:bg-gray-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                        aria-label="Open profile menu"
                                        aria-expanded={profileOpen}
                                        aria-haspopup="true"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {userInitial}
                                        </div>
                                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Profile Dropdown Menu */}
                                    <AnimatePresence>
                                        {profileOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                            >
                                                {/* Profile header */}
                                                <div className="p-4 bg-gradient-to-br from-ieee-blue/5 to-cyan-500/5 dark:from-ieee-blue/10 dark:to-cyan-500/10 border-b border-gray-100 dark:border-gray-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                                            {userInitial}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'User'}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                                            <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                                isAdminRole(user.role)
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : 'bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400'
                                                            }`}>
                                                                {isAdminRole(user.role) ? <Shield size={10} /> : <User size={10} />}
                                                                {user.role || 'Volunteer'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu items */}
                                                <div className="p-2">
                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            navigate(isAdminRole(user.role) ? '/admin' : '/volunteer');
                                                        }}
                                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                                    >
                                                        <LayoutDashboard size={16} className="text-gray-400" />
                                                        Dashboard
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setProfileOpen(false);
                                                            navigate('/leaderboard');
                                                        }}
                                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                                    >
                                                        <User size={16} className="text-gray-400" />
                                                        My Profile & Rank
                                                    </button>
                                                </div>

                                                {/* Sign out */}
                                                <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                                                    <button
                                                        onClick={handleSignOut}
                                                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                    >
                                                        <LogOut size={16} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link to="/auth" className="btn-primary text-sm !py-2 !px-5">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile controls */}
                    <div className="md:hidden flex items-center gap-1">
                        <NotificationBell />
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 rounded-xl"
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        {user && (
                            <button
                                onClick={() => navigate(isAdminRole(user.role) ? '/admin' : '/volunteer')}
                                className="w-8 h-8 rounded-xl bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-xs font-bold"
                                aria-label="Go to Dashboard"
                            >
                                {userInitial}
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu — Animated */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="md:hidden overflow-hidden bg-white dark:bg-ieee-dark border-t border-gray-200 dark:border-gray-800"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {/* Mobile profile card */}
                            {user && (
                                <div className="mb-3 p-4 bg-gradient-to-br from-ieee-blue/5 to-cyan-500/5 dark:from-ieee-blue/10 dark:to-cyan-500/10 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ieee-blue to-cyan-500 flex items-center justify-center text-white text-base font-bold shadow-md">
                                            {userInitial}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'User'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${
                                            isAdminRole(user.role)
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400'
                                        }`}>
                                            {user.role || 'Volunteer'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link
                                        to={link.path}
                                        className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                                            isActive(link.path)
                                                ? 'bg-ieee-blue/10 text-ieee-blue dark:bg-ieee-blue/20 dark:text-cyan-400'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                                {user ? (
                                    <button
                                        onClick={handleSignOut}
                                        className="flex w-full justify-center items-center gap-2 px-4 py-3 text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition"
                                    >
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                ) : (
                                    <Link to="/auth" className="btn-primary block text-center w-full">
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
