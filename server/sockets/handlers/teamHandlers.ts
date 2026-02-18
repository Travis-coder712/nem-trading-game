import type { Server, Socket } from 'socket.io';
import type { GameEngine } from '../../engine/GameEngine.ts';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types.ts';

/** Wrap a socket handler in try/catch so errors don't crash the server */
function safe(handler: (...args: any[]) => void) {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch (err) {
      console.error('Error in socket handler:', err);
    }
  };
}

export function registerTeamHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  engine: GameEngine,
) {
  socket.on('team:join', safe((data) => {
    const { teamName, gameId } = data;

    const result = engine.addTeam(gameId, teamName, socket.id);
    if (!result) {
      socket.emit('error', 'Could not join game. Game may be full or already started.');
      return;
    }
    // Check for duplicate team name error
    if (typeof result === 'object' && 'error' in result) {
      socket.emit('error', result.error);
      return;
    }
    const team = result;

    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:team:${team.id}`);
    (socket as any).gameId = gameId;
    (socket as any).teamId = team.id;
    (socket as any).isHost = false;

    // Notify all clients about new team
    io.to(`game:${gameId}`).emit('team:joined', {
      id: team.id,
      name: team.name,
      color: team.color,
      isConnected: true,
      rank: team.rank,
      cumulativeProfitDollars: 0,
    });

    // Send snapshot to new team
    const snapshot = engine.getSnapshot(gameId, team.id);
    if (snapshot) {
      socket.emit('game:state_update', snapshot);
    }

    // Update host
    const hostSnapshot = engine.getSnapshot(gameId);
    if (hostSnapshot) {
      io.to(`game:${gameId}:host`).emit('game:state_update', hostSnapshot);
    }
  }));

  socket.on('team:reconnect', safe((data) => {
    const { teamId, gameId } = data;

    const team = engine.reconnectTeam(gameId, teamId, socket.id);
    if (!team) {
      socket.emit('error', 'Could not reconnect. Game may have ended.');
      return;
    }

    socket.join(`game:${gameId}`);
    socket.join(`game:${gameId}:team:${team.id}`);
    (socket as any).gameId = gameId;
    (socket as any).teamId = team.id;
    (socket as any).isHost = false;

    console.log(`Team "${team.name}" reconnected (socket: ${socket.id})`);

    // Confirm reconnection to the team
    socket.emit('team:reconnected', {
      teamId: team.id,
      teamName: team.name,
      gameId,
    });

    // Send full current state to the reconnected team
    const snapshot = engine.getSnapshot(gameId, team.id);
    if (snapshot) {
      socket.emit('game:state_update', snapshot);
    }

    // Send current round data if game is in progress
    const game = engine.getGame(gameId);
    if (game && game.currentRound > 0) {
      const roundConfig = game.config.rounds[game.currentRound - 1];
      if (roundConfig) {
        socket.emit('game:round_started', {
          roundConfig,
          teamAssets: team.assets,
        });
      }

      // If we're in results phase, send last round results too
      if (game.phase === 'results' && game.roundResults.length > 0) {
        socket.emit('game:round_results', game.roundResults[game.roundResults.length - 1]);
      }
    }

    // Update host about reconnection
    const hostSnapshot = engine.getSnapshot(gameId);
    if (hostSnapshot) {
      io.to(`game:${gameId}:host`).emit('game:state_update', hostSnapshot);
    }
  }));

  socket.on('team:submit_bids', safe((submission) => {
    const gameId = (socket as any).gameId;
    const teamId = (socket as any).teamId;
    if (!gameId || !teamId) return;

    submission.teamId = teamId;
    const success = engine.submitBids(gameId, submission);

    if (success) {
      socket.emit('team:bid_acknowledged', { teamId, isComplete: submission.isComplete });

      // Update host with bid status
      const bidStatus = engine.getBidStatus(gameId);
      io.to(`game:${gameId}:host`).emit('host:bid_status', bidStatus);

      // Check if all bids are in
      if (engine.allBidsSubmitted(gameId)) {
        io.to(`game:${gameId}`).emit('bidding:all_submitted');
      }
    } else {
      socket.emit('error', 'Failed to submit bids. Bidding may have ended.');
    }
  }));

  socket.on('team:request_state', safe(() => {
    const gameId = (socket as any).gameId;
    const teamId = (socket as any).teamId;
    if (!gameId || !teamId) return;

    const snapshot = engine.getSnapshot(gameId, teamId);
    if (snapshot) {
      socket.emit('game:state_update', snapshot);
    }
  }));
}
