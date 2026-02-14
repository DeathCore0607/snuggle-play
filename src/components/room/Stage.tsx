"use client";

import { useStore } from "@/lib/store";
import { Monitor } from "lucide-react";
import { useEffect, useRef } from "react";

interface StageProps {
    stream: MediaStream | null; // The screen share stream (remote or local loopback)
}

export function Stage({ stream }: StageProps) {
    const { roomState, me } = useStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            // Force mute if it's my own share to prevent local loopback
            const sharerId = useStore.getState().roomState?.sharerId;
            const myId = useStore.getState().me?.id;
            if (sharerId === myId) {
                videoRef.current.muted = true;
                videoRef.current.volume = 0;
            }
        }
    }, [stream]);

    if (!roomState?.isScreenSharing) {
        return (
            <div className="w-full aspect-video glass-card flex flex-col items-center justify-center text-muted relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 pointer-events-none" />

                <div className="w-24 h-24 bg-surface-elevated rounded-full flex items-center justify-center mb-6 text-accent shadow-glow animate-float backdrop-blur-sm">
                    <Monitor size={48} className="opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2 tracking-tight">The screen is cozy and empty 🫧</h3>
                <p className="text-sm text-secondary font-medium bg-surface px-4 py-1.5 rounded-full backdrop-blur-sm">
                    Tap &apos;Share Screen&apos; and we&apos;ll watch together.
                </p>
                <p className="text-[10px] text-muted mt-2 opacity-70">(Your partner will see it instantly)</p>
            </div>
        );
    }

    const sharer = roomState.users.find(u => u.id === roomState.sharerId);
    const isMe = sharer?.id === me?.id;

    return (
        <div className="w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/5 relative group flex items-center justify-center">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMe}
                className="w-full h-full object-contain"
            />

            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                {isMe ? "You are sharing" : `${sharer?.name || "Partner"} is sharing`}
            </div>
        </div>
    );
}
