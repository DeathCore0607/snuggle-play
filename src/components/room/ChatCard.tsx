"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatCard() {
    const { messages, me } = useStore();
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        socket.emit("chat:send", input.trim());
        setInput("");
    };

    return (

        <div className="glass-panel-container h-[600px] shrink-0 w-full group">
            {/* Subtle Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Tab Header */}
            <div className="glass-tab-header">
                <div className="p-1 bg-white/50 rounded-md shadow-sm">
                    <MessageSquare size={14} className="text-violet-500" />
                </div>
                <span>Chat</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-4 scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-transparent z-10">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                        <div className="text-4xl opacity-50">💭</div>
                        <div className="text-xs font-medium opacity-60">No messages yet. Say hi!</div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === me?.id;
                        return (
                            <div key={msg.id} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "max-w-[85%] px-4 py-2.5 text-sm shadow-sm backdrop-blur-sm border transition-all hover:scale-[1.02]",
                                    isMe
                                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-[1.2rem] rounded-tr-sm border-white/20 shadow-violet-500/10"
                                        : "bg-white/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-100 rounded-[1.2rem] rounded-tl-sm border-white/60 dark:border-white/20 shadow-sm"
                                )}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 px-1 font-medium">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div >

            <div className="p-3 bg-white/20 border-t border-white/20 z-10">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Type a message..."
                            className="glass-input pl-4 pr-10"
                        />
                    </div>
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 border border-white/20 shadow-md hover:rotate-6 transition-transform"
                    >
                        <Send size={16} className="ml-0.5 text-white" />
                    </Button>
                </div>
            </div>
        </div >
    );

}
