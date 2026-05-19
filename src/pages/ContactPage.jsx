import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, Github, Twitter, Linkedin, MessageCircle, CheckCircle2 } from "lucide-react";
import MetaTags from "../shared/MetaTags";

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setForm({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
    };

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    return (
        <div className="min-h-screen">
            <MetaTags title="Contact Us" description="Get in touch with IEEE Student Branch, College of Engineering Kidangoor." />
            <section className="w-full py-16 sm:py-20 bg-gradient-to-br from-ieee-blue/5 via-white to-cyan-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Mail className="w-10 h-10 text-ieee-blue dark:text-cyan-400 mx-auto mb-4" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Contact Us</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">We&apos;d love to hear from you. Reach out for collaborations, queries, or just to say hello.</p>
                    </motion.div>
                </div>
            </section>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Get in Touch</h3>
                            <div className="space-y-4">
                                <a href="mailto:ieee@ceknpy.ac.in" className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 hover:text-ieee-blue transition-colors">
                                    <div className="p-2 rounded-lg bg-ieee-blue/10"><Mail className="w-4 h-4 text-ieee-blue" /></div>ieee@ceknpy.ac.in
                                </a>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="p-2 rounded-lg bg-ieee-blue/10"><Phone className="w-4 h-4 text-ieee-blue" /></div>+91 98765 43210
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="p-2 rounded-lg bg-ieee-blue/10"><MapPin className="w-4 h-4 text-ieee-blue" /></div>College of Engineering Kidangoor, Kottayam, Kerala
                                </div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Follow Us</h3>
                            <div className="flex gap-3">
                                {[
                                    { icon: Twitter, href: "https://twitter.com/IEEECEK", color: "hover:bg-blue-500" },
                                    { icon: Linkedin, href: "https://linkedin.com/company/ieee-sb-cek", color: "hover:bg-blue-600" },
                                    { icon: Github, href: "https://github.com/ieeecek", color: "hover:bg-gray-900 dark:hover:bg-white dark:hover:text-gray-900" },
                                    { icon: MessageCircle, href: "https://chat.whatsapp.com", color: "hover:bg-green-500" },
                                ].map(({ icon: Icon, href, color }) => (
                                    <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 ${color} hover:text-white hover:border-transparent transition-all`}>
                                        <Icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                    {/* Contact Form */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-lg">
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                                <p className="text-gray-500">We&apos;ll get back to you within 24 hours.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Send a Message</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Name</label>
                                        <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none" placeholder="Your name" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label>
                                        <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none" placeholder="you@email.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Subject</label>
                                    <input name="subject" value={form.subject} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none" placeholder="What's this about?" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Message</label>
                                    <textarea name="message" value={form.message} onChange={handleChange} required rows={5} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-ieee-blue/50 outline-none resize-none" placeholder="Your message..." />
                                </div>
                                <button type="submit" className="btn-primary !px-8 !py-3 text-sm w-full sm:w-auto">Send Message <Send className="w-4 h-4" /></button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
