import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types.ts';
import { GameEngine } from '../engine/GameEngine.ts';
import { registerHostHandlers } from './handlers/hostHandlers.ts';
import { registerTeamHandlers } from './handlers/teamHandlers.ts';

export const engine = new GameEngine();

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Register all handlers
    registerHostHandlers(io, socket, engine);
    registerTeamHandlers(io, socket, engine);

    socket.on('disconnect', () => {
      try {
        console.log(`Client disconnected: ${socket.id}`);
        const gameId = (socket as any).gameId;
        if (gameId && !(socket as any).isHost) {
          const teamId = engine.disconnectTeam(gameId, socket.id);
          if (teamId) {
            console.log(`Team ${teamId} marked disconnected in game ${gameId}`);
            // Send full state update to host so dashboard reflects disconnected status
            const hostSnapshot = engine.getSnapshot(gameId);
            if (hostSnapshot) {
              io.to(`game:${gameId}:host`).emit('game:state_update', hostSnapshot);
            }
          }
        }
      } catch (err) {
        console.error('Error handling disconnect:', err);
      }
    });

    // Catch any errors on the socket itself
    socket.on('error', (err) => {
      console.error(`Socket error (${socket.id}):`, err);
    });
  });
}
