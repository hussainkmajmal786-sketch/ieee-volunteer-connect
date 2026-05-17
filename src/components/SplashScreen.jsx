import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";

/* ── Twinkling star field ── */
function StarField() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const stars = Array.from({ length: 140 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: 0.3 + Math.random() * 1.2,
            base: 0.1 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
            speed: 0.4 + Math.random() * 0.8,
        }));

        let raf;
        let t = 0;
        const draw = () => {
            t += 0.016;
            ctx.clearRect(0, 0, W, H);
            stars.forEach((s) => {
                const o = s.base * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 220, 255, ${o})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <canvas
            ref={ref}
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%" }}
        />
    );
}

/* ── Pulsing glow rings around the badge ── */
function GlowRings({ active }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border border-cyan-400/30"
                    initial={{ width: 90, height: 90, opacity: 0 }}
                    animate={
                        active
                            ? {
                                  width: [90, 90 + i * 80],
                                  height: [90, 90 + i * 80],
                                  opacity: [0.6, 0],
                              }
                            : {}
                    }
                    transition={{
                        duration: 1.8,
                        delay: i * 0.22,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />
            ))}
        </div>
    );
}

/* ── Letter-by-letter title reveal ── */
function AnimatedTitle({ text, delay, className }) {
    return (
        <span className={className} aria-label={text}>
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                        duration: 0.45,
                        delay: delay + i * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN SPLASH SCREEN
   Flow: scan-on → badge → title → subtitle → hold → exit
   ══════════════════════════════════════════════════════════ */
export default function SplashScreen({ onFinish }) {
    const [phase, setPhase] = useState("scan");
    const [visible, setVisible] = useState(true);

    const handleFinish = useCallback(() => onFinish(), [onFinish]);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase("badge"),    500),
            setTimeout(() => setPhase("title"),    1300),
            setTimeout(() => setPhase("subtitle"), 2200),
            setTimeout(() => setPhase("hold"),     3000),
            setTimeout(() => setVisible(false),    3800),
            setTimeout(() => handleFinish(),       4500),
        ];
        return () => timers.forEach(clearTimeout);
    }, [handleFinish]);

    const showBadge    = ["badge", "title", "subtitle", "hold"].includes(phase);
    const showTitle    = ["title", "subtitle", "hold"].includes(phase);
    const showSubtitle = ["subtitle", "hold"].includes(phase);
    const showProgress = ["subtitle", "hold"].includes(phase);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
                    style={{
                        background:
                            "radial-gradient(ellipse at 40% 40%, #0a1e3d 0%, #060f22 45%, #020810 100%)",
                    }}
                >
                    {/* Star field */}
                    <StarField />

                    {/* Subtle grid overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.025]"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(0,160,255,0.6) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(0,160,255,0.6) 1px, transparent 1px)
                            `,
                            backgroundSize: "60px 60px",
                        }}
                    />

                    {/* Ambient left orb */}
                    <motion.div
                        animate={{ x: [-10, 10, -10], y: [-8, 8, -8] }}
                        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none"
                        style={{ background: "rgba(0, 60, 160, 0.18)" }}
                    />
                    {/* Ambient right orb */}
                    <motion.div
                        animate={{ x: [10, -10, 10], y: [8, -8, 8] }}
                        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full blur-[120px] pointer-events-none"
                        style={{ background: "rgba(0, 140, 200, 0.14)" }}
                    />

                    {/* TV scan-on effect */}
                    <AnimatePresence>
                        {phase === "scan" && (
                            <motion.div
                                key="scan"
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                exit={{ scaleY: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background:
                                        "linear-gradient(180deg, transparent 49%, rgba(0,180,255,0.08) 50%, transparent 51%)",
                                    transformOrigin: "center",
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* ── BADGE + RINGS ── */}
                    <div className="relative flex flex-col items-center gap-8">
                        <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
                            <GlowRings active={showBadge} />

                            <AnimatePresence>
                                {showBadge && (
                                    <motion.div
                                        key="badge"
                                        initial={{ scale: 0, opacity: 0, rotate: -20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 18,
                                            duration: 0.7,
                                        }}
                                        className="relative flex items-center justify-center w-[88px] h-[88px] rounded-[22px]"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #0055aa 0%, #007acc 40%, #00b4d8 100%)",
                                            boxShadow:
                                                "0 0 0 1px rgba(0,180,255,0.3), 0 8px 40px rgba(0,100,200,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
                                        }}
                                    >
                                        {/* Inner shine */}
                                        <div
                                            className="absolute top-0 left-0 right-0 h-1/2 rounded-t-[22px] pointer-events-none"
                                            style={{ background: "rgba(255,255,255,0.07)" }}
                                        />
                                        <span
                                            className="text-white font-black tracking-tight select-none"
                                            style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                                        >
                                            IEEE
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Badge entry flash */}
                            <AnimatePresence>
                                {showBadge && (
                                    <motion.div
                                        key="flash"
                                        initial={{ opacity: 0.8, scale: 0.3 }}
                                        animate={{ opacity: 0, scale: 4 }}
                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-full pointer-events-none"
                                        style={{
                                            background:
                                                "radial-gradient(circle, rgba(100,220,255,0.7) 0%, transparent 70%)",
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── TITLE ── */}
                        <div className="text-center" style={{ minHeight: 72 }}>
                            <AnimatePresence>
                                {showTitle && (
                                    <motion.div
                                        key="title"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <h1 className="font-black tracking-tight leading-tight" style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)" }}>
                                            <AnimatedTitle
                                                text="Volunteer "
                                                delay={0}
                                                className="text-white"
                                            />
                                            <AnimatedTitle
                                                text="Connect"
                                                delay={0.42}
                                                className="text-cyan-400"
                                            />
                                        </h1>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── SUBTITLE ── */}
                        <AnimatePresence>
                            {showSubtitle && (
                                <motion.div
                                    key="sub"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    className="flex flex-col items-center gap-3 -mt-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/40" />
                                        <p
                                            className="text-[11px] font-bold tracking-[0.3em] uppercase"
                                            style={{ color: "rgba(148,163,184,0.55)" }}
                                        >
                                            IEEE Student Branch · CEK
                                        </p>
                                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/40" />
                                    </div>

                                    {/* Progress shimmer */}
                                    <AnimatePresence>
                                        {showProgress && (
                                            <motion.div
                                                key="bar"
                                                initial={{ opacity: 0, scaleX: 0 }}
                                                animate={{ opacity: 1, scaleX: 1 }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                                className="mt-1 w-40 h-[2px] rounded-full overflow-hidden"
                                                style={{
                                                    background: "rgba(255,255,255,0.06)",
                                                    transformOrigin: "left",
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ x: "-100%" }}
                                                    animate={{ x: "120%" }}
                                                    transition={{
                                                        duration: 1.1,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        repeatDelay: 0.2,
                                                    }}
                                                    className="h-full w-2/5 rounded-full"
                                                    style={{
                                                        background:
                                                            "linear-gradient(90deg, transparent, #38bdf8, #00e0ff, transparent)",
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cinematic bottom bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.6, duration: 0.5 }}
                        className="absolute bottom-8 flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-pulse" />
                        <span
                            className="text-[10px] font-semibold tracking-[0.25em] uppercase"
                            style={{ color: "rgba(148,163,184,0.3)" }}
                        >
                            Loading
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
