import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Globe, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto py-14 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-ieee-blue p-1.5 rounded-lg">
                                <Globe className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-extrabold text-gray-900 dark:text-white">IEEE <span className="font-light">Connect</span></span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Empowering students to lead, inspire, and build the future through global IEEE events and volunteer programs.
                        </p>
                        <div className="flex gap-3 mt-5">
                            {[
                                { icon: Twitter, href: "#", hover: "hover:text-blue-400" },
                                { icon: Linkedin, href: "#", hover: "hover:text-blue-600" },
                                { icon: Github, href: "#", hover: "hover:text-gray-900 dark:hover:text-white" },
                            ].map(({ icon: Icon, href, hover }, i) => (
                                <a key={i} href={href} className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 ${hover} transition-colors`}>
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Platform</h4>
                        <ul className="space-y-2.5">
                            {[
                                { name: "Browse Events", path: "/events" },
                                { name: "Leaderboard", path: "/leaderboard" },
                                { name: "Admin Panel", path: "/admin" },
                                { name: "Volunteer Hub", path: "/volunteer" },
                            ].map(link => (
                                <li key={link.name}><Link to={link.path} className="text-sm text-gray-600 dark:text-gray-400 hover:text-ieee-blue dark:hover:text-cyan-400 transition-colors">{link.name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Resources</h4>
                        <ul className="space-y-2.5">
                            {["IEEE Official", "Student Activities", "Documentation", "Contact Support"].map(name => (
                                <li key={name}><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-ieee-blue dark:hover:text-cyan-400 transition-colors flex items-center gap-1">{name} <ArrowUpRight className="w-3 h-3 opacity-50" /></a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Newsletter</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Get updates on new events and features.</p>
                        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                            <input type="email" placeholder="you@ieee.org" className="flex-grow px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-ieee-blue outline-none" />
                            <button type="submit" className="px-3 py-2 bg-ieee-blue text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shrink-0">
                                <Mail className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} IEEE Student Branch. All rights reserved.</p>
                    <div className="flex gap-6 text-xs text-gray-400">
                        <a href="#" className="hover:text-gray-600 transition">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-600 transition">Terms of Service</a>
                        <a href="#" className="hover:text-gray-600 transition">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
