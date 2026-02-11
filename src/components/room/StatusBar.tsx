"use client";

import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { Copy, Check, Wifi, Globe, Share2, Mic, MicOff, Video, VideoOff, Sun, Moon, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { cn } from "@/lib/utils";
import { ValentineOverlay } from "@/components/room/ValentineOverlay";

export function StatusBar() {
    const { roomState, isConnected, me } = useStore();
    const [copied, setCopied] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isValentineActive, setIsValentineActive] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }

        const onValentine = () => {
            console.log("Valentine event received!");
            setIsValentineActive(true);
        };

        socket.on("room:valentine", onValentine);

        return () => {
            socket.off("room:valentine", onValentine);
        };
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setIsDarkMode(true);
        }
    };

    const handleCopy = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!roomState) return null;

    return (
        <>
            <div className="h-16 bg-white/80 backdrop-blur-[32px] border-b border-white/20 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm transition-all text-slate-800">
                {/* Left: Room Info */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold text-lg shadow-md rotate-[-3deg] hover:rotate-0 transition-transform">
                            SP
                        </div>
                    </div>

                    <div className="h-5 w-px bg-slate-300 mx-2" />

                    <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5 text-sm font-semibold">
                            <span className="text-slate-800">Snuggle Room</span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-slate-500">{roomState.roomId}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Controls & Status */}
                <div className="flex items-center space-x-3">


                    {/* Users Avatars - Initials Only */}
                    <div className="flex items-center -space-x-2 mr-4 pl-2 h-full">
                        {roomState.users.map((u) => (
                            <div key={u.id} className="relative group flex items-center justify-center">
                                <div className={cn(
                                    "w-9 h-9 rounded-full border-[2px] flex items-center justify-center text-xs font-bold shadow-sm relative overflow-hidden bg-surface-elevated backdrop-blur-sm transition-transform hover:scale-105 z-10",
                                    u.role === "host" ? "border-purple-400 text-purple-600 dark:text-purple-300" : "border-amber-400 text-amber-600 dark:text-amber-300"
                                )}>
                                    {u.name.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Hover Status Card (Liquid Glass) */}
                                <div className="absolute top-full right-0 mt-4 w-max min-w-[120px] glass-card p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col gap-2 translate-y-2 group-hover:translate-y-0 shadow-glass border border-border bg-surface-elevated backdrop-blur-xl rounded-xl">
                                    <div className="text-xs font-bold text-primary truncate px-1 text-center">{u.name}</div>
                                    <div className="flex justify-center gap-2">
                                        <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", u.role === "host" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300")}>
                                            {u.role === "host" ? "Host" : "Guest"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Share Actions - Host Only */}
                    {/* Theme Toggle & Share Actions */}
                    <div className="flex items-center gap-3">
                        <ThemeSwitch checked={isDarkMode} onChange={toggleTheme} />

                        <button
                            onClick={() => {
                                console.log("Emitting room:valentine");
                                socket.emit("room:valentine");
                            }}
                            disabled={isValentineActive}
                            style={{ fontSize: "14px" }}
                            className={cn(
                                "hidden sm:flex items-center justify-center relative transition-all duration-300 transform active:scale-95",
                                "w-[5.625em] h-[2.5em]",
                                isValentineActive && "opacity-50 cursor-not-allowed grayscale"
                            )}
                        >
                            <img
                                src="/valentine-icon.svg"
                                alt="Valentine"
                                className={cn(
                                    "w-10 h-10 z-10 drop-shadow-sm transition-transform duration-300",
                                    !isValentineActive && "animate-pulse hover:scale-110 hover:-rotate-6"
                                )}
                            />
                        </button>

                        {me?.role === "host" && (
                            <div className="flex items-center bg-surface-elevated/80 dark:bg-surface-elevated/40 backdrop-blur-md border border-border rounded-full p-1 pl-3 shadow-sm mr-2 transition-all hover:bg-surface-elevated group">
                                <span className="text-[10px] font-extrabold text-muted mr-2 hidden sm:inline tracking-wider group-hover:text-primary transition-colors">INVITE</span>
                                <div className="text-[11px] text-secondary font-bold font-mono select-all mr-3 max-w-[120px] truncate hidden sm:block">
                                    {typeof window !== 'undefined' ? `${window.location.host}/room/${roomState.roomId}#secret=${useStore.getState().secret?.slice(0, 4)}...` : ""}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={handleCopy}
                                    className="h-7 text-[10px] px-3 rounded-full bg-surface hover:bg-surface-hover text-primary hover:shadow-md border border-border transition-all font-semibold"
                                >
                                    {copied ? <Check size={12} className="mr-1 text-emerald-500" /> : <Copy size={12} className="mr-1 opacity-70" />}
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isValentineActive && (
                <ValentineOverlay onComplete={() => setIsValentineActive(false)} />
            )}
        </>
    );
}
