"use client";

import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraProps {
    user: User | null;
    stream: MediaStream | null;
    isLocal?: boolean;
    className?: string; // Allow custom styling
    showLabel?: boolean; // Allow hiding internal label
}

export function CameraView({ user, stream, isLocal, className, showLabel = true }: CameraProps) {
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
                <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-2">
                    <span className="text-white text-xs font-medium truncate max-w-[100px]">{user.name} {isLocal && "(You)"}</span>
                    {user.micMuted && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
            )}
        </div>
    );
}
