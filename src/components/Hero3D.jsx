import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

/**
 * Hero3D — Pure CSS 3D animated hero scene.
 * - Rotating IEEE cube (perspective + transform3d, 6 faces)
 * - Orbiting energy rings on three axes
 * - Mouse-tracked parallax tilt
 * - Floating glassmorphic info chips
 * - Animated grid floor + ambient orbs
 *
 * Zero external dependencies beyond framer-motion (already in the app).
 */

const FACE_SIZE = 180;
const HALF = FACE_SIZE / 2;

// Deterministic pseudo-random in [0,1) from an integer seed — keeps render pure.
function rand(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function Particles({ count }) {
    const particles = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => ({
                size: 2 + rand(i + 1) * 3,
                left: rand(i + 2) * 100,
                top: rand(i + 3) * 100,
                duration: 4 + rand(i + 4) * 4,
                delay: rand(i + 5) * 2,
            })),
        [count]
    );

    return particles.map((p, i) => (
        <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
                width: p.size,
                height: p.size,
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: "rgba(125, 211, 252, 0.6)",
                boxShadow: "0 0 8px rgba(56, 189, 248, 0.8)",
            }}
            animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.9, 0.3],
            }}
            transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
            }}
        />
    ));
}

function CubeFace({ transform, label, gradient, accent }) {
    return (
        <div
            className="absolute flex items-center justify-center"
            style={{
                width: FACE_SIZE,
                height: FACE_SIZE,
                transform,
                background: gradient,
                border: `1px solid ${accent}`,
                boxShadow: `inset 0 0 60px rgba(0, 200, 255, 0.15), 0 0 40px ${accent}`,
                backfaceVisibility: "hidden",
            }}
        >
            {/* Inner edge glow */}
            <div
                className="absolute inset-2 rounded-sm"
                style={{
                    border: `1px solid ${accent}`,
                    opacity: 0.4,
                }}
            />
            {/* Corner accents */}
            {["top-1 left-1", "top-1 right-1", "bottom-1 left-1", "bottom-1 right-1"].map((c) => (
                <div
                    key={c}
                    className={`absolute ${c} w-3 h-3 border-cyan-300/80`}
                    style={{
                        borderTopWidth: c.includes("top") ? 1 : 0,
                        borderBottomWidth: c.includes("bottom") ? 1 : 0,
                        borderLeftWidth: c.includes("left") ? 1 : 0,
                        borderRightWidth: c.includes("right") ? 1 : 0,
                    }}
                />
            ))}
            <span
                className="text-white font-black tracking-tight select-none"
                style={{
                    fontSize: 38,
                    letterSpacing: "-0.04em",
                    textShadow: "0 0 20px rgba(0, 200, 255, 0.6)",
                }}
            >
                {label}
            </span>
        </div>
    );
}

function OrbitingRing({ rotateX = 0, rotateY = 0, rotateZ = 0, size = 280, color = "rgba(0,200,255,0.4)", duration = 14 }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                border: `1px solid ${color}`,
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                transformStyle: "preserve-3d",
                boxShadow: `0 0 30px ${color}`,
            }}
        >
            {/* Energy bead on the ring */}
            <div
                className="absolute"
                style={{
                    top: -4,
                    left: "50%",
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    borderRadius: "50%",
                    background: "#38e0ff",
                    boxShadow: "0 0 16px #38e0ff, 0 0 32px #00b4d8",
                }}
            />
        </motion.div>
    );
}

function FloatingChip({ icon, label, value, x, y, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute backdrop-blur-xl rounded-2xl border px-4 py-3 flex items-center gap-3 pointer-events-none"
            style={{
                left: x,
                top: y,
                background: "rgba(15, 30, 60, 0.55)",
                borderColor: "rgba(56, 189, 248, 0.25)",
                boxShadow: "0 10px 40px rgba(0, 100, 200, 0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
                minWidth: 130,
            }}
        >
            <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: "linear-gradient(135deg, #0284c7, #06b6d4)",
                    boxShadow: "0 4px 14px rgba(6, 182, 212, 0.5)",
                }}
            >
                <span className="text-white text-base">{icon}</span>
            </motion.div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/70">{label}</span>
                <span className="text-sm font-black text-white">{value}</span>
            </div>
        </motion.div>
    );
}

