export type Role = "host" | "guest";

export interface User {
    id: string; // socket id
    name: string;
    role: Role;
    micMuted: boolean;
    camOff: boolean;
}

export interface RoomState {
    roomId: string;
    users: User[];
    isScreenSharing: boolean;
    sharerId: string | null;
    trackTitle: string;
    ratings: Record<string, number>; // socketId -> rating
}

export type ReactionEmoji = "❤️" | "😂" | "😮" | "🥺" | "🔥" | "✨";

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
}

export interface LogEntry {
    id: string;
    timestamp: number;
    type: "join" | "leave" | "share" | "media" | "rating" | "match" | "log";
    message: string;
    icon?: string;
}

// Socket Events
export interface ServerToClientEvents {
    "room:state": (state: RoomState) => void;
    "user:joined": (user: { id: string; name: string }) => void;
    "user:left": (userId: string) => void;
    "chat:message": (msg: ChatMessage) => void;
    "reaction:show": (data: { senderId: string; emoji: ReactionEmoji }) => void;
    "share:started": (sharerId: string) => void;
    "share:stopped": () => void;
    "rating:update": (ratings: Record<string, number>) => void;
    "rating:match": () => void;
    "rating:mismatch": () => void;
    "rating:reveal": (data: { ratings: Record<string, number> }) => void;
    "rating:progress": (data: { raterId: string }) => void;
    "activity:log": (entries: LogEntry[]) => void; // Host only

    // WebRTC signaling
    "signal": (data: { sender: string; signal: any }) => void;
}

export interface ClientToServerEvents {
    "room:join": (data: { roomId: string; secret?: string; name: string }, callback: (res: { status: "ok" | "error"; error?: string; role?: Role; secret?: string }) => void) => void;
    "chat:send": (text: string) => void;
    "reaction:send": (emoji: ReactionEmoji) => void;
    "media:toggle": (data: { micMuted: boolean; camOff: boolean }) => void;
    "share:start": () => void;
    "share:stop": () => void;
    "rating:setTrack": (title: string) => void;
    "rating:submit": (value: number) => void;
    "activity:fetch": () => void; // Host requests logs

    // WebRTC signaling
    "signal": (data: { roomId: string; signal: any }) => void;
}
