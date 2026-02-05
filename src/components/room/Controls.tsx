"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Smile } from "lucide-react";
import { ClientToServerEvents, ReactionEmoji } from "@/lib/types";
import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";

interface ControlsProps {
    localStream: MediaStream | null;
    toggleMic: () => void;
    toggleCam: () => void;
    toggleShare: () => void;
    isSharing: boolean;
}

const REACTIONS: ReactionEmoji[] = ["❤️", "😂", "😮", "🥺", "🔥", "✨"];

export function Controls({ localStream, toggleMic, toggleCam, toggleShare, isSharing }: ControlsProps) {
    const { me } = useStore();

    const sendReaction = (emoji: ReactionEmoji) => {
        socket.emit("reaction:send", emoji);
        // Optimistic UI could be added here preferably via a specialized hook or context
    };

    if (!me) return null;

    return (

        <div className="glass-card p-5 space-y-4 shrink-0">
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
                                ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                                : "bg-white/60 border-white/40 hover:bg-white text-slate-600"
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
                                ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                                : "bg-white/60 border-white/40 hover:bg-white text-slate-600"
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
            <div className="space-y-2">

                <div className="flex justify-between items-center bg-white/20 rounded-2xl p-2 gap-1 border border-white/10 shadow-inner">
                    {REACTIONS.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => sendReaction(emoji)}
                            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/80 hover:scale-110 active:scale-90 text-xl hover:shadow-md"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
