"use client";

import { GameState, User } from "@/lib/types";

type Props = {
    roomId: string;
    socket: any;
    gameState: GameState;
    users: User[];
};

export default function TicTacToe({ roomId, socket, gameState, users }: Props) {
    const { board, activePlayerId, winner, isDraw, participants } = gameState;
    const isMyTurn = socket.id === activePlayerId;
    const isParticipant = participants.includes(socket.id);

    function handleClick(i: number) {
        if (!isParticipant) return;
        if (!isMyTurn || board[i] || winner) return;

        socket.emit("game:move", i);
    }

    function reset() {
        socket.emit("game:reset");
    }

    // Determine message
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
        <div className="w-[400px] text-center">
            <h2 className="text-2xl font-bold mb-6 text-pink-200">Tic Tac Toe</h2>

            <div className="grid grid-cols-3 gap-4">
                {board.map((cell: string | null, i: number) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        disabled={!isMyTurn || !!winner || !!activePlayerId && !isParticipant}
                        className={`w-28 h-28 text-5xl rounded-2xl backdrop-blur-md transition flex items-center justify-center
                ${cell
                                ? "bg-white/20"
                                : "bg-white/10 hover:bg-white/20"}
                ${(!isMyTurn && !winner) ? "cursor-not-allowed opacity-80" : ""}
            `}
                    >
                        {cell === "heart" && (
                            <img src="/host-player.jpg" alt="Host" className="w-full h-full object-cover rounded-xl shadow-sm" />
                        )}
                        {cell === "crown" && (
                            <img src="/guest-player.jpg" alt="Guest" className="w-full h-full object-cover rounded-xl shadow-sm" />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                <div className="text-xl font-semibold text-white/90 animate-pulse">
                    {statusMsg}
                </div>
            </div>

            {isParticipant && (winner || isDraw) && (
                <button
                    onClick={reset}
                    className="mt-6 px-6 py-2 rounded-xl bg-pink-500/30 hover:bg-pink-500/40 transition text-white font-medium"
                >
                    Play Again
                </button>
            )}
        </div>
    );
}
