"use client";

import { useEffect, useState } from "react";
import { PuzzleState } from "@/lib/types";
import { X, RefreshCw, Shuffle } from "lucide-react";
import SlidingPuzzleBoard from "./SlidingPuzzleBoard";
import GuestSolvedPopup from "./GuestSolvedPopup";
import { ValentineOverlay } from "../ValentineOverlay"; // Up one level? Yes, it's in components/room
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Heart Animation Component
function FloatingHearts() {
    // Determine hearts only once on mount to avoid re-renders
    const [hearts, setHearts] = useState<any[]>([]);

    useEffect(() => {
        const h = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 2,
            size: 30 + Math.random() * 80 // Increased size significantly (was 10+30)
        }));
        setHearts(h);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[10002] overflow-hidden">
            {hearts.map((heart) => (
                <motion.div
                    key={heart.id}
                    initial={{ y: "110vh", opacity: 0 }}
                    animate={{ y: "-20vh", opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: heart.duration,
                        delay: heart.delay,
                        ease: "easeOut",
                        repeat: 0
                    }}
                    style={{ left: `${heart.left}%` }}
                    className="absolute text-pink-500 drop-shadow-lg"
                >
                    <svg width={heart.size} height={heart.size} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </motion.div>
            ))}
        </div>
    );
}

interface PuzzleOverlayProps {
    roomId: string;
    socket: any;
    onClose: () => void;
    role: "host" | "guest";
}

export default function PuzzleOverlay({ roomId, socket, onClose, role }: PuzzleOverlayProps) {
    const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
    const [localRevision, setLocalRevision] = useState(0);
    const [showGuestSolvedPopup, setShowGuestSolvedPopup] = useState(false);
    const [showValentineOverlay, setShowValentineOverlay] = useState(false);
    const [showHeartFlow, setShowHeartFlow] = useState(false);

    // Initial load
    useEffect(() => {
        // Emit open request to get current state (in case we missed game:started's broadcast or opened late)
        socket.emit("puzzle:open", { roomId });

        const onState = (data: { state: PuzzleState }) => {
            console.log("PuzzleOverlay received state:", data.state);
            setPuzzle(data.state);
            setLocalRevision(data.state.revision);
        };

        const onSolved = (data: { solvedRevision: number }) => {
            if (role === "guest") {
                setShowGuestSolvedPopup(true);
            }
        };

        socket.on("puzzle:state", onState);
        socket.on("puzzle:solved", onSolved);

        return () => {
            socket.off("puzzle:state", onState);
            socket.off("puzzle:solved", onSolved);
        };
    }, [roomId, socket, role]);

    const handleTileClick = (index: number) => {
        if (!puzzle) return;
        socket.emit("puzzle:moveRequest", {
            roomId,
            tileIndex: index,
            expectedRevision: puzzle.revision
        });
    };

    const handleShuffle = () => {
        socket.emit("puzzle:shuffleRequest", { roomId });
    };

    const handleOpenGift = () => {
        setShowGuestSolvedPopup(false);
        setShowValentineOverlay(true);
    };

    const handleValentineYes = () => {
        // Trigger hearts
        setShowHeartFlow(true);
        // Notify server
        socket.emit("room:valentine");

        // Close overlay after some time? Or keep it open with "She said YES"?
        // Plan says: "Close the card buttons state and show an animated celebration layer"
        // The ValentineOverlay handles the card state, we handle the global hearts here.

        setTimeout(() => {
            setShowValentineOverlay(false);
            onClose(); // Close puzzle overlay entirely after celebration
        }, 5000);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
            {/* Main Content */}
            <div className="relative bg-surface-elevated/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-300 w-full max-w-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                            Photo Puzzle 🎁
                        </h2>
                        <p className="text-xs text-muted-foreground">Slide the tiles to complete the picture</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Board */}
                <div className="flex justify-center my-2">
                    {puzzle ? (
                        <SlidingPuzzleBoard
                            tiles={puzzle.tiles}
                            onTileClick={handleTileClick}
                            isSolved={puzzle.status === "solved"}
                        />
                    ) : (
                        <div className="w-[300px] h-[300px] flex items-center justify-center">
                            <RefreshCw className="animate-spin text-muted" />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm font-mono text-muted-foreground">
                        Moves: {puzzle?.moveCount || 0}
                    </div>
                    <button
                        onClick={handleShuffle}
                        disabled={puzzle?.status === "active"}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Shuffle size={14} />
                        Shuffle
                    </button>
                    {/* Dev/Debug: Reset? Nah. */}
                </div>
            </div>

            {/* Guest Popups */}
            <AnimatePresence>
                {showGuestSolvedPopup && (
                    <GuestSolvedPopup onOpenGift={handleOpenGift} />
                )}
            </AnimatePresence>

            {showValentineOverlay && (
                <ValentineOverlay onComplete={handleValentineYes} />
            )}

            {/* Global Hearts Celebration */}
            {showHeartFlow && <FloatingHearts />}
        </div>
    );
}
