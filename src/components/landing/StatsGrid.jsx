import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Building2, Calendar, Clock, FolderCheck, Globe } from "lucide-react";

function AnimatedCounter({ end, suffix = "", duration = 2 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const target = parseInt(String(end).replace(/,/g, ""));
        const step = Math.ceil(target / (duration * 60));
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            setCount(current);
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [isInView, end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const stats = [
    { value: "5000", suffix: "+", label: "Total Volunteers", icon: Users, gradient: "from-ieee-blue to-cyan-500" },
    { value: "120", suffix: "+", label: "Active Student Branches", icon: Building2, gradient: "from-emerald-500 to-green-400" },
    { value: "200", suffix: "+", label: "Upcoming Events", icon: Calendar, gradient: "from-violet-500 to-purple-400" },
    { value: "15000", suffix: "+", label: "Hours Contributed", icon: Clock, gradient: "from-amber-500 to-yellow-400" },
    { value: "85", suffix: "+", label: "Completed Projects", icon: FolderCheck, gradient: "from-rose-500 to-pink-400" },
    { value: "30", suffix: "+", label: "Regions Participating", icon: Globe, gradient: "from-teal-500 to-cyan-400" },
];

export default function StatsGrid() {
    return (
        <section id="stats-dashboard" className="w-full relative z-10 -mt-8 md:-mt-16 mb-16 md:mb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-8">
                        <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-2">Platform Impact</p>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Volunteer Stats Dashboard</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                        {stats.map((s, idx) => {
                            const Icon = s.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 150, damping: 18 }}
                                    whileHover={{ y: -4, scale: 1.03 }}
                                    className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-ieee-blue/30 dark:hover:border-cyan-500/30 transition-all cursor-default"
                                >
                                    <div className={`mb-3 p-2.5 rounded-xl bg-gradient-to-br ${s.gradient} shadow-lg`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                        <AnimatedCounter end={s.value} suffix={s.suffix} />
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 text-center leading-tight">{s.label}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
