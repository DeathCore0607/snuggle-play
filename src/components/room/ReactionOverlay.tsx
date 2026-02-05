"use client";

import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Reaction {
    id: string;
    senderId: string;
    emoji: string;
    x: number; // Random horizontal position
}

export function ReactionOverlay() {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    useEffect(() => {
        const onReaction = (data: { senderId: string, emoji: string }) => {
            const id = Math.random().toString(36).slice(2);
            // Random x between 20% and 80%
            const x = Math.floor(Math.random() * 60) + 20;

            const newReaction = { ...data, id, x };

            setReactions(prev => [...prev, newReaction]);

            // Remove after animation (ensure this matches duration)
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 3000); // 3s total
        };

        socket.on("reaction:show", onReaction);
        return () => {
            socket.off("reaction:show", onReaction);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[50]">
            <AnimatePresence>
                {reactions.map(r => (
                    <motion.div
                        key={r.id}
                        initial={{ y: 0, opacity: 0, scale: 0.5 }}
                        animate={{
                            y: -400, // Move UP from bottom
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1.5, 1.2]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: "easeOut" }}
                        className="absolute bottom-10 text-6xl drop-shadow-md"
                        style={{ left: `${r.x}%` }}
                    >
                        {r.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
