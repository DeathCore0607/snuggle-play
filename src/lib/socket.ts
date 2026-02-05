import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "./types";

// Connect to the same origin
const socketUrl = typeof window !== "undefined" ? window.location.origin : "";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
    autoConnect: false,
});
