"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValentineOverlayProps {
    onComplete: () => void;
}

export function ValentineOverlay({ onComplete }: ValentineOverlayProps) {
    const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; scale: number; speed: number }[]>([]);

    useEffect(() => {
        // Generate random hearts
        const newHearts = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            scale: 0.5 + Math.random() * 1,
            speed: 3 + Math.random() * 2,
        }));
        setHearts(newHearts);

        // Cleanup timer
        const timer = setTimeout(() => {
            onComplete();
        }, 6500); // 6.5s total duration as per plan

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
        >
            {/* Backdrop with blur and vignette */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm bg-gradient-radial from-transparent to-black/40" />

            {/* Floating Hearts */}
            <AnimatePresence>
                {hearts.map((heart) => (
                    <motion.div
                        key={heart.id}
                        initial={{ y: "110vh", opacity: 0, scale: heart.scale }}
                        animate={{
                            y: "-10vh",
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: heart.speed,
                            delay: heart.delay,
                            ease: "easeOut",
                        }}
                        style={{
                            left: `${heart.left}%`,
                            position: "absolute",
                        }}
                        className="text-pink-500/60 dark:text-pink-400/50 drop-shadow-lg"
                    >
                        <Heart fill="currentColor" size={32} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Glass Popup Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ delay: 3, duration: 0.8, type: "spring" }}
                className={cn(
                    "relative z-10 p-8 max-w-md w-full mx-4 text-center",
                    "bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-3xl",
                    "border border-pink-200/30 dark:border-pink-500/20",
                    "shadow-[0_8px_32px_0_rgba(255,105,180,0.15)]",
                    "overflow-hidden"
                )}
            >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-rose-500/10 animate-pulse" />

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Heart className="w-12 h-12 text-pink-500 fill-pink-500 drop-shadow-md" />
                    </motion.div>

                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                        Happy Valentine’s Day, My Princess
                    </h2>

                    <p className="text-lg text-slate-700 dark:text-pink-100/90 font-medium">
                        &quot;You make every night magical.&quot;
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
