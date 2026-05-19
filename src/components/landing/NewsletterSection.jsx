import { motion } from "framer-motion";
import { Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubscribed(true);
        setEmail("");
        setTimeout(() => setSubscribed(false), 4000);
    };

    return (
        <section id="newsletter" className="w-full py-14 sm:py-20 lg:py-24 bg-gradient-to-r from-ieee-blue to-cyan-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <Mail className="w-12 h-12 text-white/80 mx-auto mb-4" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">Stay in the Loop</h2>
                    <p className="text-lg text-white/80 mb-8">Get updates on events, opportunities, and IEEE news delivered to your inbox.</p>
                    {subscribed ? (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold">
                            ✓ Thanks for subscribing!
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="flex-grow px-5 py-3.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none text-sm font-medium"
                                required
                            />
                            <button type="submit" className="px-8 py-3.5 bg-white text-ieee-blue rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-xl flex items-center justify-center gap-2 shrink-0">
                                Subscribe <Send className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        <a href="https://chat.whatsapp.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                            <MessageCircle className="w-4 h-4" /> Join WhatsApp Community
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
