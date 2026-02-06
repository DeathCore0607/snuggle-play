"use client";

import { useStore } from "@/lib/store";
import { Copy, Check, Wifi, Globe, Share2, Mic, MicOff, Video, VideoOff, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { cn } from "@/lib/utils";

export function StatusBar() {
    const { roomState, isConnected, me } = useStore();
    const [copied, setCopied] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check local storage or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
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

                    {me?.role === "host" && (
                        <button
                            onClick={handleCopy}
                            className="btn-secondary !h-9 !px-4 !text-xs hidden sm:flex items-center gap-2 hover:!bg-surface-elevated"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                            {copied ? "Copied 💕" : "Invite"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
