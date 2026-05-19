import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const STATIC = [
    { id: "s1", name: "IEEE", logo: "IEEE" },
    { id: "s2", name: "Google", logo: "Google" },
    { id: "s3", name: "Microsoft", logo: "MSFT" },
    { id: "s4", name: "GitHub", logo: "GitHub" },
    { id: "s5", name: "Intel", logo: "Intel" },
    { id: "s6", name: "NVIDIA", logo: "NVIDIA" },
    { id: "s7", name: "AWS", logo: "AWS" },
    { id: "s8", name: "Oracle", logo: "Oracle" },
];

export default function SponsorsPartners() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "sponsors"), orderBy("createdAt", "desc")), snap => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const sponsors = data.length > 0 ? data : STATIC;

    return (
        <section id="sponsors" className="w-full py-14 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Trusted By Industry Leaders</p>
                </motion.div>
                <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
                    {sponsors.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.1 }} className="px-6 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-ieee-blue/20 transition-all cursor-default">
                            <span className="text-lg font-black text-gray-400 dark:text-gray-500 tracking-tight">{s.logo || s.name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
