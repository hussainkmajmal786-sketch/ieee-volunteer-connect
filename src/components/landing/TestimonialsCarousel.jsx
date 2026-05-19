import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const STATIC = [
    { id: "t1", name: "Priya Sharma", role: "Branch Chair", college: "IIT Delhi", text: "IEEE Connect transformed how we manage our 500+ member branch. Volunteer engagement jumped 3x in a single semester.", avatar: "P", gradient: "from-amber-400 to-yellow-300" },
    { id: "t2", name: "James Rodriguez", role: "Volunteer Lead", college: "MIT", text: "The gamification system made volunteering genuinely exciting. Our team competes for the leaderboard every week!", avatar: "J", gradient: "from-ieee-blue to-cyan-400" },
    { id: "t3", name: "Aisha Khan", role: "Event Coordinator", college: "NUS Singapore", text: "Setting up events went from hours of spreadsheet work to minutes. The share link tracking is genius.", avatar: "A", gradient: "from-violet-500 to-purple-400" },
    { id: "t4", name: "Ravi Mehta", role: "Technical Lead", college: "BITS Pilani", text: "The project showcase feature helped us get sponsorships. Companies can see our work and reach out directly.", avatar: "R", gradient: "from-emerald-400 to-green-400" },
    { id: "t5", name: "Sara Thompson", role: "WIE Chair", college: "Stanford", text: "IEEE Connect made it so easy to track volunteer hours and generate certificates. A true game-changer for us.", avatar: "S", gradient: "from-rose-400 to-pink-400" },
];

const GRADIENTS = ["from-amber-400 to-yellow-300", "from-ieee-blue to-cyan-400", "from-violet-500 to-purple-400", "from-emerald-400 to-green-400", "from-rose-400 to-pink-400"];

export default function TestimonialsCarousel() {
    const [current, setCurrent] = useState(0);
    const [data, setData] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc"), limit(10)), snap => {
            setData(snap.docs.map((d, i) => ({ id: d.id, ...d.data(), gradient: GRADIENTS[i % GRADIENTS.length], avatar: d.data().avatar || d.data().name?.charAt(0) || "?" })));
        }, () => {});
        return unsub;
    }, []);

    const testimonials = data.length > 0 ? data : STATIC;

    useEffect(() => {
        const timer = setInterval(() => setCurrent(p => (p + 1) % testimonials.length), 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    const prev = () => setCurrent(p => (p - 1 + testimonials.length) % testimonials.length);
    const next = () => setCurrent(p => (p + 1) % testimonials.length);
    const t = testimonials[current];
    if (!t) return null;

    return (
        <section id="testimonials" className="w-full py-14 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Trusted Worldwide</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">What Volunteers Say</h2>
                </motion.div>
                <div className="relative">
                    <div className="overflow-hidden">
                        <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.4 }} className="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-10 border border-gray-100 dark:border-gray-700 shadow-xl text-center">
                            <div className="flex justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                            </div>
                            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-200 leading-relaxed mb-8 italic">&quot;{t.text}&quot;</p>
                            <div className="flex items-center justify-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>{t.avatar}</div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                                    <p className="text-xs text-ieee-blue dark:text-cyan-400 font-semibold">{t.college}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-gray-400 hover:text-ieee-blue transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-gray-400 hover:text-ieee-blue transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, i) => (
                            <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-ieee-blue dark:bg-cyan-400 w-6" : "bg-gray-300 dark:bg-gray-600"}`} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