export default function Hero3D() {
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const tiltX = useTransform(mouseY, [-1, 1], [12, -12]);
    const tiltY = useTransform(mouseX, [-1, 1], [-12, 12]);

    const sx = useSpring(tiltX, { stiffness: 80, damping: 18 });
    const sy = useSpring(tiltY, { stiffness: 80, damping: 18 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handleMove = (e) => {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            mouseX.set(px * 2 - 1);
            mouseY.set(py * 2 - 1);
        };
        const handleLeave = () => {
            mouseX.set(0);
            mouseY.set(0);
        };
        el.addEventListener("mousemove", handleMove);
        el.addEventListener("mouseleave", handleLeave);
        return () => {
            el.removeEventListener("mousemove", handleMove);
            el.removeEventListener("mouseleave", handleLeave);
        };
    }, [mouseX, mouseY]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[560px] flex items-center justify-center select-none"
            style={{ perspective: 1400 }}
        >
            {/* Background gradient orb */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,120,200,0.18) 0%, transparent 70%)",
                }}
            />

            {/* Animated grid floor */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                    width: "120%",
                    height: 280,
                    transform: "rotateX(65deg) translateY(80px)",
                    transformOrigin: "center bottom",
                    background: `
                        linear-gradient(rgba(0,180,255,0.18) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,180,255,0.18) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                    maskImage: "linear-gradient(to top, black 20%, transparent 90%)",
                    WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 90%)",
                }}
            />

            {/* Scene container with mouse tilt */}
            <motion.div
                style={{
                    transformStyle: "preserve-3d",
                    rotateX: sx,
                    rotateY: sy,
                }}
                className="relative w-full h-full flex items-center justify-center"
            >
                {/* Orbiting energy rings */}
                <div className="absolute top-1/2 left-1/2" style={{ transformStyle: "preserve-3d" }}>
                    <OrbitingRing rotateX={70} rotateY={0}  size={320} color="rgba(56, 189, 248, 0.4)" duration={14} />
                    <OrbitingRing rotateX={70} rotateY={60} size={380} color="rgba(0, 220, 255, 0.3)" duration={20} />
                    <OrbitingRing rotateX={20} rotateY={45} size={260} color="rgba(125, 211, 252, 0.35)" duration={10} />
                </div>

                {/* The IEEE cube */}
                <motion.div
                    animate={{ rotateY: 360, rotateX: 360 }}
                    transition={{
                        rotateY: { duration: 16, repeat: Infinity, ease: "linear" },
                        rotateX: { duration: 22, repeat: Infinity, ease: "linear" },
                    }}
                    className="relative"
                    style={{
                        width: FACE_SIZE,
                        height: FACE_SIZE,
                        transformStyle: "preserve-3d",
                    }}
                >
                    <CubeFace
                        label="IEEE"
                        transform={`translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #0c2e5f 0%, #0c4a8c 100%)"
                        accent="rgba(56, 189, 248, 0.6)"
                    />
                    <CubeFace
                        label="SB"
                        transform={`rotateY(180deg) translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #0c4a8c 0%, #0c2e5f 100%)"
                        accent="rgba(56, 189, 248, 0.6)"
                    />
                    <CubeFace
                        label="VC"
                        transform={`rotateY(90deg) translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #0c4a8c 0%, #06b6d4 100%)"
                        accent="rgba(34, 211, 238, 0.6)"
                    />
                    <CubeFace
                        label="CEK"
                        transform={`rotateY(-90deg) translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #06b6d4 0%, #0c4a8c 100%)"
                        accent="rgba(34, 211, 238, 0.6)"
                    />
                    <CubeFace
                        label="◆"
                        transform={`rotateX(90deg) translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #0c2e5f 0%, #06b6d4 100%)"
                        accent="rgba(56, 189, 248, 0.6)"
                    />
                    <CubeFace
                        label="◆"
                        transform={`rotateX(-90deg) translateZ(${HALF}px)`}
                        gradient="linear-gradient(135deg, #06b6d4 0%, #0c2e5f 100%)"
                        accent="rgba(56, 189, 248, 0.6)"
                    />
                </motion.div>

                {/* Floating UI chips */}
                <FloatingChip icon="⚡" label="Live Events" value="24"     x="6%"  y="18%" delay={0.4} />
                <FloatingChip icon="★" label="Volunteers" value="156"    x="72%" y="14%" delay={0.6} />
                <FloatingChip icon="◉" label="Points"     value="8,420"  x="8%"  y="72%" delay={0.8} />
                <FloatingChip icon="✦" label="Branches"   value="50+"    x="70%" y="76%" delay={1.0} />
            </motion.div>

            {/* Ambient floating particles */}
            <Particles count={18} />
        </div>
    );
}
