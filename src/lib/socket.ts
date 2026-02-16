import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,  // Keep trying to reconnect indefinitely
  timeout: 10000,
});
