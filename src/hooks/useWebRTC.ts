import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { useStore } from "@/lib/store";





export function useWebRTC(roomId: string) {
    const { me, roomState } = useStore();
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingCandidates = useRef<RTCIceCandidate[]>([]);
    const remotePeerIdRef = useRef<string | null>(null);
    const primaryStreamIdRef = useRef<string | null>(null);
    const screenShareActiveRef = useRef(false);

    // Initialize Local Media
    useEffect(() => {
        let stream: MediaStream;
        async function initMedia() {
            try {
                // If we already have a stream, don't re-init
                if (localStreamRef.current) return;

                console.log("Requesting local media...");
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                console.log("Got local media:", stream.id);
                setLocalStream(stream);
                localStreamRef.current = stream;

                // Sync with store
                if (me) {
                    socket.emit("media:toggle", { micMuted: false, camOff: false });
                }

                // If peer exists (reconnection?), add tracks
                if (peerRef.current) {
                    console.log("Adding late tracks to existing peer...");
                    stream.getAudioTracks().forEach(track => peerRef.current!.addTrack(track, stream));
                    stream.getVideoTracks().forEach(track => peerRef.current!.addTrack(track, stream));

                    // Renegotiate Only if Stable!
                    if (peerRef.current.signalingState === 'stable') {
                        try {
                            const offer = await peerRef.current.createOffer();
                            await peerRef.current.setLocalDescription(offer);
                            socket.emit("signal", { roomId, signal: { type: "offer", sdp: offer } });
                        } catch (e) {
                            console.error("Renegotiation failed", e);
                        }
                    } else {
                        console.log("Skipping renegotiation in initMedia - PC not stable (" + peerRef.current.signalingState + "). Tracks added and will be included in pending answer.");
                    }
                }
            } catch (err) {
                console.error("Failed to get media", err);
            }
        }
        initMedia();

        return () => {
            // Cleanup logic if needed
        };
    }, []);

    const iceServersRef = useRef<RTCIceServer[]>([]);

    // Removed TURN fetching logic as per user request (Tailscale usage)

    const createPeer = (peerId?: string) => {
        if (peerRef.current) return peerRef.current;
        if (peerId) remotePeerIdRef.current = peerId;

        console.log("Creating RTCPeerConnection");

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        });

        peerRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", { roomId, signal: { type: "candidate", candidate: event.candidate } });
            }
        };

        pc.ontrack = (event) => {
            console.log("Received remote track:", event.track.kind, event.streams[0]?.id);
            const stream = event.streams[0];
            if (!stream) return;

            // Use ref to identify primary (camera) vs secondary (screen) stream
            // determining which stream is which based on arrival order
            if (!primaryStreamIdRef.current) {
                console.log("Setting primary remote stream:", stream.id);
                primaryStreamIdRef.current = stream.id;
                setRemoteStream(stream);
            } else if (primaryStreamIdRef.current !== stream.id) {
                console.log("Setting secondary (screen) remote stream:", stream.id);
                setRemoteScreenStream(stream);
            } else {
                // Update primary stream (e.g. new tracks added to same stream)
                setRemoteStream(stream);
            }
        };

        // Add existing local tracks in explicit order
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
            localStreamRef.current.getVideoTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        return pc;
    };

    useEffect(() => {
        if (!roomId) return;

        socket.on("user:joined", async ({ id }) => {
            if (id === socket.id) return;
            console.log("User joined (" + id + "), initiating offer...");

            // Reset if different peer
            if (remotePeerIdRef.current && remotePeerIdRef.current !== id) {
                console.log("New peer detected, resetting connection.");
                if (peerRef.current) peerRef.current.close();
                peerRef.current = null;
                setRemoteStream(null);
                setRemoteScreenStream(null);
            }
            remotePeerIdRef.current = id;

            const pc = createPeer(id);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("signal", { roomId, signal: { type: "offer", sdp: offer } });
        });

        socket.on("signal", async ({ sender, signal }) => {
            if (sender === socket.id) return;

            // Check for peer change/restart
            if (remotePeerIdRef.current && remotePeerIdRef.current !== sender) {
                console.log("Signal from new/different peer (" + sender + "), resetting.");
                if (peerRef.current) peerRef.current.close();
                peerRef.current = null;
                setRemoteStream(null);
                setRemoteScreenStream(null);
                pendingCandidates.current = [];
            }
            remotePeerIdRef.current = sender;

            const pc = createPeer(sender);

            if (signal.type === "candidate") {
                if (pc.remoteDescription) {
                    try {
                        await pc.addIceCandidate(signal.candidate);
                    } catch (e) { console.error("Error adding candidate", e); }
                } else {
                    console.log("Queueing candidate");
                    pendingCandidates.current.push(signal.candidate);
                }
            } else if (signal.type === "offer") {
                console.log("Received offer from", sender);
                // Check if we have a stable connection and this offer looks weird?
                // For now, assume fresh negotiation handled by reset above.

                await pc.setRemoteDescription(signal.sdp);

                // Process pending candidates
                while (pendingCandidates.current.length > 0) {
                    const c = pendingCandidates.current.shift();
                    if (c) await pc.addIceCandidate(c);
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("signal", { roomId, signal: { type: "answer", sdp: answer } });
            } else if (signal.type === "answer") {
                console.log("Received answer from", sender);
                await pc.setRemoteDescription(signal.sdp);
            }
        });

        return () => {
            socket.off("user:joined");
            socket.off("signal");
            if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
            }
        };
    }, [roomId]);

    // Handle Screen Share
    const startShare = async () => {
        if (screenShareActiveRef.current) return;
        screenShareActiveRef.current = true;

        try {
            // Optimize for video sharing: 60fps, no audio processing
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 60, max: 60 }
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Hint to browser that we are sharing video/motion content
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack && "contentHint" in videoTrack) {
                // @ts-ignore - contentHint is standard but sometimes missing in TS types
                videoTrack.contentHint = "motion";
            }

            setScreenStream(stream);
            socket.emit("share:start");

            const pc = peerRef.current || createPeer();

            // Explicitly add Audio then Video to maintain consistent m-line ordering
            // preventing 'InvalidAccessError: m-line order mismatch'
            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();

            audioTracks.forEach(track => {
                pc.addTrack(track, stream);
                track.onended = () => stopShare();
            });

            videoTracks.forEach(track => {
                pc.addTrack(track, stream);
                track.onended = () => stopShare();
            });

            // Renegotiate
            console.log("Negotiating screen share...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("signal", { roomId, signal: { type: "offer", sdp: offer } });

        } catch (e) {
            console.error("Screen share failed", e);
            screenShareActiveRef.current = false;
        }
    };

    const stopShare = async () => {
        if (!screenStream) return;
        screenShareActiveRef.current = false;

        // Stop the tracks
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
        socket.emit("share:stop");

        if (peerRef.current) {
            const senders = peerRef.current.getSenders();

            for (const sender of senders) {
                if (sender.track && screenStream.getTracks().includes(sender.track)) {
                    try {
                        peerRef.current.removeTrack(sender);
                    } catch (e) {
                        console.error("Error removing track", e);
                    }
                }
            }

            // Renegotiate removal
            console.log("Negotiating screen stop...");
            try {
                const offer = await peerRef.current.createOffer();
                await peerRef.current.setLocalDescription(offer);
                socket.emit("signal", { roomId, signal: { type: "offer", sdp: offer } });
            } catch (e) {
                console.error("Renegotiation error (stopShare)", e);
            }
        }
    };

    // Toggle Media
    const toggleMic = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                socket.emit("media:toggle", { micMuted: !track.enabled, camOff: !localStreamRef.current.getVideoTracks()[0].enabled });
                useStore.getState().setMe({ micMuted: !track.enabled });
            }
        }
    };

    const toggleCam = () => {
        if (localStreamRef.current) {
            const track = localStreamRef.current.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                socket.emit("media:toggle", { micMuted: !localStreamRef.current.getAudioTracks()[0].enabled, camOff: !track.enabled });
                useStore.getState().setMe({ camOff: !track.enabled });
            }
        }
    };

    return {
        localStream,
        remoteStream,
        screenStream,
        remoteScreenStream,
        startShare,
        stopShare,
        toggleMic,
        toggleCam
    };
}
