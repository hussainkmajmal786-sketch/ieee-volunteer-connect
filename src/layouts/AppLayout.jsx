import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AppLayout() {
    return (
        <div className="min-h-screen flex flex-col font-sans relative">
            {/* Skip to content — accessibility */}
            <a href="#main-content" className="skip-to-content">
                Skip to main content
            </a>

            {/* Global Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white dark:from-ieee-dark dark:via-ieee-dark dark:to-gray-950">
                <div className="absolute inset-0 bg-grid-pattern"></div>
            </div>

            <Navbar />
            <main id="main-content" className="flex-grow pt-20" role="main">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
