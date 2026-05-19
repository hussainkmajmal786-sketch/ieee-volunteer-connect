import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Presentation, Palette, BookOpen, Wrench, Award, Download, Search, Lock } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import MetaTags from "../shared/MetaTags";

const ICON_MAP = { "Event Templates": FileText, "Presentation Kits": Presentation, "Design Assets": Palette, "IEEE Branding Guide": BookOpen, "Workshop Kits": Wrench, "Certificate Templates": Award };
const COLOR_MAP = { "Event Templates": "from-blue-500 to-blue-600", "Presentation Kits": "from-violet-500 to-purple-500", "Design Assets": "from-pink-500 to-rose-500", "IEEE Branding Guide": "from-ieee-blue to-cyan-500", "Workshop Kits": "from-amber-500 to-yellow-500", "Certificate Templates": "from-emerald-500 to-green-500" };

const STATIC_RESOURCES = [
    { id: "r1", title: "Event Proposal Template", category: "Event Templates", type: "DOCX", size: "45 KB" },
    { id: "r2", title: "Workshop Slide Deck", category: "Presentation Kits", type: "PPTX", size: "2.1 MB" },
    { id: "r3", title: "Social Media Banner Pack", category: "Design Assets", type: "PSD", size: "15 MB" },
    { id: "r4", title: "Official Brand Guidelines", category: "IEEE Branding Guide", type: "PDF", size: "4.2 MB" },
    { id: "r5", title: "Python Basics Workshop Kit", category: "Workshop Kits", type: "ZIP", size: "25 MB" },
    { id: "r6", title: "Participation Certificate", category: "Certificate Templates", type: "DOCX", size: "520 KB" },
    { id: "r7", title: "Event Report Template", category: "Event Templates", type: "DOCX", size: "38 KB" },
    { id: "r8", title: "IEEE Introduction Slides", category: "Presentation Kits", type: "PPTX", size: "1.8 MB" },
    { id: "r9", title: "IEEE Logo Pack", category: "Design Assets", type: "ZIP", size: "8 MB" },
    { id: "r10", title: "Web Dev Starter Kit", category: "Workshop Kits", type: "ZIP", size: "18 MB" },
    { id: "r11", title: "Winner Certificate", category: "Certificate Templates", type: "DOCX", size: "580 KB" },
    { id: "r12", title: "Budget Planning Sheet", category: "Event Templates", type: "XLSX", size: "22 KB" },
];

export default function ResourcesPage() {
    const [search, setSearch] = useState("");
    const [firestoreRes, setFirestoreRes] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "resources"), orderBy("createdAt", "desc")), snap => {
            setFirestoreRes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    const resources = firestoreRes.length > 0 ? firestoreRes : STATIC_RESOURCES;

    // Group by category
    const grouped = {};
    resources.forEach(r => {
        if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return;
        const cat = r.category || "Other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(r);
    });

    const handleDownload = (resource) => {
        if (resource.downloadUrl) {
            window.open(resource.downloadUrl, "_blank");
        } else {
            alert("Download URL not yet configured. Contact admin to upload this resource.");
        }
    };

    return (
        <div className="min-h-screen">
            <MetaTags title="Resources" description="Download templates, kits, and design assets for IEEE events." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold text-sm mb-4 border border-green-200 dark:border-green-800">
                            <Lock className="w-4 h-4" /> Members Only Access
                        </div>
                        <BookOpen className="w-10 h-10 text-ieee-blue dark:text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Resources</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">Everything you need to run successful IEEE events.</p>
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-ieee-blue/50 outline-none text-sm" />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                {Object.entries(grouped).map(([cat, items], ci) => {
                    const Icon = ICON_MAP[cat] || FileText;
                    const color = COLOR_MAP[cat] || "from-gray-500 to-gray-600";
                    return (
                        <motion.div key={cat} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.08 }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}><Icon className="w-5 h-5 text-white" /></div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat}</h2>
                                <span className="text-sm text-gray-400 font-semibold">{items.length} items</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {items.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-ieee-blue/20 transition-all flex items-center gap-3 group cursor-pointer" onClick={() => handleDownload(item)}>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
                                            <p className="text-xs text-gray-400">{item.type || "File"} • {item.size || "—"}</p>
                                        </div>
                                        <button className="p-2 rounded-lg text-gray-400 hover:text-ieee-blue hover:bg-ieee-blue/10 transition-all shrink-0"><Download className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
                {Object.keys(grouped).length === 0 && <div className="text-center py-16 text-gray-500">No resources found.</div>}
            </section>
        </div>
    );
}
