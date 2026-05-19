import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { isAdminRole } from "../utils/constants";
import MetaTags from "../shared/MetaTags";
import Hero3D from "../components/Hero3D";
import StatsGrid from "../components/landing/StatsGrid";
import FeaturedOpportunities from "../components/landing/FeaturedOpportunities";
import EventsShowcase from "../components/landing/EventsShowcase";
import VolunteerSpotlight from "../components/landing/VolunteerSpotlight";
import ChaptersSocieties from "../components/landing/ChaptersSocieties";
import ProjectShowcase from "../components/landing/ProjectShowcase";
import LeaderboardPreview from "../components/landing/LeaderboardPreview";
import TestimonialsCarousel from "../components/landing/TestimonialsCarousel";
import ResourcesPreview from "../components/landing/ResourcesPreview";
import NewsAnnouncements from "../components/landing/NewsAnnouncements";
import SponsorsPartners from "../components/landing/SponsorsPartners";
import NewsletterSection from "../components/landing/NewsletterSection";
import QuickActionPanel from "../components/landing/QuickActionPanel";

export default function LandingPage() {
    const { user } = useAuth();
    const containerRef = useRef(null);
    const heroY = useTransform(useScroll().scrollY, [0, 600], [0, -120]);
    const heroScale = useTransform(useScroll().scrollY, [0, 600], [1, 1.05]);
    const mockupY = useTransform(useScroll().scrollY, [0, 500], [0, 60]);
    const springConfig = { stiffness: 100, damping: 30 };
    const heroYSpring = useSpring(heroY, springConfig);
    const dashPath = user ? (isAdminRole(user.role) ? "/admin" : "/volunteer") : "/auth";

    const features = [
        "Manage event registrations effortlessly",
        "Track volunteer participation and tasks",
        "Gamified grades, badges & leaderboard",
        "Share event links & earn bonus points",
    ];

    return (
        <div ref={containerRef} className="flex flex-col items-center overflow-hidden">
            <MetaTags title="Connect, Collaborate, and Lead" description="The volunteer connect platform of IEEE Student Branch, College of Engineering Kidangoor. Manage events, track contributions, and grow together." />

            {/* ===== HERO SECTION ===== */}
            <section className="w-full relative min-h-[80vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-ieee-light via-white to-gray-50 dark:from-ieee-dark dark:via-gray-900 dark:to-gray-950 -z-20" />
                <motion.div style={{ y: heroYSpring, scale: heroScale }} className="absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-ieee-blue/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: "2s" }} />
                    <div className="absolute bottom-1/4 left-1/2 w-[450px] h-[450px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{ animationDelay: "4s" }} />
                </motion.div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-28 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <motion.div style={{ y: heroYSpring }} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ieee-blue/10 text-ieee-blue dark:bg-cyan-900/30 dark:text-cyan-400 font-semibold text-sm mb-6 border border-ieee-blue/20">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                IEEE Student Branch • CEK
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 leading-[1.08] break-words">
                                Welcome to<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ieee-blue via-cyan-500 to-blue-400">IEEE VC CEK</span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-xl">
                                The volunteer connect platform of <strong>IEEE Student Branch, College of Engineering Kidangoor</strong>. Manage events, track contributions, and grow together.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12">
                                <Link to={dashPath} className="w-full sm:w-auto">
                                    <Button className="px-8 py-4 text-lg w-full sm:w-auto shadow-lg shadow-ieee-blue/20 hover:shadow-xl hover:scale-[1.02] transition-all">
                                        {user ? "Go to Dashboard" : "Join Now"} <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Link to="/events" className="w-full sm:w-auto">
                                    <Button variant="outline" className="px-8 py-4 text-lg w-full sm:w-auto">Explore Events</Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {features.map((f, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{f}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div style={{ y: mockupY }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2 }} className="relative hidden lg:block">
                            <Hero3D />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== ALL SECTIONS ===== */}
            <StatsGrid />
            <FeaturedOpportunities />
            <EventsShowcase />
            <VolunteerSpotlight />
            <ChaptersSocieties />
            <ProjectShowcase />
            <LeaderboardPreview />
            <TestimonialsCarousel />
            <ResourcesPreview />
            <NewsAnnouncements />
            <SponsorsPartners />
            <NewsletterSection />
            <QuickActionPanel />
        </div>
    );
}
