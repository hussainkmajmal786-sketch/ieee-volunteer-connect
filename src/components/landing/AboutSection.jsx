import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { db, doc, getDoc } from "../../lib/firestore";
import { youtubeId } from "../../utils/links";

/** "Who are we": description on the left, video (YouTube or uploaded) on the right. Edited in Content Manager. */
export default function AboutSection() {
    const [about, setAbout] = useState(null);

    useEffect(() => {
        getDoc(doc(db, "settings", "about")).then(s => setAbout(s.exists() ? s.data() : null)).catch(() => {});
    }, []);

    if (!about?.published || (!about.description && !about.youtubeUrl && !about.videoUrl)) return null;
    const yt = about.videoType === "youtube" ? youtubeId(about.youtubeUrl) : null;
    const file = about.videoType === "upload" && /^\/files\//.test(about.videoUrl || "") ? about.videoUrl : null;

    return (
        <section id="who-are-we" className="w-full py-14 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                    <p className="text-ieee-blue dark:text-cyan-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> About us</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5">{about.title || "Who are we"}</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">{about.description}</p>
                </motion.div>
                {(yt || file) && (
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 bg-black aspect-video">
                        {yt ? (
                            <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`} title={about.title || "Who are we"} loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                        ) : (
                            <video className="w-full h-full" src={file} controls preload="metadata" playsInline />
                        )}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
