"use client";

import { useEffect, useRef } from "react";
import { User } from "@/lib/types";
import { MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraProps {
    user: User | null;
    stream: MediaStream | null;
    isLocal?: boolean;
}

export function CameraView({ user, stream, isLocal }: CameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!user) {
        return (
            <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 shadow-inner">
                <span className="text-slate-400 text-sm font-medium">Waiting...</span>
            </div>
        );
    }

    return (
        <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-soft ring-1 ring-black/5 group">
            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Mute local to avoid feedback
                className={cn("w-full h-full object-cover transition-opacity", user.camOff ? "opacity-0" : "opacity-100", isLocal && "scale-x-[-1]")}
            />

            {/* Fallback when cam off */}
            <div className={cn("absolute inset-0 bg-slate-800 flex items-center justify-center transition-opacity", user.camOff ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-2xl font-bold mb-2">
                        {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-slate-400 text-xs">Camera is off</span>
                </div>
            </div>

            {/* Overlay info */}
            <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-2">
                <span className="text-white text-xs font-medium truncate max-w-[100px]">{user.name} {isLocal && "(You)"}</span>
                {user.micMuted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>
        </div>
    );
}
