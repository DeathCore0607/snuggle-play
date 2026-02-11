"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Sparkles, Trophy } from "lucide-react";

export function GameWinOverlay() {
    const [winData, setWinData] = useState<{ winnerName: string; type: "ttt" | "c4" } | null>(null);

    useEffect(() => {
        const onGameWon = (data: { winnerId: string; winnerName: string; type: "ttt" | "c4" }) => {
            setWinData(data);
            // Hide after animation duration
            setTimeout(() => setWinData(null), 4000);
        };

        socket.on("game:won", onGameWon);
        return () => {
            socket.off("game:won", onGameWon);
        };
    }, []);

    if (!winData) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-10 rounded-[40px] shadow-2xl text-white text-center border-4 border-white/30 min-w-[350px] overflow-hidden"
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 skew-x-12 translate-x-[-150%] animate-[shine_2s_infinite]" />

                    <div className="relative z-10 flex flex-col items-center">

                        <motion.div
                            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="mb-6 drop-shadow-xl"
                        >
                            <Trophy size={80} className="text-yellow-100" strokeWidth={1.5} />
                        </motion.div>

                        <h2 className="text-sm uppercase tracking-[0.2em] font-bold text-yellow-100 mb-2">
                            Winner
                        </h2>

                        <h1 className="text-4xl font-black italic tracking-tighter mb-4 drop-shadow-md">
                            {winData.winnerName}
                        </h1>

                        <div className="flex items-center gap-2 text-white/90 font-medium bg-white/10 px-4 py-1 rounded-full border border-white/20">
                            <Crown size={16} />
                            <span>Crowned!</span>
                            <Sparkles size={16} />
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
