import { motion } from "framer-motion";

export default function Card({ children, className = "", hover = true }) {
    const baseClasses = "glass-card";
    const hoverClasses = hover ? "hover:shadow-xl hover:-translate-y-1" : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${baseClasses} ${hoverClasses} ${className}`}
        >
            {children}
        </motion.div>
    );
}
