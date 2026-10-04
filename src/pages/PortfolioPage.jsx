import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, ExternalLink, Award, Users, CheckCircle, Pencil } from "lucide-react";
import MetaTags from "../shared/MetaTags";
import Avatar from "../components/Avatar";
import { apiGet } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SOCIALS, safeUrl } from "../utils/links";
import { getGrade, getEarnedBadges } from "../utils/grades";
import { roleLabel } from "../utils/people";

/** Public portfolio of a volunteer / ambassador. */
export default function PortfolioPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [state, setState] = useState({ id: null, person: null, missing: false });

    useEffect(() => {
        let cancelled = false;
        apiGet(`/api/public/people/${encodeURIComponent(id)}`)
            .then(r => !cancelled && setState({ id, person: r.person, missing: false }))
            .catch(() => !cancelled && setState({ id, person: null, missing: true }));
        return () => { cancelled = true; };
    }, [id]);

    if (state.id !== id) {
        return <div className="min-h-[50vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (state.missing) {
        return (
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Profile not found</h1>
                <Link to="/volunteers" className="text-ieee-blue font-semibold hover:underline">Browse volunteers</Link>
            </div>
        );
    }

    const p = state.person;
    const grade = getGrade(p.points);
    const badges = getEarnedBadges(p);
    const links = SOCIALS.map(s => ({ ...s, url: safeUrl(p.socials[s.key]) })).filter(s => s.url);

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <MetaTags title={p.name} description={p.headline || `${p.name} — ${roleLabel(p)} at IEEE SB CEK`} image={p.photoURL || undefined} />
            <div className="flex items-center justify-between mb-6">
                <Link to="/volunteers" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-ieee-blue"><ArrowLeft className="w-4 h-4" /> All volunteers</Link>
                {user?.uid === p.id && <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ieee-blue hover:underline"><Pencil className="w-4 h-4" /> Edit profile</Link>}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-ieee-blue via-cyan-500 to-violet-500" />
                <div className="px-6 pb-6 -mt-14">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <Avatar src={p.photoURL} name={p.name} size="xl" className="ring-4 ring-white dark:ring-gray-900" />
                        <div className="flex-1 min-w-0 sm:pt-16">
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">{p.name} <CheckCircle className="w-5 h-5 text-ieee-blue" aria-label="Verified member" /></h1>
                            <p className="text-sm font-semibold text-ieee-blue dark:text-cyan-400">
                                {roleLabel(p)}{p.ambassadorType === "class" && p.campusAmbassadorName ? ` · Campus Ambassador: ${p.campusAmbassadorName}` : ""}
                            </p>
                            {p.headline && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{p.headline}</p>}
                            <p className="text-xs text-gray-400 mt-1">{[p.department, p.year, p.college].filter(Boolean).join(" · ")}</p>
                        </div>
                        {p.email && (
                            <a href={`mailto:${p.email}`} className="sm:mt-16 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ieee-blue text-white text-sm font-semibold hover:bg-ieee-blue/90"><Mail className="w-4 h-4" /> Email</a>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { label: "Points", value: p.points },
                            { label: "Tasks done", value: p.tasksCompleted },
                            { label: "Referrals", value: p.referrals },
                        ].map(s => (
                            <div key={s.label} className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                                <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{s.value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {p.bio && <p className="mt-6 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{p.bio}</p>}

                    {p.skills.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {p.skills.map(s => <span key={s} className="px-3 py-1 rounded-full bg-ieee-blue/10 text-ieee-blue dark:text-cyan-400 text-xs font-semibold">{s}</span>)}
                            </div>
                        </div>
                    )}

                    {links.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Connect</h2>
                            <div className="flex flex-wrap gap-2">
                                {links.map(l => (
                                    <a key={l.key} href={l.url} target="_blank" rel="noopener noreferrer nofollow"
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-ieee-blue hover:text-ieee-blue">
                                        {l.label} <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${grade.bgPill} ${grade.textClass}`}><Award className="w-3.5 h-3.5" /> {grade.icon} {grade.name}</span>
                        {badges.map(b => <span key={b.id} title={`${b.name}: ${b.desc}`} className="text-lg">{b.icon}</span>)}
                        {p.referrals > 0 && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Users className="w-3.5 h-3.5" /> Brought {p.referrals} {p.referrals === 1 ? "person" : "people"} to IEEE events</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
