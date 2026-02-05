"use client";

import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Flame, Scale, Zap, Sparkles, Waves, Puzzle } from "lucide-react";

type BucketConfig = {
    theme: string;
    iconLeft: React.ElementType;
    iconRight: React.ElementType;
    headline: string;
    sub: string;
    motionVariant: any;
};

// Animation Variants
const popBounce = {
    initial: { scale: 0.85, opacity: 0 },
    animate: { scale: 1.0, opacity: 1, y: [10, 0], transition: { type: "spring", bounce: 0.5 } },
    exit: { scale: 0.9, opacity: 0 }
};

const magnetSnap = {
    initial: { scale: 0.9, opacity: 0, gap: "20px" },
    animate: { scale: 1, opacity: 1, gap: "0px", transition: { type: "spring" } },
    exit: { opacity: 0 }
};

const gentleWobble = {
    initial: { rotate: -2, opacity: 0, scale: 0.9 },
    animate: {
        rotate: [-2, 2, -1, 1, 0],
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6 }
    },
    exit: { opacity: 0 }
};

const seeSaw = {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
        rotate: [0, -3, 3, -1, 1, 0],
        opacity: 1,
        scale: 1,
        transition: { duration: 0.8, ease: "easeInOut" }
    },
    exit: { opacity: 0 }
};

const driftApart = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0 }
};

const shockSwirl = {
    initial: { x: 0, opacity: 0, scale: 0.8 },
    animate: {
        x: [0, -6, 6, -4, 4, 0],
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4 }
    },
    exit: { opacity: 0 }
};

export function RatingResultOverlay() {
    const { me, roomState } = useStore();
    const [result, setResult] = useState<{ diff: number, myRating: number, partnerRating: number } | null>(null);

    useEffect(() => {
        const onReveal = (data: { ratings: Record<string, number> }) => {
            if (!me || !roomState) return;

            const ratings = Object.values(data.ratings);
            if (ratings.length < 2) return;

            // Assume 2 users
            const r1 = ratings[0];
            const r2 = ratings[1];
            const diff = Math.abs(r1 - r2);

            // Identify mine
            const myR = data.ratings[me.id];
            // Partner is the other one
            const partnerR = r1 === myR ? r2 : r1;
            // Handles case if both are same 

            setResult({ diff, myRating: myR, partnerRating: partnerR });
            setTimeout(() => setResult(null), 3000);
        };

        socket.on("rating:reveal", onReveal);
        return () => {
            socket.off("rating:reveal", onReveal);
        };
    }, [me, roomState]);

    if (!result) return null;

    const { diff, myRating, partnerRating } = result;

    let config: BucketConfig;

    if (diff === 0) {
        config = {
            theme: "from-red-500 to-pink-600",
            iconLeft: Flame,
            iconRight: Heart,
            headline: "PERFECT MATCH!",
            sub: "Same vibe! 🔥💖✨",
            motionVariant: popBounce
        };
    } else if (diff === 1) {
        config = {
            theme: "from-coral-400 to-lavender-500", // "from-orange-400 to-pink-500" if coral not defined
            iconLeft: Heart, // HandHeart fallback?
            iconRight: Sparkles,
            headline: "TWIN VIBE!",
            sub: "So close — basically telepathy 🫶✨",
            motionVariant: magnetSnap
        };
    } else if (diff === 2) {
        config = {
            theme: "from-purple-400 to-pink-400",
            iconLeft: Sparkles,
            iconRight: Heart,
            headline: "CLOSE ENOUGH!",
            sub: "Same mood, different spice 😊💫",
            motionVariant: gentleWobble
        };
    } else if (diff <= 4) {
        config = {
            theme: "from-blue-400 to-violet-500",
            iconLeft: Scale,
            iconRight: Puzzle,
            headline: "KIND OF A MATCH",
            sub: "We’re balancing it out ⚖️🧩",
            motionVariant: seeSaw
        };
    } else if (diff <= 6) {
        config = {
            theme: "from-teal-400 to-indigo-500",
            iconLeft: Waves,
            iconRight: Sparkles, // Satellite fallback
            headline: "DIFFERENT WAVES",
            sub: "Still vibing, just in parallel 🌊📡",
            motionVariant: driftApart
        };
    } else {
        config = {
            theme: "from-violet-600 to-blue-600",
            iconLeft: Zap,
            iconRight: Scale, // Swirl fallback
            headline: "TOTAL OPPOSITES!",
            sub: "Plot twist: that’s kinda cute ⚡🌀",
            motionVariant: shockSwirl
        };
    }

    // Fix theme colors if tailwind custom colors are tricky, allow generic
    // Actually we used basic colors in config.

    const IconL = config.iconLeft;
    const IconR = config.iconRight;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

                <motion.div
                    className={`relative bg-gradient-to-br ${config.theme} p-8 rounded-3xl shadow-2xl text-white text-center border-4 border-white/20 min-w-[320px]`}
                    variants={config.motionVariant}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <div className="flex justify-center mb-6 space-x-6 items-center">
                        <IconL size={56} className="text-white drop-shadow-md animate-pulse" />
                        <IconR size={56} className="text-white drop-shadow-md" />
                    </div>

                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 drop-shadow-lg leading-none">
                        {config.headline}
                    </h2>
                    <p className="text-lg font-medium opacity-90 mb-6 font-sans">
                        {config.sub}
                    </p>

                    {/* Rating Pills */}
                    <div className="flex justify-center gap-3">
                        <div className="bg-white/20 rounded-full px-4 py-1.5 backdrop-blur-sm border border-white/30 flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold opacity-70">You</span>
                            <span className="text-xl font-bold">{myRating}</span>
                        </div>
                        <div className="bg-white/20 rounded-full px-4 py-1.5 backdrop-blur-sm border border-white/30 flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold opacity-70">Partner</span>
                            <span className="text-xl font-bold">{partnerRating}</span>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
