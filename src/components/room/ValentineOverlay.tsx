"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValentineOverlayProps {
    onComplete: () => void;
    variant?: "proposal" | "success" | "greeting";
}

export function ValentineOverlay({ onComplete, variant = "proposal" }: ValentineOverlayProps) {
    const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Initial check for non-proposal variants
    useState(() => {
        if (variant === "success" || variant === "greeting") {
            setShowCelebration(true);
        }
    });

    const handleNoHover = () => {
        if (!containerRef.current) return;

        // Use full viewport range. Relative to center (~50vw, ~50vh).
        // Max range: +/- 45vw, +/- 45vh to stay on screen mostly
        const maxW = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const maxH = typeof window !== 'undefined' ? window.innerHeight : 800;

        const x = (Math.random() - 0.5) * (maxW * 0.8);
        const y = (Math.random() - 0.5) * (maxH * 0.8);

        setNoBtnPos({ x, y });
    };

    const handleYes = () => {
        setShowCelebration(true);
        setTimeout(() => {
            onComplete();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center overflow-hidden pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onComplete} />

            {/* Floating Hearts for Greeting */}
            {variant === "greeting" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: "110vh", x: Math.random() * 100 + "vw", opacity: 0 }}
                            animate={{ y: "-10vh", opacity: [0, 1, 0] }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: "linear"
                            }}
                            className="absolute text-pink-500/50"
                            style={{ fontSize: 20 + Math.random() * 40 }}
                        >
                            <Heart fill="currentColor" />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Card */}
            <div ref={containerRef} className="relative z-10 w-full max-w-3xl p-12 flex flex-col items-center justify-center min-h-[500px]">
                <AnimatePresence mode="wait">
                    {!showCelebration ? (
                        <motion.div
                            key="proposal-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0 }}
                            className="bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-pink-500/30 p-12 rounded-[56px] shadow-2xl w-full text-center flex flex-col gap-12"
                        >
                            <h2 className="text-6xl font-extrabold text-pink-500 drop-shadow-sm font-handwriting leading-tight">
                                Will you be my Valentine?
                            </h2>

                            <div className="flex flex-col gap-8 w-full relative h-48 items-center justify-center">
                                <button
                                    onClick={handleYes}
                                    className="px-16 py-6 bg-pink-500 hover:bg-pink-400 text-white rounded-full font-bold text-3xl shadow-lg transition-all hover:scale-105 active:scale-95 z-20"
                                >
                                    YES! 💖
                                </button>

                                <motion.button
                                    onMouseEnter={handleNoHover}
                                    onMouseDown={handleNoHover} // Handle touch
                                    animate={{ x: noBtnPos.x, y: noBtnPos.y }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute bottom-4 text-lg text-muted-foreground hover:text-pink-500 transition-colors px-6 py-3 z-50 bg-surface-elevated/80 backdrop-blur-sm rounded-full shadow-sm border border-white/10"
                                >
                                    No, thanks
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="celebration-card"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center relative"
                        >
                            {/* Success Variant (Host View) */}
                            {variant === "success" && (
                                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 drop-shadow-lg animate-pulse">
                                    She said YES! 💖
                                </h1>
                            )}

                            {/* Greeting Variant (Standalone Button) */}
                            {variant === "greeting" && (
                                <div className="bg-white/10 dark:bg-black/60 backdrop-blur-2xl border border-pink-500/50 p-10 rounded-[3rem] shadow-glass-lg relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10" />
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Heart className="w-20 h-20 text-pink-500 mx-auto mb-6 drop-shadow-glow" fill="currentColor" />
                                    </motion.div>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md font-handwriting leading-tight">
                                        Happy Valentine's Day,<br />
                                        <span className="text-pink-400">My Princess</span> 👑
                                    </h1>
                                    <p className="mt-6 text-lg text-pink-200/80 font-medium">
                                        You are my everything! 💖
                                    </p>
                                </div>
                            )}

                            {/* Default Heart for Proposal Acceptance */}
                            {variant === "proposal" && (
                                <Heart className="w-32 h-32 text-pink-500 animate-pulse mx-auto opacity-50" />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
