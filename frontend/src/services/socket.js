import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Single shared socket instance for the whole app.
 * autoConnect is false so we only connect once the user has entered
 * a username (login step).
 */
export const socket = io(API_URL, {
  autoConnect: false,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
