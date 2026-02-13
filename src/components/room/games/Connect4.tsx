"use client";

import { GameState, User } from "@/lib/types";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

const ROWS = 6;
const COLS = 7;

type Props = {
    roomId: string;
    socket: any;
    gameState: GameState;
    users: User[];
};

export default function Connect4({ roomId, socket, gameState, users }: Props) {
    const { board, activePlayerId, winner, isDraw, participants } = gameState;
    const isMyTurn = socket.id === activePlayerId;
    const isParticipant = participants.includes(socket.id);

    function drop(col: number) {
        if (!isParticipant) return;
        if (!isMyTurn || winner || isDraw) return;
        socket.emit("game:move", col);
    }

    let statusMsg = "";
    if (winner) {
        statusMsg = winner === socket.id ? "🎉 You Won! 🎉" : "👑 Opponent Won!";
    } else if (isDraw) {
        statusMsg = "It's a Draw! 🤝";
    } else {
        if (isMyTurn) {
            statusMsg = "Your Turn!";
        } else {
            // Find active player name
            const activeUser = users.find(u => u.id === activePlayerId);
            statusMsg = activeUser ? `${activeUser.name}'s Turn` : "Opponent's Turn";
        }
    }

    return (
        <div className="w-[500px]">
            <h2 className="text-2xl font-bold mb-6 text-purple-200 text-center">
                Connect 4
            </h2>

            <div className="grid grid-cols-7 gap-3 bg-white/10 p-6 rounded-[32px] backdrop-blur-md shadow-inner border border-white/5">
                {board.map((row: any[], rIdx: number) =>
                    row.map((cell: string | null, cIdx: number) => (
                        <div
                            key={`${rIdx}-${cIdx}`}
                            onClick={() => drop(cIdx)}
                            className={`w-14 h-14 rounded-full bg-black/30 flex items-center justify-center 
                  ${(isMyTurn && !winner) ? "cursor-pointer hover:bg-black/40" : "cursor-default"}`}
                        >
                            {cell && (

                                <motion.div
                                    initial={{ y: -300, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className="w-12 h-12 flex items-center justify-center relative"
                                >
                                    <Heart
                                        className={`w-10 h-10 drop-shadow-md ${cell === "pink" ? "text-red-500 fill-red-500" : "text-blue-500 fill-blue-500"}`}
                                    />
                                    <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
                                </motion.div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 text-center">
                <div className="text-xl font-semibold text-white/90 animate-pulse">
                    {statusMsg}
                </div>
            </div>
        </div>
    );
}
