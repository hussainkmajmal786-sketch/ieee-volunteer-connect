import { motion, AnimatePresence } from "framer-motion";
import { FileText, Presentation, Palette, BookOpen, Wrench, Award, ChevronRight, X, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const resources = [
    { title: "Event Templates", desc: "Ready-to-use templates for event proposals, agendas, and reports. Includes standard IEEE branding.", icon: FileText, count: 12, color: "from-blue-500 to-blue-600", bg: "bg-blue-500", items: ["Proposal Template", "Post-Event Report", "Budget Planner", "Agenda Outline"] },
    { title: "Presentation Kits", desc: "PPTs and slide decks for workshops, seminars, and meetings. Pre-formatted with IEEE SB CEK logos.", icon: Presentation, count: 8, color: "from-violet-500 to-purple-500", bg: "bg-violet-500", items: ["Standard Slide Deck", "Workshop Intro", "Speaker Profile Cards"] },
    { title: "Design Assets", desc: "Logos, banners, social media templates, and branding materials. High-resolution PNGs and vector files.", icon: Palette, count: 25, color: "from-pink-500 to-rose-500", bg: "bg-pink-500", items: ["IEEE SB CEK Logos", "Society Logos", "Social Media Posters", "Zoom Backgrounds"] },
    { title: "IEEE Branding Guide", desc: "Official branding guidelines, color codes, and usage rules. Ensure all materials comply with global standards.", icon: BookOpen, count: 3, color: "from-ieee-blue to-cyan-500", bg: "bg-ieee-blue", items: ["Brand Guidelines PDF", "Typography Pack", "Color Palette Hex Codes"] },
    { title: "Workshop Kits", desc: "Complete kits for conducting technical workshops. Includes sample code, instructions, and datasets.", icon: Wrench, count: 15, color: "from-amber-500 to-yellow-500", bg: "bg-amber-500", items: ["Web Dev Starter Kit", "IoT NodeMCU Guide", "Machine Learning Datasets"] },
    { title: "Certificate Templates", desc: "Customizable certificates for events and achievements. Easy to mail-merge with participant lists.", icon: Award, count: 6, color: "from-emerald-500 to-green-500", bg: "bg-emerald-500", items: ["Participant Certificate", "Winner Certificate", "Volunteer Appreciation"] },
];

export default function ResourcesPreview() {
    const [selected, setSelected] = useState(null);

    return (
        <section id="resources" className="w-full py-14 sm:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3">Tools & Materials</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Resources</h2>
                    <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Everything you need to run successful IEEE events and activities.</p>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((r, i) => {
                        const Icon = r.icon;
                        return (
                            <motion.div 
                                key={r.title} 
                                initial={{ opacity: 0, y: 30 }} 
                                whileInView={{ opacity: 1, y: 0 }} 
                                viewport={{ once: true }} 
                                transition={{ delay: i * 0.08 }} 
                                whileHover={{ y: -4 }} 
                                onClick={() => setSelected(r)}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-ieee-blue/30 transition-all group cursor-pointer"
                            >
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${r.color} shadow-lg w-fit mb-4`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{r.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">{r.desc}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400">{r.count} items</span>
                                    <span className="text-xs font-semibold text-ieee-blue dark:text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">Browse <ChevronRight className="w-3.5 h-3.5" /></span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="text-center mt-10">
                    <Link to="/resources" className="btn-outline !px-8 !py-3 text-sm">View All Resources <ChevronRight className="w-4 h-4" /></Link>
                </div>
            </div>

            {/* ── Resource Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className={`p-6 bg-gradient-to-br ${selected.color} relative shrink-0`}>
                                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xl border-2 border-white/30">
                                        <selected.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{selected.title}</h3>
                                        <p className="text-white/80 font-semibold text-sm">{selected.count} items available</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="p-6 overflow-y-auto">
                                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                                    {selected.desc}
                                </p>
                                
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Popular Items in this Category</p>
                                    <div className="space-y-2">
                                        {selected.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-ieee-blue/30 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-gray-400 group-hover:text-ieee-blue transition-colors" />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item}</span>
                                                </div>
                                                <Download className="w-4 h-4 text-gray-400 group-hover:text-ieee-blue transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button 
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold transition-all ${selected.bg} hover:opacity-90`}
                                        onClick={() => alert("Redirecting to full resource folder...")}
                                    >
                                        <ExternalLink className="w-4 h-4" /> Open Folder
                                    </button>
                                    <button 
                                        onClick={() => setSelected(null)}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
