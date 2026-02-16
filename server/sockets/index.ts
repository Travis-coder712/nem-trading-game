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
      console.log(`Client disconnected: ${socket.id}`);
      const gameId = (socket as any).gameId;
      if (gameId && !(socket as any).isHost) {
        const teamId = engine.disconnectTeam(gameId, socket.id);
        if (teamId) {
          io.to(`game:${gameId}`).emit('game:phase_changed',
            engine.getGame(gameId)?.phase || 'lobby'
          );
        }
      }
    });
  });
}
