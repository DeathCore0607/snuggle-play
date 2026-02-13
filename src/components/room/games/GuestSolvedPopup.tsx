"use client";

import { motion } from "framer-motion";
import { Gift, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestSolvedPopupProps {
    onOpenGift: () => void;
}

export default function GuestSolvedPopup({ onOpenGift }: GuestSolvedPopupProps) {
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative z-10 p-8 max-w-sm w-full mx-6 bg-surface-elevated/90 backdrop-blur-xl border border-pink-500/30 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-6"
            >
                <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-2 animate-bounce">
                    <Heart className="text-pink-500 fill-pink-500" size={32} />
                </div>

                <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
                        Puzzle Solved!
                    </h3>
                    <p className="text-muted-foreground">
                        Just like how you complete this puzzle,<br />
                        <span className="font-semibold text-foreground">you complete me.</span>
                    </p>
                </div>

                <button
                    onClick={onOpenGift}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Gift size={20} />
                    Open Gift
                </button>
            </motion.div>
        </div>
    );
}
