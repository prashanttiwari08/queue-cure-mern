import { io } from 'socket.io-client';

// Use env variable or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});
