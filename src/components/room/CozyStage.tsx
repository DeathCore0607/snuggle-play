"use client";

import { useStore } from "@/lib/store";
import { CameraView } from "./CameraView";
import { motion } from "framer-motion";
import { MicOff } from "lucide-react";
import { socket } from "@/lib/socket";

interface CozyStageProps {
    localUser: any;
    localStream: MediaStream | null;
    remoteUser: any;
    remoteStream: MediaStream | null;
}

export function CozyStage({ localUser, localStream, remoteUser, remoteStream }: CozyStageProps) {
    const { roomState } = useStore();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">

            {/* Ambient Label */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-8 z-10 flex items-center gap-3"
            >
                <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 font-display tracking-tight pb-1">
                    Just us
                </span>
                <span className="text-4xl">💞</span>
            </motion.div>

            {/* Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl h-full max-h-[80vh] items-center">

                {/* Local User */}
                <motion.div
                    layoutId="camera-local"
                    className="relative aspect-video md:aspect-square w-full h-full max-h-[600px] shadow-2xl rounded-[32px] overflow-hidden border border-white/10 bg-surface-elevated flex flex-col"
                >
                    <div className="flex-1 relative overflow-hidden">
                        <CameraView
                            user={localUser}
                            stream={localStream}
                            isLocal
                            showLabel={false}
                            className="h-full w-full rounded-t-[32px] aspect-auto ring-0"
                            isCrowned={roomState?.crownedUserId === localUser.id}
                        />
                    </div>
                    {/* Footer - Local */}
                    <div className="h-16 shrink-0 bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 border-t border-white/5">
                        <span className="font-display font-bold text-xl text-purple-400 tracking-wide drop-shadow-sm">{localUser?.name || "You"}</span>
                        {localUser?.micMuted && <MicOff className="w-5 h-5 text-red-400" />}
                    </div>
                </motion.div>

                {/* Remote User */}
                <motion.div
                    layoutId="camera-remote"
                    className="relative aspect-video md:aspect-square w-full h-full max-h-[600px] shadow-2xl rounded-[32px] overflow-hidden border border-white/10 bg-surface-elevated flex flex-col"
                >
                    <div className="flex-1 relative overflow-hidden">
                        {remoteUser ? (
                            <CameraView
                                user={remoteUser}
                                stream={remoteStream}
                                showLabel={false}
                                className="h-full w-full rounded-t-[32px] aspect-auto ring-0"
                                isCrowned={roomState?.crownedUserId === remoteUser.id}
                            />
                        ) : (
                            <div className="w-full h-full bg-surface/50 backdrop-blur-md flex flex-col items-center justify-center text-muted gap-3">
                                <div className="w-16 h-16 rounded-full bg-surface-elevated animate-pulse" />
                                <span className="font-medium">Waiting for partner...</span>
                            </div>
                        )}
                    </div>
                    {/* Footer - Remote */}
                    <div className="h-16 shrink-0 bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 border-t border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="font-display font-bold text-xl text-purple-400 tracking-wide drop-shadow-sm">{remoteUser?.name || "Partner"}</span>
                            {localUser?.role === "host" && remoteUser && (
                                <button
                                    onClick={() => socket.emit("room:crown", remoteUser.id)}
                                    className="flex items-center justify-center relative transition-all duration-300 transform active:scale-95 hover:scale-110"
                                    title="Crown Her"
                                >
                                    <img
                                        src="/crown-icon.svg"
                                        alt="Crown Her"
                                        className="w-10 h-10 drop-shadow-sm hover:rotate-6 transition-transform"
                                    />
                                </button>
                            )}
                        </div>
                        {remoteUser?.micMuted && <MicOff className="w-5 h-5 text-red-400" />}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
