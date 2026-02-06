"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Heart, Play, ArrowRight, UserCircle2, Sparkles, Link as LinkIcon, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["e.g. Shawtyy 💕", "e.g. Cutieee ✨", "e.g. Sweetie 🫶", "e.g. Princess 💖", "e.g. My Love 🌹"];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    setIsLoading(true);
    const roomId = uuidv4().slice(0, 8);
    const secret = uuidv4().replace(/-/g, "");
    localStorage.setItem("snuggle_name", name);
    router.push(`/room/${roomId}#secret=${secret}`);
  };

  const handleJoin = () => {
    if (!name.trim() || !joinLink.trim()) return;
    setIsLoading(true);
    localStorage.setItem("snuggle_name", name);
    try {
      let url = joinLink.startsWith("http") ? new URL(joinLink) : new URL(joinLink, window.location.origin);
      const hash = url.hash;
      if (!hash.includes("secret=")) {
        alert("Invalid invite link. Please make sure to copy the full link!");
        setIsLoading(false);
        return;
      }
      router.push(url.pathname + hash);
    } catch (e) {
      alert("Invalid link format");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden text-slate-700 dark:text-slate-700 !bg-[#f8faff]">
      {/* Force Light Mode Background */}
      <div className="absolute inset-0 z-0 opacity-100 pointer-events-none" style={{
        background: `
          radial-gradient(at 0% 0%, rgba(248, 204, 252, 0.5) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(196, 235, 255, 0.5) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(252, 231, 243, 0.5) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(221, 214, 254, 0.5) 0px, transparent 50%)
        `
      }} />

      {/* Background radial glow behind card to hug it */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/40 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Glass Card - Fixed to Light Theme */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full z-10 p-8 text-center relative mx-auto bg-white/40 backdrop-blur-[32px] border border-white/40 rounded-[30px] shadow-[0_30px_80px_rgba(0,0,0,0.1)] hover:bg-white/50 hover:-translate-y-[2px] hover:shadow-[0_35px_90px_rgba(0,0,0,0.12)] transition-all duration-300"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-400/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-4 shadow-sm border border-white/50 backdrop-blur-md animate-heartbeat">
              <Heart className="text-rose-500 fill-rose-500/20" size={28} strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-br from-violet-600 to-rose-500 bg-clip-text text-transparent mb-3 tracking-tight pb-2">
            SnugglePlay
          </h1>

          <p className="text-slate-500 dark:text-slate-500 text-[15px] leading-relaxed max-w-[90%] font-medium">
            Press play together, laugh together, react together, even when you’re miles apart 💞
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-2 font-medium tracking-wide uppercase opacity-80">Made for just the two of us 💖</p>
        </div>

        {/* Form Section */}
        <div className="space-y-6">

          {/* Name Input */}
          <div className="space-y-2 text-left relative z-20">
            <label className="text-sm font-bold text-slate-500 dark:text-slate-500 ml-4">Please enter your name or should I call you MINE 😏</label>
            <div className="relative group">
              <UserCircle2 className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-400 group-focus-within:text-violet-400 transition-colors" size={20} />
              <input
                className="w-full h-12 px-6 pl-12 rounded-full bg-white/40 backdrop-blur-md border border-white/40 text-black dark:text-black placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-300/50 focus:bg-white/60 transition-all shadow-inner font-medium"
                placeholder={PLACEHOLDERS[placeholderIndex]}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 text-center font-medium">This is how your partner will see you</p>
          </div>

          <div className="pt-2">
            {!isJoining ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Create Room Button */}
                <button
                  onClick={handleCreate}
                  disabled={!name}
                  className="relative w-full h-14 rounded-full bg-gradient-to-r from-violet-500 to-rose-400 text-white font-bold text-lg shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-300/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group overflow-hidden border border-white/20"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create Our Room <Heart size={18} className="fill-white/30" />
                  </span>

                  {/* Sheen effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                </button>

                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">You&apos;ll get a private link to share</p>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white/20 backdrop-blur-sm text-[11px] text-slate-400 dark:text-slate-400 rounded-full">or join your person ✨</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsJoining(true)}
                  className="relative w-full h-14 rounded-full bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/15 backdrop-blur-md text-slate-600 font-bold text-lg shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/40 dark:hover:bg-white/20 hover:-translate-y-[1px] hover:shadow-[0_15px_35px_rgba(0,0,0,0.12)] active:translate-y-0 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group overflow-hidden flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Join with Invite Link
                    <Heart size={16} strokeWidth={2.5} className="text-rose-400/80 group-hover:text-rose-500 transition-colors" />
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-500 ml-4 uppercase tracking-wider">Invite Link</label>
                  <div className="relative group">
                    <LinkIcon className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-400 group-focus-within:text-violet-400 transition-colors" size={18} />
                    <input
                      className="w-full h-12 px-6 pl-12 rounded-full bg-white/40 backdrop-blur-md border border-white/40 text-black dark:text-black placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-300/50 focus:bg-white/60 transition-all shadow-inner font-medium"
                      placeholder="Paste the invite your person sent 💌"
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 text-center font-medium">If they made the room, your spot is ready.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setIsJoining(false)}
                    className="h-12 rounded-full text-slate-500 dark:text-slate-500 font-medium hover:bg-white/30 hover:text-slate-700 dark:hover:text-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleJoin}
                    disabled={!name || !joinLink}
                    className="h-12 rounded-full bg-gradient-to-r from-violet-500 to-rose-400 text-white font-bold shadow-lg shadow-violet-200/50 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Joining..." : "Join Room 💞"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-8 text-xs text-slate-400/80 dark:text-slate-400/80 font-medium drop-shadow-sm z-10"
      >
        Built with 💖 for just the two of us
      </motion.p>
    </main>
  );
}
