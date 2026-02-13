import { create } from "zustand";
import { RoomState, User, ChatMessage, LogEntry, Role } from "./types";

interface AppState {
    roomId: string | null;
    secret: string | null;
    me: User | null;
    roomState: RoomState | null;
    messages: ChatMessage[];
    logs: LogEntry[]; // Only populated if host
    isConnected: boolean;

    setRoomId: (id: string) => void;
    setSecret: (secret: string) => void;
    setMe: (user: Partial<User>) => void;
    setRoomState: (state: RoomState) => void;
    addMessage: (msg: ChatMessage) => void;
    setLogs: (logs: LogEntry[]) => void;
    addLog: (log: LogEntry) => void;
    setIsConnected: (connected: boolean) => void;
    reset: () => void;
}

export const useStore = create<AppState>((set) => ({
    roomId: null,
    secret: null,
    me: null,
    roomState: {
        roomId: "",
        users: [],
        isScreenSharing: false,
        sharerId: null,
        trackTitle: "",
        ratings: {},
        crownedUserId: null,
        gameState: null,
        puzzle: {
            tiles: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            revision: 0,
            moveCount: 0,
            status: "idle"
        }
    },
    messages: [],
    logs: [],
    isConnected: false,

    setRoomId: (id) => set({ roomId: id }),
    setSecret: (secret) => set({ secret }),

    setMe: (user) => set((state) => ({
        me: state.me ? { ...state.me, ...user } : { ...user } as User
    })),

    setRoomState: (newState) => set({ roomState: newState }),

    addMessage: (msg) => set((state) => ({
        messages: [...state.messages, msg]
    })),

    setLogs: (logs) => set({ logs }),

    addLog: (log) => set((state) => ({
        logs: [log, ...state.logs].slice(0, 200)
    })),

    setIsConnected: (connected) => set({ isConnected: connected }),

    reset: () => set({
        roomId: null,
        secret: null,
        me: null,
        roomState: null,
        messages: [],
        logs: [],
        isConnected: false,
    })
}));
