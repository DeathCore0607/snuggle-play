"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
// import { toast, Toaster } from "sonner";
import { StatusBar } from "@/components/room/StatusBar";
import { Stage } from "@/components/room/Stage";
import { CameraView } from "@/components/room/CameraView";
import { Controls } from "@/components/room/Controls";
import { ChatCard } from "@/components/room/ChatCard";
import { RatingCard } from "@/components/room/RatingCard";
import GamesCard from "@/components/room/GamesCard";
import { ActivityLog } from "@/components/room/ActivityLog";
import { RatingResultOverlay } from "@/components/room/RatingResultOverlay";
import { ReactionOverlay } from "@/components/room/ReactionOverlay";
import { GameWinOverlay } from "@/components/room/GameWinOverlay";
import { CozyStage } from "@/components/room/CozyStage";
import { Button } from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const router = useRouter();
    const {
        setRoomId,
        setSecret,
        setMe,
        setRoomState,
        addMessage,
        setLogs,
        setIsConnected,
        reset,
        me,
        roomState,
        secret
    } = useStore();

    const [copied, setCopied] = useState(false);
    const { localStream, remoteStream, screenStream, remoteScreenStream, startShare, stopShare, toggleMic, toggleCam } = useWebRTC(roomId);

    useEffect(() => {
        // 1. Initial Setup
        const name = localStorage.getItem("snuggle_name");
        const hash = window.location.hash; // #secret=...
        const urlSecret = new URLSearchParams(hash.replace("#", "?")).get("secret");

        if (!name) {
            router.push("/");
            return;
        }

        if (!urlSecret) {
            alert("Invalid room link (missing secret)");
            router.push("/");
            return;
        }

        setRoomId(roomId);
        setSecret(urlSecret);

        const joinRoom = () => {
            console.log("Joining room...", roomId);
            socket.emit("room:join", { roomId, secret: urlSecret, name }, (res) => {
                if (res.status === "error") {
                    alert(res.error);
                    router.push("/");
                    return;
                }
                setMe({ id: socket.id, name, role: res.role });
            });
        };

        // 2. Socket Connection
        console.log("Connecting to socket...");
        if (!socket.connected) {
            socket.connect();
        } else {
            // Already connected? Join immediately
            joinRoom();
        }

        const onConnect = () => {
            console.log("Socket connected/reconnected:", socket.id);
            setIsConnected(true);
            joinRoom();
        };

        const onDisconnect = () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            setIsConnected(false);
        });

        // 3. Event Listeners
        socket.on("room:state", (state) => setRoomState(state));
        socket.on("user:joined", (u) => {
            // Toast?
            console.log("User joined", u);
        });
        socket.on("chat:message", (msg) => addMessage(msg));
        socket.on("activity:log", (logs) => {
            // Prepend or set? The server sends array. Logic in store appends.
            // Server sends [newEntry] usually or full log?
            // My server logic: emit("activity:log", [entry])
            logs.forEach(l => useStore.getState().addLog(l));
        });

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("connect_error");
            socket.off("room:state");
            socket.off("user:joined");
            socket.off("chat:message");
            socket.off("activity:log");
            socket.disconnect();
            reset();
        };
    }, [roomId, router, setRoomId, setSecret, setMe, setRoomState, addMessage, setLogs, reset]);

    const copyLink = () => {
        const url = `${window.location.origin}/room/${roomId}#secret=${secret}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!roomState || !me) {
        return (
            <div className="flex bg-lavender-50 min-h-screen items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-lavender-200 rounded-full mb-4" />
                    <div className="text-lavender-400 font-medium">Entering room...</div>
                </div>
            </div>
        );
    }

    const isHost = me.role === "host";

    // Decide what to show on Stage
    // If sharing, show share stream (local or remote).
    // Priority: Remote Screen > Local Screen > Placeholder
    // Actually, functionality:
    // If roomState.isScreenSharing:
    //    If roomState.sharerId === me.id -> Show localScreenStream (or loopback)
    //    Else -> Show remoteScreenStream
    // ELSE -> Show placeholder

    let stageStream = null;
    if (roomState.isScreenSharing) {
        if (roomState.sharerId === me.id) {
            stageStream = screenStream;
        } else {
            stageStream = remoteScreenStream;
        }
    }

    const partner = roomState.users.find(u => u.id !== me.id);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-transparent">
            <StatusBar />
            <RatingResultOverlay />
            <ReactionOverlay />
            <GameWinOverlay />

            {/* Main Content - Full Height/Width */}
            <div className="flex flex-1 overflow-hidden p-4 gap-4">

                <AnimatePresence mode="wait">
                    {!roomState.isScreenSharing ? (
                        /* MODE A: Cozy Camera Stage (Center) */
                        <motion.div
                            key="cozy-stage"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 min-w-0 h-full relative"
                        >
                            <CozyStage
                                localUser={me}
                                localStream={localStream}
                                remoteUser={partner}
                                remoteStream={remoteStream}
                            />
                        </motion.div>
                    ) : (
                        /* MODE B: Screen Share Stage (Center) */
                        <motion.div
                            key="screen-stage"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1 min-w-0 h-full relative flex flex-col"
                        >
                            <Stage stream={stageStream} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right: Sidebar (Fixed Width 350px, Scrollable) */}
                <div className="w-[320px] lg:w-[350px] shrink-0 flex flex-col gap-3 overflow-y-auto pb-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">

                    {/* Cameras - Only show in Sidebar if Screen Sharing is active */}
                    <AnimatePresence>
                        {roomState.isScreenSharing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-2 gap-2 shrink-0"
                            >
                                <motion.div layoutId="camera-local" className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                                    <CameraView user={me} stream={localStream} isLocal />
                                </motion.div>
                                <motion.div layoutId="camera-remote" className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                                    <CameraView user={partner || { name: "Waiting...", id: "", role: "guest", micMuted: false, camOff: false } as any} stream={remoteStream} />
                                    {!partner && (
                                        <div className="absolute inset-0 bg-surface/80 flex items-center justify-center z-10 backdrop-blur-[1px]">
                                            <span className="text-[10px] text-muted font-medium px-1 text-center leading-tight">Waiting for partner...</span>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Controls
                        toggleMic={toggleMic}
                        toggleCam={toggleCam}
                        toggleShare={roomState.isScreenSharing && roomState.sharerId === me.id ? stopShare : startShare}
                        isSharing={roomState.isScreenSharing && roomState.sharerId === me.id}
                    />

                    <RatingCard />
                    <GamesCard roomId={roomId} socket={socket} users={roomState.users} />
                    <ChatCard />
                    <ActivityLog />
                </div>
            </div>
        </div>
    );
}
