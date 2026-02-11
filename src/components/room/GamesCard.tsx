"use client";

import { useState, useEffect } from "react";
import TicTacToe from "./games/TicTacToe";
import Connect4 from "./games/Connect4";
import { GameState, User } from "@/lib/types";
import { Gamepad2, X, Circle, Disc } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
    roomId: string;
    socket: any;
    users: User[];
};

export default function GamesCard({ roomId, socket, users }: Props) {
    const [activeGame, setActiveGame] = useState<"ttt" | "c4" | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        if (!socket) return;

        const onGameStarted = (state: GameState) => {
            setGameState(state);
            setActiveGame(state.type);
        };

        const onGameUpdate = (state: GameState) => {
            setGameState(state);
        };

        const onGameClosed = () => {
            setGameState(null);
            setActiveGame(null);
        };

        socket.on("game:started", onGameStarted);
        socket.on("game:update", onGameUpdate);
        socket.on("game:closed", onGameClosed);

        return () => {
            socket.off("game:started", onGameStarted);
            socket.off("game:update", onGameUpdate);
            socket.off("game:closed", onGameClosed);
        };
    }, [socket]);

    const startGame = (type: "ttt" | "c4") => {
        socket.emit("game:start", type);
    };

    const closeGame = () => {
        socket.emit("game:close");
    };

    return (
        <>
            <div className="glass-panel-container flex flex-col shrink-0 w-full mb-2">
                {/* Header */}
                <div className="glass-tab-header justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-surface rounded-md shadow-sm">
                            <Gamepad2 size={14} className="text-purple-500" />
                        </div>
                        <span>Games</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex gap-4 overflow-x-auto">
                    <button
                        onClick={() => startGame("ttt")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-pink-50/50 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 border border-pink-100 dark:border-pink-900/30 transition-all shadow-sm active:scale-95 group"
                    >
                        <div className="flex -space-x-1">
                            <X size={16} className="text-pink-400 group-hover:rotate-12 transition-transform" />
                            <Circle size={16} className="text-pink-500 group-hover:-rotate-12 transition-transform" />
                        </div>
                        {/* <span className="text-sm font-bold text-pink-700 dark:text-pink-300">Tic Tac Toe</span> */}
                    </button>

                    <button
                        onClick={() => startGame("c4")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100/50 dark:hover:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 transition-all shadow-sm active:scale-95 group"
                    >
                        <div className="flex -space-x-2">
                            <div className="w-4 h-4 rounded-full bg-red-400 border border-white/20 shadow-sm group-hover:translate-y-1 transition-transform" />
                            <div className="w-4 h-4 rounded-full bg-purple-400 border border-white/20 shadow-sm group-hover:-translate-y-1 transition-transform" />
                        </div>
                        {/* <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Connect 4</span> */}
                    </button>
                </div>
            </div>

            {activeGame && gameState && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="relative bg-surface-elevated backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <button
                            onClick={closeGame}
                            className="absolute top-4 right-5 p-2 rounded-full hover:bg-white/10 text-muted hover:text-primary transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {activeGame === "ttt" && (
                            <TicTacToe roomId={roomId} socket={socket} gameState={gameState} users={users} />
                        )}

                        {activeGame === "c4" && (
                            <Connect4 roomId={roomId} socket={socket} gameState={gameState} users={users} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
