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

export function registerHostHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  engine: GameEngine,
) {
  socket.on('host:create_game', safe((config) => {
    const game = engine.createGame(
      config.mode,
      config.teamCount,
      config.balancingEnabled,
      config.biddingGuardrailEnabled ?? true,
      config.assetConfig,
      config.assetVariation,
    );
    socket.join(`game:${game.id}`);
    socket.join(`game:${game.id}:host`);
    (socket as any).gameId = game.id;
    (socket as any).isHost = true;

    const snapshot = engine.getSnapshot(game.id);
    if (snapshot) {
      socket.emit('game:state_update', snapshot);
    }
  }));

  socket.on('host:start_round', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    const roundConfig = engine.startRound(gameId);
    if (!roundConfig) {
      socket.emit('error', 'Cannot start round');
      return;
    }

    const game = engine.getGame(gameId);
    if (!game) return;

    // Send round started to all
    io.to(`game:${gameId}`).emit('game:phase_changed', 'briefing');

    // Send each team their assets
    for (const team of game.teams) {
      const teamSocket = io.sockets.sockets.get(team.socketId || '');
      if (teamSocket) {
        teamSocket.emit('game:round_started', {
          roundConfig,
          teamAssets: team.assets,
        });
      }
    }

    // Also send to host
    socket.emit('game:round_started', {
      roundConfig,
      teamAssets: [],
    });

    broadcastSnapshot(io, engine, gameId);
  }));

  socket.on('host:start_bidding', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    engine.startBidding(gameId);
    io.to(`game:${gameId}`).emit('game:phase_changed', 'bidding');

    // Start timer
    const timer = setInterval(() => {
      try {
        const remaining = engine.tickTimer(gameId);
        io.to(`game:${gameId}`).emit('bidding:time_remaining', remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          endBiddingAndDispatch(io, socket, engine, gameId);
        }
      } catch (err) {
        console.error('Error in bidding timer:', err);
        clearInterval(timer);
      }
    }, 1000);

    (socket as any).biddingTimer = timer;
    broadcastSnapshot(io, engine, gameId);
  }));

  socket.on('host:end_bidding', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    const timer = (socket as any).biddingTimer;
    if (timer) clearInterval(timer);

    endBiddingAndDispatch(io, socket, engine, gameId);
  }));

  socket.on('host:show_results', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;
    broadcastSnapshot(io, engine, gameId);
  }));

  socket.on('host:next_round', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    // Apply balancing before next round
    const balancingResults = engine.applyBalancing(gameId);
    for (const result of balancingResults) {
      io.to(`game:${gameId}`).emit('scenario:balancing_applied', result);
    }

    if (engine.isGameFinished(gameId)) {
      engine.advanceToNextPhase(gameId);
      const leaderboard = engine.getLeaderboard(gameId);
      io.to(`game:${gameId}`).emit('game:finished', leaderboard);
      io.to(`game:${gameId}`).emit('game:phase_changed', 'final');
      broadcastSnapshot(io, engine, gameId);
      return;
    }

    // Start the next round (same logic as host:start_round)
    const roundConfig = engine.startRound(gameId);
    if (!roundConfig) {
      socket.emit('error', 'Cannot start next round');
      broadcastSnapshot(io, engine, gameId);
      return;
    }

    const game = engine.getGame(gameId);
    if (!game) return;

    // Send round started to all
    io.to(`game:${gameId}`).emit('game:phase_changed', 'briefing');

    // Send each team their assets
    for (const team of game.teams) {
      const teamSocket = io.sockets.sockets.get(team.socketId || '');
      if (teamSocket) {
        teamSocket.emit('game:round_started', {
          roundConfig,
          teamAssets: team.assets,
        });
      }
    }

    // Also send to host
    socket.emit('game:round_started', {
      roundConfig,
      teamAssets: [],
    });

    broadcastSnapshot(io, engine, gameId);
  }));

  socket.on('host:adjust_timer', safe((seconds) => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    const game = engine.getGame(gameId);
    if (game) {
      game.biddingTimeRemaining = Math.max(0, seconds);
      io.to(`game:${gameId}`).emit('bidding:time_remaining', game.biddingTimeRemaining);
    }
  }));

  socket.on('host:set_demand', safe((demand) => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    const success = engine.setDemand(gameId, demand);
    if (success) {
      // Broadcast updated snapshot so teams see the new demand values
      broadcastSnapshot(io, engine, gameId);
    } else {
      socket.emit('error', 'Cannot update demand');
    }
  }));

  socket.on('host:reset_game', safe(() => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;
    engine.resetGame(gameId);
    broadcastSnapshot(io, engine, gameId);
  }));

  socket.on('host:view_team_screen', safe((data) => {
    const gameId = (socket as any).gameId;
    if (!gameId || !data?.teamId) return;

    const teamSnapshot = engine.getSnapshot(gameId, data.teamId);
    if (teamSnapshot) {
      socket.emit('host:team_screen_data', teamSnapshot);
    }
  }));
}

function endBiddingAndDispatch(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  engine: GameEngine,
  gameId: string,
) {
  io.to(`game:${gameId}`).emit('game:phase_changed', 'dispatching');

  // Run dispatch
  const results = engine.runDispatch(gameId);
  if (!results) {
    socket.emit('error', 'Dispatch failed');
    return;
  }

  // Send results
  io.to(`game:${gameId}`).emit('game:round_results', results);
  io.to(`game:${gameId}`).emit('game:phase_changed', 'results');
  broadcastSnapshot(io, engine, gameId);
}

function broadcastSnapshot(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  engine: GameEngine,
  gameId: string,
) {
  const game = engine.getGame(gameId);
  if (!game) return;

  // Host gets full snapshot
  const hostSnapshot = engine.getSnapshot(gameId);
  if (hostSnapshot) {
    io.to(`game:${gameId}:host`).emit('game:state_update', hostSnapshot);
  }

  // Each team gets their own snapshot
  for (const team of game.teams) {
    if (team.socketId) {
      const teamSnapshot = engine.getSnapshot(gameId, team.id);
      if (teamSnapshot) {
        const teamSocket = io.sockets.sockets.get(team.socketId);
        if (teamSocket) {
          teamSocket.emit('game:state_update', teamSnapshot);
        }
      }
    }
  }
}
