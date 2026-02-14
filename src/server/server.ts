import { createServer } from "node:http";
import next from "next";
import { Server, Socket } from "socket.io";
import { parse } from "node:url";
import {
    ServerToClientEvents,
    ClientToServerEvents,
    RoomState,
    User,
    Role,
    LogEntry,
    ChatMessage,
    PuzzleState
} from "../lib/types"; // We will need to fix this import path if types are cleaner elsewhere, but they are in src/lib/types.ts which translates to ../lib/types relative to src/server
import { v4 as uuidv4 } from "uuid";

// Since we are running with tsx in src/server/server.ts, we need to make sure we can import from ../lib/types.
// However, tsx might handle ts imports fine. 
// If specific alias mapping is needed, we might need to rely on tsconfig-paths or just relative. Relative is safest.

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Server-side types
interface ServerRoom extends RoomState {
    secret: string;
    activityLog: LogEntry[];
    createdAt: number;
    crownTimeout?: NodeJS.Timeout;
}

const rooms = new Map<string, ServerRoom>();

app.prepare().then(() => {
    const httpServer = createServer();

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Attach Next.js handler manually
    httpServer.on("request", (req, res) => {
        const parsedUrl = parse(req.url!, true);
        // Important: Socket.IO attaches its own listener to 'request'.
        // We only want to handle non-socket requests here.
        if (parsedUrl.pathname?.startsWith("/socket.io")) {
            return;
        }
        handle(req, res, parsedUrl);
    });

    io.on("connection", (socket) => {
        let currentRoomId: string | null = null;
        let currentUser: User | null = null;

        const logActivity = (roomId: string, type: LogEntry["type"], message: string, icon?: string) => {
            const room = rooms.get(roomId);
            if (!room) return;

            const entry: LogEntry = {
                id: uuidv4(),
                timestamp: Date.now(),
                type,
                message,
                icon
            };

            room.activityLog.unshift(entry);
            if (room.activityLog.length > 200) room.activityLog.pop();

            // Notify host only
            const host = room.users.find(u => u.role === "host");
            if (host) {
                io.to(host.id).emit("activity:log", [entry]); // Incremental update or full? Let's send delta or just handle it on client. 
                // For simplicity, let's just emit the new entry in an array, client prepends.
            }
        };

        socket.on("room:join", ({ roomId, secret, name }, callback) => {
            // Create room if not exists and no secret provided (implies new room request, though client usually generates secret? 
            // Actually plan said: "On Create: generate roomId + secret token". 
            // So client sends { roomId, secret, name }.

            let room = rooms.get(roomId);
            let role: Role = "guest";

            if (!room) {
                // If room doesn't exist, we must be the host creating it, OR it's an invalid join.
                // But the client usually decides if it's creating or joining.
                // Let's assume if it doesn't exist AND we have a secret, we create it.
                // Or strict mode: Room creation happens explicitly? 
                // Plan: "Store rooms in memory... on Create generate roomId + secret". 
                // Let's treat the first join with a secret as creation if it doesn't exist.

                if (!secret) {
                    callback({ status: "error", error: "Room not found" });
                    return;
                }

                role = "host";
                room = {
                    roomId,
                    secret,
                    users: [],
                    isScreenSharing: false,
                    sharerId: null,
                    trackTitle: "",
                    ratings: {},
                    activityLog: [],
                    createdAt: Date.now(),
                    crownedUserId: null,
                    gameState: null,
                    puzzle: {
                        tiles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
                        revision: 0,
                        moveCount: 0,
                        status: "idle"
                    }
                };
                rooms.set(roomId, room);
                logActivity(roomId, "join", `Room created by ${name}`, "✨");
            } else {
                // Room exists
                if (room.secret !== secret) {
                    callback({ status: "error", error: "Invalid secret" });
                    return;
                }

                const hasHost = room.users.some(u => u.role === "host");
                role = hasHost ? "guest" : "host";
            }

            currentRoomId = roomId;

            // Handle Reconnection / Duplicate Joins
            // We verify by NAME for this simple app to handle React Strict Mode or fast refreshes where socket ID changes
            const existingUserIndex = room.users.findIndex(u => u.name === name);

            if (existingUserIndex !== -1) {
                // User with same name is already in.
                // We assume it's the same person reconnecting or strict mode double-invoking.
                // Upgrade their socket ID to the new one.
                const existingUser = room.users[existingUserIndex];

                // Preserve the role! If they were host, they stay host.
                role = existingUser.role;

                // Update the user object
                currentUser = {
                    ...existingUser,
                    id: socket.id, // Update to new socket
                    micMuted: false, // Reset or keep? Let's reset for now or keep existingUser.micMuted if we monitored it.
                    camOff: false
                };

                room.users[existingUserIndex] = currentUser;

                // We do NOT need to check room.users.length >= 2 here because we are REPLACING.
            } else {
                // New User
                if (room.users.length >= 2) {
                    callback({ status: "error", error: "Room is full (max 2)" });
                    return;
                }

                // Join logic for new user
                currentUser = {
                    id: socket.id,
                    name,
                    role,
                    micMuted: false,
                    camOff: false
                };
                room.users.push(currentUser);
            }
            socket.join(roomId);

            // Broadcast update
            io.to(roomId).emit("room:state", room);
            io.to(roomId).emit("user:joined", { id: currentUser.id, name });

            logActivity(roomId, "join", `${name} joined as ${role}`, role === "host" ? "👑" : "👋");

            callback({ status: "ok", role });
        });

        socket.on("chat:send", (text) => {
            if (!currentRoomId || !currentUser) return;

            const msg: ChatMessage = {
                id: uuidv4(),
                senderId: currentUser.id,
                senderName: currentUser.name,
                text,
                timestamp: Date.now()
            };

            io.to(currentRoomId).emit("chat:message", msg);
            // Optional logging
            // logActivity(currentRoomId, "log", `${currentUser.name}: ${text}`);
        });

        socket.on("reaction:send", (emoji) => {
            if (!currentRoomId || !currentUser) return;
            io.to(currentRoomId).emit("reaction:show", { senderId: currentUser.id, emoji });
        });

        socket.on("media:toggle", ({ micMuted, camOff }) => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const user = room.users.find(u => u.id === socket.id);
            if (user) {
                if (user.micMuted !== micMuted) logActivity(currentRoomId, "media", `${user.name} ${micMuted ? "muted" : "unmuted"} mic`, micMuted ? "🔇" : "🎙️");
                if (user.camOff !== camOff) logActivity(currentRoomId, "media", `${user.name} turn ${camOff ? "off" : "on"} camera`, camOff ? "📷" : "📸");

                user.micMuted = micMuted;
                user.camOff = camOff;
                io.to(currentRoomId).emit("room:state", room);
            }
        });

        socket.on("share:start", () => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.isScreenSharing = true;
            room.sharerId = socket.id;
            io.to(currentRoomId).emit("room:state", room);
            io.to(currentRoomId).emit("share:started", socket.id);

            logActivity(currentRoomId, "share", `${currentUser.name} started screen sharing`, "💻");
        });

        socket.on("share:stop", () => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.isScreenSharing = false;
            room.sharerId = null;
            io.to(currentRoomId).emit("room:state", room);
            io.to(currentRoomId).emit("share:stopped");

            logActivity(currentRoomId, "share", `${currentUser.name} stopped sharing`, "⏹️");
        });

        socket.on("room:crown", (targetUserId) => {
            if (!currentRoomId || !currentUser || currentUser.role !== "host") return;
            const roomId = currentRoomId; // Capture locally
            const room = rooms.get(roomId);
            if (!room) return;

            // Clear existing timeout if any
            if (room.crownTimeout) {
                clearTimeout(room.crownTimeout);
                room.crownTimeout = undefined;
            }

            // Apply Crown
            room.crownedUserId = targetUserId;
            // const targetUser = room.users.find(u => u.id === targetUserId);
            // logActivity(roomId, "crown", `Queen ${targetUser?.name || "Guest"} was crowned!`, "👸");

            io.to(roomId).emit("room:state", room);
            console.log(`[Crown] Applied to ${targetUserId} in room ${roomId}`);

            // Auto-remove after 5 seconds
            room.crownTimeout = setTimeout(() => {
                const r = rooms.get(roomId);
                if (r) {
                    console.log(`[Crown] Timeout fired for room ${roomId}. Current crowned: ${r.crownedUserId}, Target: ${targetUserId}`);
                    if (r.crownedUserId === targetUserId) {
                        r.crownedUserId = null;
                        r.crownTimeout = undefined;
                        io.to(roomId).emit("room:state", r);
                        console.log(`[Crown] Removed from ${targetUserId}`);
                    }
                } else {
                    console.log(`[Crown] Room ${roomId} not found during timeout`);
                }
            }, 5000);
        });

        socket.on("rating:setTrack", (title) => {
            if (!currentRoomId || !currentUser || currentUser.role !== "host") return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.trackTitle = title;
            // Reset ratings when track changes? Maybe.
            room.ratings = {};
            io.to(currentRoomId).emit("room:state", room);
            logActivity(currentRoomId, "rating", `Track: "${title}"`, "🎵");
        });

        socket.on("rating:submit", (value) => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            room.ratings[socket.id] = value;

            // Check how many have rated
            const ids = Object.keys(room.ratings);

            if (ids.length < 2) {
                // Notify that someone rated, but don't reveal values yet
                // We can either update room state (if we don't care about secrecy) 
                // OR emit a specific event. 
                // To keep it simple and fun, we update room state but client handles "blurring" until reveal?
                // User asked for "only enable ... close ... once both confirm ... we can see".
                // Let's emit a progress event so clients know to show "Partner Rated!" badge.
                io.to(currentRoomId).emit("rating:progress", { raterId: socket.id });

                // Also emit room state so late joiners/refreshes have the data (client should hide it if active)
                // Actually, if we send the data, a smart user can see it. 
                // But for MVP, let's send it. The client `RatingCard` will check if `roomObject.ratings` has 2 entries.
                // If not 2 entries, it hides the partner's value.
                io.to(currentRoomId).emit("room:state", room);
                // User asked for rating value to be visible in log immediately
                logActivity(currentRoomId, "rating", `${currentUser.name} rated ${value}/10`, "📥");
            } else {
                // Both rated!
                io.to(currentRoomId).emit("room:state", room); // Ensure everyone has latest

                const ratings = Object.values(room.ratings);
                // Emit reveal with the specific values for animation
                io.to(currentRoomId).emit("rating:reveal", {
                    ratings: room.ratings
                });

                const diff = Math.abs(ratings[0] - ratings[1]);
                let logEmoji = "⚖️";
                if (diff === 0) logEmoji = "🔥";
                else if (diff <= 2) logEmoji = "✨";

                logActivity(currentRoomId, "rating", `Ratings Revealed: ${ratings[0]} vs ${ratings[1]} (Diff: ${diff})`, logEmoji);
            }
        });

        socket.on("activity:fetch", () => {
            if (!currentRoomId || !currentUser || currentUser.role !== "host") return;
            const room = rooms.get(currentRoomId);
            if (room) {
                socket.emit("activity:log", room.activityLog);
            }
        });

        socket.on("signal", ({ roomId, signal }) => {
            socket.to(roomId).emit("signal", { sender: socket.id, signal });
        });

        socket.on("game:start", (type) => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            // Only allow start if 2 players? Or allow solo testing? User said "synced with both users".
            // Let's allow solo for now but logic works best with 2.
            // Requirement: "first turn will be of the one who startes"
            // "next turn will be of the other person"

            const p1 = socket.id;
            const otherPlayer = room.users.find(u => u.id !== socket.id);
            const p2 = otherPlayer ? otherPlayer.id : null;

            // If no second player, p2 is null? Or just user plays alone?
            // "if any one of the users starts a game, it should also open on the other users screen"

            const participants = [p1];
            if (p2) participants.push(p2);

            // Handle Puzzle Start
            if (type === "puzzle") {
                console.log(`[Game] Shuffle requested for room ${currentRoomId}`);
                // Shuffle the puzzle immediately
                const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
                let emptyIdx = 8;
                let lastEmptyIdx = -1;

                for (let i = 0; i < 80; i++) {
                    const row = Math.floor(emptyIdx / 3);
                    const col = emptyIdx % 3;
                    const candidates = [];

                    if (row > 0) candidates.push(emptyIdx - 3);
                    if (row < 2) candidates.push(emptyIdx + 3);
                    if (col > 0) candidates.push(emptyIdx - 1);
                    if (col < 2) candidates.push(emptyIdx + 1);

                    const validCandidates = candidates.filter(c => c !== lastEmptyIdx);
                    // Fallback to all candidates if validCandidates is empty (shouldn't happen in grid > 1x1)
                    const nextIdx = validCandidates.length > 0
                        ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
                        : candidates[Math.floor(Math.random() * candidates.length)];

                    [tiles[emptyIdx], tiles[nextIdx]] = [tiles[nextIdx], tiles[emptyIdx]];
                    lastEmptyIdx = emptyIdx;
                    emptyIdx = nextIdx;
                }

                console.log(`[Game] Shuffled tiles: ${tiles.join(",")}`);

                room.puzzle = {
                    tiles,
                    revision: room.puzzle.revision + 1,
                    moveCount: 0,
                    status: "active"
                };

                room.gameState = {
                    type: "puzzle",
                    activePlayerId: p1,
                    participants,
                    board: [], // Puzzle state is separate, but we set this to trigger UI
                    winner: null,
                    isDraw: false
                };

                io.to(currentRoomId).emit("game:started", room.gameState);
                io.to(currentRoomId).emit("puzzle:state", { state: room.puzzle });
                logActivity(currentRoomId, "match", `${currentUser.name} started the Puzzle`, "🎁");
                return;
            }

            let initialBoard: any;
            if (type === "ttt") initialBoard = Array(9).fill(null);
            if (type === "c4") initialBoard = Array.from({ length: 6 }, () => Array(7).fill(null));

            room.gameState = {
                type,
                activePlayerId: p1,
                participants,
                board: initialBoard,
                winner: null,
                isDraw: false
            };

            io.to(currentRoomId).emit("game:started", room.gameState);
            logActivity(currentRoomId, "match", `${currentUser.name} started ${type === "ttt" ? "Tic Tac Toe" : "Connect 4"}`, "🎮");
        });

        socket.on("game:move", (move) => {
            if (!currentRoomId || !currentUser) return;
            const room = rooms.get(currentRoomId);
            if (!room || !room.gameState) return;

            const game = room.gameState;

            // Validate turn
            if (game.activePlayerId !== socket.id) return;
            if (game.winner || game.isDraw) return;
            if (game.type === "puzzle") return; // Puzzle uses separate handlers

            // Apply move based on game type
            if (game.type === "ttt") {
                const index = move as number;
                if (game.board[index]) return; // Occupied

                // Mark spot
                // In TTT: p1 is "heart", p2 is "crown". 
                // We need to store who is who? 
                // Or just: activePlayerId is current symbol.
                // Let's store symbol? 
                // Or easier: participants[0] = heart, participants[1] = crown.
                const isP1 = socket.id === game.participants[0];
                const symbol = isP1 ? "heart" : "crown";

                game.board[index] = symbol;

                // Check win
                const wins = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8],
                    [0, 3, 6], [1, 4, 7], [2, 5, 8],
                    [0, 4, 8], [2, 4, 6]
                ];

                let won = false;
                for (let [a, b, c] of wins) {
                    if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
                        won = true;
                        game.winner = socket.id;
                        break;
                    }
                }

                if (!won && !game.board.includes(null)) {
                    game.isDraw = true;
                }

                // Switch turn
                if (!won && !game.isDraw) {
                    // Find next player
                    const nextPlayer = game.participants.find(id => id !== socket.id);
                    if (nextPlayer) game.activePlayerId = nextPlayer;
                    // If single player, keep turn?
                    else game.activePlayerId = socket.id;
                }

            } else if (game.type === "c4") {
                const col = move as number;
                // Connect 4 logic
                // Board is 6 rows, 7 cols
                const board = game.board;
                // Find row
                let placedRow = -1;
                for (let r = 5; r >= 0; r--) {
                    if (!board[r][col]) {
                        const isP1 = socket.id === game.participants[0];
                        const color = isP1 ? "pink" : "purple";
                        board[r][col] = color;
                        placedRow = r;
                        break;
                    }
                }

                if (placedRow === -1) return; // Column full

                // Check win
                const checkWin = (r: number, c: number, color: string) => {
                    // Horizontal, Vertical, Diagonal
                    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
                    const ROWS = 6;
                    const COLS = 7;
                    for (let [dr, dc] of dirs) {
                        let count = 1;
                        // Forward
                        let nr = r + dr, nc = c + dc;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === color) {
                            count++;
                            nr += dr; nc += dc;
                        }
                        // Backward
                        nr = r - dr; nc = c - dc;
                        while (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === color) {
                            count++;
                            nr -= dr; nc -= dc;
                        }
                        if (count >= 4) return true;
                    }
                    return false;
                };

                const isP1 = socket.id === game.participants[0];
                const color = isP1 ? "pink" : "purple";

                if (checkWin(placedRow, col, color)) {
                    game.winner = socket.id;
                } else {
                    // Check draw (board full)
                    const isFull = board.every((row: (string | null)[]) => row.every(cell => cell !== null));
                    if (isFull) game.isDraw = true;
                }

                // Switch turn
                if (!game.winner && !game.isDraw) {
                    const nextPlayer = game.participants.find(id => id !== socket.id);
                    if (nextPlayer) game.activePlayerId = nextPlayer;
                    else game.activePlayerId = socket.id;
                }
            }

            io.to(currentRoomId).emit("game:update", game);
            if (game.winner) {
                const winnerName = room.users.find(u => u.id === game.winner)?.name || "Someone";
                logActivity(currentRoomId, "match", `${winnerName} won the game!`, "🏆");

                // Win Handling
                // 1. Set Crown
                room.crownedUserId = game.winner;
                io.to(currentRoomId).emit("room:state", room);

                // 2. Emit Win Event (for overlay)
                io.to(currentRoomId).emit("game:won", {
                    winnerId: game.winner,
                    winnerName,
                    type: game.type
                });

                // 3. Close Game automatically after delay
                room.gameState = null;
                io.to(currentRoomId).emit("game:closed");

                // 4. Auto-remove crown after 5 seconds
                const roomId = currentRoomId;
                setTimeout(() => {
                    const r = rooms.get(roomId);
                    if (r && r.crownedUserId === game.winner) {
                        r.crownedUserId = null;
                        io.to(roomId).emit("room:state", r);
                    }
                }, 5000);
            }
        });

        socket.on("game:reset", () => {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room || !room.gameState) return;

            // Only participants can reset?
            if (!room.gameState.participants.includes(socket.id)) return;

            const type = room.gameState.type;
            let initialBoard: (string | null)[] | (string | null)[][] = [];
            if (type === "ttt") initialBoard = Array(9).fill(null);
            if (type === "c4") initialBoard = Array.from({ length: 6 }, () => Array(7).fill(null));

            room.gameState.board = initialBoard;
            room.gameState.winner = null;
            room.gameState.isDraw = false;
            // Reset turn to Player 1? Or loser starts? 
            // "Reset" usually means fresh game. Let's reset to p1.
            room.gameState.activePlayerId = room.gameState.participants[0];

            io.to(currentRoomId).emit("game:update", room.gameState);
            logActivity(currentRoomId, "match", "Game reset", "🔄");
        });

        socket.on("game:close", () => {
            if (!currentRoomId) return;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            // if (!room.gameState.participants.includes(socket.id)) return; 
            // Anyone can close? Let's say yes for now.

            room.gameState = null;
            io.to(currentRoomId).emit("game:closed");
            // logActivity(currentRoomId, "match", "Game closed", "🛑");
        });

        socket.on("room:valentine", () => {
            if (!currentRoomId || !currentUser) return;
            // Broadcast acceptance to everyone (mostly for host to see toast)
            io.to(currentRoomId).emit("valentine:accepted");
            logActivity(currentRoomId, "valentine", `${currentUser.name} said YES! 💖`, "💖");
        });

        // --- Puzzle Handlers ---

        const getPuzzleState = (roomId: string) => {
            const room = rooms.get(roomId);
            return room ? room.puzzle : null;
        };

        const updatePuzzleState = (roomId: string, newState: PuzzleState) => {
            const room = rooms.get(roomId);
            if (room) {
                room.puzzle = newState;
                io.to(roomId).emit("puzzle:state", { state: newState });
            }
        };

        const checkSolved = (tiles: number[]) => {
            for (let i = 0; i < 9; i++) {
                if (tiles[i] !== i) return false;
            }
            return true;
        };

        socket.on("puzzle:open", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (room) {
                socket.emit("puzzle:state", { state: room.puzzle });
            }
        });

        socket.on("puzzle:moveRequest", ({ roomId, tileIndex, expectedRevision }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            const puzzle = room.puzzle;

            // Revision check
            if (puzzle.revision !== expectedRevision) {
                // Desync or race condition: send latest state back to client
                socket.emit("puzzle:state", { state: puzzle });
                return;
            }

            if (puzzle.status === "solved") return; // No moves after solve

            const emptyIndex = puzzle.tiles.indexOf(8);
            const clickedIndex = tileIndex;

            // Validate adjacency
            const row1 = Math.floor(emptyIndex / 3);
            const col1 = emptyIndex % 3;
            const row2 = Math.floor(clickedIndex / 3);
            const col2 = clickedIndex % 3;

            const isAdjacent = (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;

            if (isAdjacent) {
                // Swap
                const newTiles = [...puzzle.tiles];
                [newTiles[emptyIndex], newTiles[clickedIndex]] = [newTiles[clickedIndex], newTiles[emptyIndex]];

                puzzle.tiles = newTiles;
                puzzle.moveCount++;
                puzzle.revision++;
                puzzle.status = "active";

                // Check solved
                if (checkSolved(puzzle.tiles)) {
                    puzzle.status = "solved";
                    puzzle.solvedRevision = puzzle.revision;
                    io.to(roomId).emit("puzzle:solved", { solvedRevision: puzzle.revision });
                }

                updatePuzzleState(roomId, puzzle);
            } else {
                // Invalid move, just sync client
                socket.emit("puzzle:state", { state: puzzle });
            }
        });

        socket.on("puzzle:shuffleRequest", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Generate solvable shuffle by making random valid moves from solved state
            const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            let emptyIdx = 8;
            let lastEmptyIdx = -1;

            for (let i = 0; i < 80; i++) {
                const row = Math.floor(emptyIdx / 3);
                const col = emptyIdx % 3;
                const candidates = [];

                if (row > 0) candidates.push(emptyIdx - 3); // Up
                if (row < 2) candidates.push(emptyIdx + 3); // Down
                if (col > 0) candidates.push(emptyIdx - 1); // Left
                if (col < 2) candidates.push(emptyIdx + 1); // Right

                // Avoid undoing immediately if possible
                const validCandidates = candidates.filter(c => c !== lastEmptyIdx);
                const nextIdx = validCandidates.length > 0
                    ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
                    : candidates[Math.floor(Math.random() * candidates.length)];

                // Swap
                [tiles[emptyIdx], tiles[nextIdx]] = [tiles[nextIdx], tiles[emptyIdx]];
                lastEmptyIdx = emptyIdx;
                emptyIdx = nextIdx;
            }

            room.puzzle = {
                tiles,
                revision: room.puzzle.revision + 1,
                moveCount: 0,
                status: "active"
            };

            io.to(roomId).emit("puzzle:state", { state: room.puzzle });
            logActivity(roomId, "match", "Puzzle shuffled!", "🎲");
        });

        socket.on("disconnect", () => {
            if (currentRoomId && currentUser) {
                const room = rooms.get(currentRoomId);
                if (room) {
                    room.users = room.users.filter(u => u.id !== socket.id);

                    if (room.isScreenSharing && room.sharerId === socket.id) {
                        room.isScreenSharing = false;
                        room.sharerId = null;
                    }

                    io.to(currentRoomId).emit("room:state", room);
                    io.to(currentRoomId).emit("user:left", socket.id);
                    logActivity(currentRoomId, "leave", `${currentUser.name} left`, "🚪");

                    if (room.users.length === 0) {
                        // Cleanup after timeout? Or immediately.
                        // For now keep it simple, maybe clear after 1 hour or immediate.
                        // Immediate cleanup prevents reconnecting sometimes. 
                        // Let's leave it for now, simple in-memory map.
                        // rooms.delete(currentRoomId);
                    }
                }
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(
            `> Ready on http://${hostname}:${port} as ${dev ? "development" : "production"
            }`
        );
    });
});

