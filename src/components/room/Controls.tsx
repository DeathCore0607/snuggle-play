"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Plus } from "lucide-react";
import { ReactionEmoji } from "@/lib/types";
import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface ControlsProps {
    toggleMic: () => void;
    toggleCam: () => void;
    toggleShare: () => void;
    isSharing: boolean;
}

// Updated Default Reactions per user request
const DEFAULT_REACTIONS: ReactionEmoji[] = ["💖", "👍", "👎", "🎉", "👏", "😂"];

const EXTRA_REACTIONS: ReactionEmoji[] = [
    "💘", "🌹", "✨", "🔥", "👻", "👀",
    "🧠", "💅", "🧸", "🍭", "🎀", "🥺",
    "🤣", "🤯", "😴", "🤮", "🤧", "🥴",
    "🥳", "😎", "🤠", "👽", "🤖", "💩"
];

export function Controls({ toggleMic, toggleCam, toggleShare, isSharing }: ControlsProps) {
    const { me } = useStore();
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const sendReaction = (emoji: ReactionEmoji) => {
        socket.emit("reaction:send", emoji);
        setShowPicker(false);
    };

    // Close picker on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showPicker]);

    const togglePicker = () => setShowPicker(!showPicker);

    if (!me) return null;

    return (

        <div className="glass-card p-5 space-y-4 shrink-0 relative z-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-violet-100/50 rounded-lg text-violet-500">
                    <Monitor size={14} />
                </div>
                <span className="text-cute-title text-sm">Controls</span>
            </div>

            <div className="flex items-center justify-between gap-3">
                {/* Media Toggles */}
                <div className="flex gap-3">
                    <button
                        onClick={toggleMic}
                        title={me.micMuted ? "Unmute" : "Mute"}
                        className={cn(
                            "h-11 w-11 rounded-full border transition-all flex items-center justify-center shadow-sm active:scale-95",
                            me.micMuted
                                ? "bg-rose-50/80 border-rose-200 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                                : "bg-surface border-border hover:bg-surface-hover text-secondary"
                        )}
                    >
                        {me.micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        onClick={toggleCam}
                        title={me.camOff ? "Camera On" : "Camera Off"}
                        className={cn(
                            "h-11 w-11 rounded-full border transition-all flex items-center justify-center shadow-sm active:scale-95",
                            me.camOff
                                ? "bg-rose-50/80 border-rose-200 text-rose-500 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                                : "bg-surface border-border hover:bg-surface-hover text-secondary"
                        )}
                    >
                        {me.camOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                </div>

                {/* Screen Share - Primary Action */}
                <Button
                    onClick={toggleShare}
                    className={cn(
                        "flex-1 h-11 rounded-full font-medium text-sm transition-all shadow-md",
                        isSharing
                            ? "bg-gradient-to-r from-rose-400 to-red-500 text-white animate-pulse"
                            : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    )}
                >
                    {isSharing ? (
                        <div className="flex items-center justify-center gap-2">
                            <MonitorOff size={18} /> <span className="hidden sm:inline">Stop Share</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <Monitor size={18} /> <span className="hidden sm:inline">Share Screen</span>
                        </div>
                    )}
                </Button>
            </div>

            <div className="soft-divider my-2" />

            {/* Reactions Row */}
            <div className="flex items-center justify-between bg-surface-elevated rounded-2xl p-2 border border-border shadow-inner gap-1 relative z-20">
                {DEFAULT_REACTIONS.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all hover:bg-surface hover:scale-110 active:scale-90 text-lg hover:shadow-md"
                    >
                        {emoji}
                    </button>
                ))}

                {/* Plus Button */}
                <div className="relative">
                    <button
                        onClick={togglePicker}
                        className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-full transition-all text-secondary hover:shadow-md hover:bg-surface hover:scale-110 active:scale-90",
                            showPicker && "bg-primary text-white shadow-md hover:bg-primary"
                        )}
                    >
                        <Plus size={18} />
                    </button>

                    {/* Popover */}
                    <AnimatePresence>
                        {showPicker && (
                            <motion.div
                                ref={pickerRef}
                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full right-0 mt-3 w-[260px] p-3 bg-surface/90 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl grid grid-cols-6 gap-2 ring-1 ring-black/5"
                                style={{ zIndex: 100 }}
                            >
                                {EXTRA_REACTIONS.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => sendReaction(emoji)}
                                        className="aspect-square flex items-center justify-center rounded-lg hover:bg-white/20 transition-all hover:scale-110 active:scale-90 text-lg cursor-pointer select-none"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                {/* Tip Arrow */}
                                <div className="absolute -top-2 right-3 w-4 h-4 bg-surface/90 rotate-45 border-l border-t border-white/20 rounded-sm"></div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
