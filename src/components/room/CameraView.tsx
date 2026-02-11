"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "@/lib/types";
import { MicOff, VideoOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CameraProps {
    user: User | null;
    stream: MediaStream | null;
    isLocal?: boolean;
    className?: string; // Allow custom styling
    showLabel?: boolean; // Allow hiding internal label
    isCrowned?: boolean;
}

export function CameraView({ user, stream, isLocal, className, showLabel = true, isCrowned }: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!user) {
        return (
            <div className={cn("aspect-square bg-surface-elevated/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-border shadow-inner text-muted", className)}>
                <span className="text-sm font-medium">Waiting...</span>
            </div>
        );
    }

    return (
        <div className={cn("relative aspect-square bg-surface-elevated rounded-2xl overflow-hidden shadow-soft ring-1 ring-black/5 group", className)}>
            {/* Crown Overlay */}
            <AnimatePresence>
                {isCrowned && (
                    <>
                        {/* Floating Crown */}
                        <motion.div
                            initial={{ y: -100, opacity: 0, rotate: -10 }}
                            animate={{ y: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: -100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-24 h-24 drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] pointer-events-none"
                            style={{ filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.3))" }}
                        >
                            <img src="/crown-icon.svg" alt="Crown" className="w-full h-full" />
                        </motion.div>

                        {/* Sparkles */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 pointer-events-none mix-blend-screen"
                        >
                            <div className="absolute top-10 left-10 animate-pulse text-yellow-400"><Sparkles size={24} /></div>
                            <div className="absolute top-20 right-14 animate-bounce text-yellow-300" style={{ animationDuration: "2s" }}><Sparkles size={16} /></div>
                            <div className="absolute bottom-32 left-8 animate-pulse text-amber-300" style={{ animationDuration: "1.5s" }}><Sparkles size={20} /></div>
                        </motion.div>

                        {/* Golden Border Glow */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 border-4 border-yellow-400/50 rounded-[inherit] z-30 pointer-events-none shadow-[inset_0_0_20px_rgba(255,215,0,0.3)]"
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Mute local to avoid feedback
                className={cn("w-full h-full object-cover transition-opacity", user.camOff ? "opacity-0" : "opacity-100", isLocal && "scale-x-[-1]")}
            />

            {/* Fallback when cam off */}
            <div className={cn("absolute inset-0 bg-surface-elevated flex items-center justify-center transition-opacity", user.camOff ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-surface-hover border border-border flex items-center justify-center text-primary text-2xl font-bold mb-2 shadow-inner">
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-muted text-xs">Camera is off</span>
                </div>
            </div>

            {/* Overlay info */}
            {showLabel && (
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-2 z-20">
                    <span className="text-white text-xs font-medium truncate max-w-[100px]">{user.name} {isLocal && "(You)"}</span>
                    {user.micMuted && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
            )}
        </div>
    );
}
