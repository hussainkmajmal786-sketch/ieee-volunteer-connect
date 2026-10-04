import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import MetaTags from "../shared/MetaTags";
import Avatar from "../components/Avatar";
import { apiGet } from "../lib/api";
import { getGrade } from "../utils/grades";
import { roleLabel } from "../utils/people";

const FILTERS = [
    { value: "all", label: "Everyone" },
    { value: "campus", label: "Campus Ambassadors" },
    { value: "class", label: "Class Ambassadors" },
    { value: "volunteer", label: "Volunteers" },
    { value: "team", label: "Core Team" },
];

const matches = (p, filter) => filter === "all"
    || (filter === "campus" && p.ambassadorType === "campus")
    || (filter === "class" && p.ambassadorType === "class")
    || (filter === "team" && (p.role === "ADMIN" || p.role === "SUPER_ADMIN"))
    || (filter === "volunteer" && p.role === "VOLUNTEER" && !p.ambassadorType);

/** Directory of real volunteers and ambassadors; each card opens their portfolio. */
export default function VolunteersPage() {
    const [people, setPeople] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        apiGet("/api/public/people").then(r => setPeople(r.people)).catch(() => setPeople([]));
    }, []);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (people || []).filter(p => matches(p, filter) && (!q
            || [p.name, p.headline, p.department, p.college, ...p.skills].some(v => (v || "").toLowerCase().includes(q))));
    }, [people, search, filter]);

    return (
        <div className="min-h-screen">
            <MetaTags title="Volunteers" description="Meet the volunteers and ambassadors of IEEE SB CEK." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Users className="w-10 h-10 text-ieee-blue dark:text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Our Volunteers</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">The people who power IEEE SB CEK — open a profile to connect.</p>
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, skill, department…" aria-label="Search volunteers"
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-ieee-blue/50 outline-none text-sm" />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-5" role="radiogroup" aria-label="Filter">
                            {FILTERS.map(f => (
                                <button key={f.value} role="radio" aria-checked={filter === f.value} onClick={() => setFilter(f.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === f.value ? "bg-ieee-blue text-white shadow" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {people === null ? (
                    <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" /></div>
                ) : shown.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No volunteers found.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {shown.map((p, i) => {
                            const grade = getGrade(p.points);
                            return (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.04 }}>
                                    <Link to={`/volunteers/${p.id}`} className="block h-full bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all text-center group">
                                        <Avatar src={p.photoURL} name={p.name} size="lg" className="mx-auto mb-3 ring-4 ring-ieee-blue/10 group-hover:scale-105 transition-transform" />
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{p.name}</h3>
                                        <p className="text-xs font-semibold text-ieee-blue dark:text-cyan-400 mb-1">{roleLabel(p)}</p>
                                        {p.headline && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{p.headline}</p>}
                                        {p.skills.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-1 mb-3">
                                                {p.skills.slice(0, 3).map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{s}</span>)}
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500"><span className={`font-bold ${grade.textClass}`}>{grade.icon} {grade.name}</span> · <span className="font-bold text-ieee-blue dark:text-cyan-400">{p.points} pts</span></p>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
