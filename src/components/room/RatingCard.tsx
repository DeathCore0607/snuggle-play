"use client";

import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Star, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function RatingCard() {
    const { me, roomState } = useStore();
    const [trackInput, setTrackInput] = useState("");
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    if (!roomState || !me) return null;

    const isHost = me.role === "host";
    const myRating = roomState.ratings[me.id];

    // Reset when track changes (using useEffect on trackTitle)
    useEffect(() => {
        setConfirmed(false);
        setSelectedRating(null);
    }, [roomState.trackTitle]);

    // Check if we are confirmed but server says not yet (e.g. initial load or rejoin? No, local state should clear)
    // Actually, if track is same, keep confirmed.

    // Safety: If server HAS a rating for us, we should visually show it as confirmed even if local state lost (refresh)
    useEffect(() => {
        if (roomState.ratings[me.id] !== undefined && !confirmed) {
            setConfirmed(true);
            setSelectedRating(roomState.ratings[me.id]);
        }
    }, [roomState.ratings, me.id, confirmed]);

    // Check if partner rated (for "Partner Ready" indicator)
    const partnerId = roomState.users.find(u => u.id !== me.id)?.id;
    const partnerHasRated = partnerId ? roomState.ratings[partnerId] !== undefined : false;
    const partnerRating = partnerId ? roomState.ratings[partnerId] : undefined;

    // Reveal logic: simple check if both rated (server sends reveal event, but we can also check state)
    // For "See each rating" requirement:
    // If BOTH present in roomState, show them.
    const bothRated = myRating !== undefined && partnerRating !== undefined;

    const setTrack = () => {
        if (trackInput.trim()) {
            socket.emit("rating:setTrack", trackInput);
            setTrackInput("");
        }
    };

    const handleSelect = (val: number) => {
        if (confirmed) return;
        setSelectedRating(val);
    };

    const confirmRating = () => {
        if (selectedRating !== null) {
            setConfirmed(true);
            socket.emit("rating:submit", selectedRating);
        }
    };

    // Display:
    // If Confirmed: Show selected
    // If Not Confirmed: Show selected or empty
    const displayRating = selectedRating;

    return (

        <div className="glass-panel-container flex flex-col shrink-0 w-full mb-2">
            {/* Header / Track Title */}
            <div className="glass-tab-header justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-white/50 rounded-md shadow-sm">
                        <Music size={14} className="text-pink-500" />
                    </div>
                    <span>Rating Corner</span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {isHost && !roomState.trackTitle ? (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter track name..."
                            value={trackInput}
                            onChange={(e) => setTrackInput(e.target.value)}
                            className="glass-input h-9 text-sm"
                        />
                        <Button size="sm" onClick={setTrack} disabled={!trackInput} className="rounded-full h-9 px-4">Set</Button>
                    </div>
                ) : (
                    <div className="p-3 bg-lavender-50/50 dark:bg-slate-800/60 rounded-[20px] border border-lavender-100 dark:border-white/10 text-center shadow-inner relative group backdrop-blur-sm">
                        {roomState.trackTitle ? (
                            <>
                                <div className="text-[10px] text-lavender-400 dark:text-slate-400 uppercase tracking-widest font-bold mb-1">Current Track</div>
                                <div className="font-medium text-lavender-900 dark:text-slate-100 line-clamp-2">{roomState.trackTitle}</div>
                                {isHost && (
                                    <button onClick={() => socket.emit("rating:setTrack", "")} className="text-[10px] text-lavender-500 mt-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Change</button>
                                )}
                            </>
                        ) : (
                            <div className="text-sm text-lavender-400/70 dark:text-slate-400 italic">Waiting for host to set track...</div>
                        )}
                    </div>
                )}
            </div>

            {/* Rating Buttons */}
            <div className="px-4 pb-4 space-y-4 flex-1">
                {roomState.trackTitle && (
                    <div className={cn("transition-all", (confirmed && !bothRated) ? "opacity-90" : "")}>
                        <div className="flex justify-between mb-4 gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleSelect(num)}
                                    disabled={confirmed}
                                    className={cn(
                                        "w-full aspect-[2/3] rounded-full text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed flex items-center justify-center",
                                        selectedRating === num
                                            ? "bg-lavender-500 text-white shadow-lg ring-4 ring-lavender-200 dark:ring-lavender-900 scale-110 z-10"
                                            : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-700"
                                    )}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        {/* Confirm Action */}
                        {!confirmed && !bothRated && (
                            <div className="flex justify-center h-8">
                                {selectedRating && (
                                    <Button size="sm" onClick={confirmRating} className="animate-in fade-in slide-in-from-bottom-2 bg-gradient-to-r from-lavender-500 to-indigo-500 text-white shadow-md hover:shadow-lg border-none rounded-full px-8">
                                        Confirm Rating
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Status / Results */}
                <div className="grid grid-cols-2 gap-3">
                    {/* My Status */}
                    <div className={cn("p-4 rounded-[24px] text-center transition-all border", confirmed ? "bg-lavender-100/60 dark:bg-lavender-900/20 border-lavender-200 dark:border-lavender-500/30 shadow-inner" : "!bg-white dark:!bg-white/5 border-lavender-100 dark:border-white/10 shadow-sm")}>
                        <div className="text-[10px] text-lavender-400 dark:text-slate-400 uppercase font-black tracking-widest mb-1">You</div>
                        <div className={cn("text-4xl font-black transition-all", confirmed ? "text-lavender-500 dark:text-lavender-400" : "text-lavender-300/50 dark:text-slate-500")}>
                            {confirmed ? selectedRating : (selectedRating || "-")}
                        </div>
                        {confirmed && !bothRated && <div className="text-[9px] text-lavender-400 font-bold mt-1">LOCKED 🔒</div>}
                    </div>

                    {/* Partner Status */}
                    <div className="!bg-white dark:!bg-white/5 p-4 rounded-[24px] text-center relative overflow-hidden transition-all shadow-sm border border-lavender-100 dark:border-white/10">
                        <div className="text-[10px] text-lavender-400 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Partner</div>
                        <div className={cn("text-4xl font-black transition-all", bothRated ? "text-blue-500 dark:text-blue-400" : "text-lavender-300/50 dark:text-slate-500")}>
                            {bothRated ? partnerRating : (partnerHasRated ? "?" : "-")}
                        </div>
                        {!bothRated && partnerHasRated && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-[4px]">
                                <div className="flex flex-col items-center animate-bounce">
                                    <span className="text-2xl drop-shadow-md">✨</span>
                                    <span className="text-[10px] font-black text-lavender-600 dark:text-slate-300 uppercase tracking-wider">Ready</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {confirmed && !bothRated && !partnerHasRated && roomState.trackTitle && (
                    <div className="text-center text-xs text-slate-400 italic animate-pulse">
                        Waiting for partner...
                    </div>
                )}
            </div>
        </div>
    );
}
