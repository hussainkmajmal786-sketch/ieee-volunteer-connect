import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Globe, Moon, Sun, LogOut } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        { name: "Leaderboard", path: "/leaderboard" },
    ];

    if (user) {
        navLinks.push({
            name: "Dashboard",
            path: user.role === 'ADMIN' ? "/admin" : "/volunteer"
        });
    }

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed w-full z-50 bg-white/80 dark:bg-ieee-dark/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-3">
                        <div className="bg-ieee-blue p-2 rounded-lg shadow-sm">
                            <Globe className="text-white w-6 h-6" />
                        </div>
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-ieee-blue dark:text-white">
                            IEEE <span className="font-light">Connect</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`relative font-medium transition-colors py-2 ${isActive(link.path) ? 'text-ieee-blue dark:text-cyan-400' : 'text-gray-600 dark:text-gray-300 hover:text-ieee-blue dark:hover:text-cyan-400'}`}
                            >
                                {link.name}
                                {isActive(link.path) && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ieee-blue dark:bg-cyan-400 rounded-full" />
                                )}
                            </Link>
                        ))}

                        <div className="flex items-center gap-4 pl-6 border-l border-gray-200 dark:border-gray-700">
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 hover:text-ieee-blue dark:text-gray-400 dark:hover:text-cyan-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Toggle dark mode"
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            {user ? (
                                <button
                                    onClick={async () => {
                                        await logout();
                                        navigate('/auth');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition"
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            ) : (
                                <Link to="/auth" className="btn-primary">
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400"
                        >
                            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-gray-300 p-2">
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-ieee-dark border-t border-gray-200 dark:border-gray-800 shadow-xl">
                    <div className="px-4 pt-2 pb-6 space-y-2 sm:px-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${isActive(link.path) ? 'bg-ieee-blue/10 text-ieee-blue dark:bg-ieee-blue/20 dark:text-cyan-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-ieee-blue dark:hover:text-cyan-400'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                            {user ? (
                                <button
                                    onClick={async () => {
                                        setIsOpen(false);
                                        await logout();
                                        navigate('/auth');
                                    }}
                                    className="flex w-full justify-center items-center gap-2 px-4 py-3 text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition"
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>
                            ) : (
                                <Link to="/auth" className="btn-primary w-full justify-center" onClick={() => setIsOpen(false)}>
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
