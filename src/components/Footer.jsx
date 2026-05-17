import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Mail, ArrowUpRight, Heart } from "lucide-react";
import { useState } from "react";

export default function Footer() {
    const [subscribed, setSubscribed] = useState(false);
    const [email, setEmail] = useState("");

    const handleNewsletter = (e) => {
        e.preventDefault();
        setSubscribed(true);
        setEmail("");
        setTimeout(() => setSubscribed(false), 4000);
    };

    return (
        <footer className="relative bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 mt-auto" role="contentinfo">
            {/* Gradient top border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-ieee-blue/40 to-transparent" />

            <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="bg-gradient-to-br from-ieee-blue to-[#004e7c] px-2.5 py-1.5 rounded-xl shadow-sm">
                                <span className="text-white font-black text-[11px] leading-none block tracking-tight">IEEE</span>
                            </div>
                            <span className="text-lg font-extrabold text-gray-900 dark:text-white">
                                Volunteer <span className="text-ieee-blue dark:text-cyan-400">Connect</span>
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Empowering students to lead, inspire, and build the future through global IEEE events and volunteer programs.
                        </p>
                        <div className="flex gap-2 mt-5">
                            {[
                                { icon: Twitter, href: "https://twitter.com/IEEECEK", label: "Twitter", hover: "hover:bg-blue-500 hover:text-white hover:border-blue-500" },
                                { icon: Linkedin, href: "https://linkedin.com/company/ieee-sb-cek", label: "LinkedIn", hover: "hover:bg-blue-600 hover:text-white hover:border-blue-600" },
                                { icon: Github, href: "https://github.com/ieeecek", label: "GitHub", hover: "hover:bg-gray-900 hover:text-white hover:border-gray-900 dark:hover:bg-white dark:hover:text-gray-900" },
                            ].map(({ icon: Icon, href, label, hover }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`Follow us on ${label}`}
                                    className={`p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 transition-all duration-200 ${hover}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Platform</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "Browse Events", path: "/events" },
                                { name: "Leaderboard", path: "/leaderboard" },
                                { name: "Admin Panel", path: "/admin" },
                                { name: "Volunteer Hub", path: "/volunteer" },
                            ].map(link => (
                                <li key={link.name}>
                                    <Link to={link.path} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ieee-blue dark:hover:text-cyan-400 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources  */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resources</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "IEEE Official", href: "https://www.ieee.org" },
                                { name: "Student Activities", href: "https://students.ieee.org" },
                                { name: "IEEE Xplore", href: "https://ieeexplore.ieee.org" },
                                { name: "Contact Support", href: "mailto:ieee@ceknpy.ac.in" },
                            ].map(({ name, href }) => (
                                <li key={name}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-ieee-blue dark:hover:text-cyan-400 transition-colors flex items-center gap-1"
                                    >
                                        {name} <ArrowUpRight className="w-3 h-3 opacity-50" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Newsletter</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Get updates on new events and features.</p>
                        {subscribed ? (
                            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">✓ Thanks for subscribing!</span>
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletter} className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@ieee.org"
                                    aria-label="Email for newsletter"
                                    className="flex-grow px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-ieee-blue/50 outline-none transition"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-ieee-blue text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shrink-0 shadow-sm hover:shadow-md"
                                    aria-label="Subscribe"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-x-3 gap-y-1 text-xs text-gray-400 text-center">
                        <p className="flex items-center gap-1">
                            © {new Date().getFullYear()} IEEE SB CEK. Built with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> by IEEE Volunteers.
                        </p>
                        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
                        <p>Developed by <span className="font-semibold text-gray-500 dark:text-gray-400">Atom Innovations</span></p>
                    </div>
                    <div className="flex gap-6 text-xs text-gray-400">
                        <a href="https://www.ieee.org/about/corporate/governance/p7-8.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy Policy</a>
                        <a href="https://www.ieee.org/about/corporate/governance/p7-8.html" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
