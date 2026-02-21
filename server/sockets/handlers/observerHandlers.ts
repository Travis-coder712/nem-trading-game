import type { Server, Socket } from 'socket.io';
import type { GameEngine } from '../../engine/GameEngine.ts';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types.ts';

/** Wrap a socket handler in try/catch so errors don't crash the server */
function safe(handler: (...args: any[]) => void) {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch (err) {
      console.error('Error in observer handler:', err);
    }
  };
}

export function registerObserverHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  engine: GameEngine,
) {
  socket.on('observer:join', safe((data) => {
    const { gameId } = data;
    const game = engine.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    engine.addObserver(gameId, socket.id);
    socket.join(`game:${gameId}`);
    (socket as any).gameId = gameId;
    (socket as any).isObserver = true;

    // Send team list so observer can pick a team
    const teams = game.teams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      rank: t.rank,
      cumulativeProfitDollars: t.cumulativeProfitDollars,
      isConnected: t.isConnected,
    }));

    socket.emit('observer:joined', { gameId, teams });

    // Also send the host-level snapshot initially (leaderboard, phase, etc.)
    const snapshot = engine.getSnapshot(gameId);
    if (snapshot) {
      socket.emit('game:state_update', snapshot);
    }

    console.log(`Observer joined game ${gameId} (socket: ${socket.id})`);
  }));

  socket.on('observer:select_team', safe((data) => {
    const gameId = (socket as any).gameId;
    if (!gameId) return;

    const { teamId } = data;
    const game = engine.getGame(gameId);
    if (!game) return;

    // Leave all previous team rooms for this game (in case switching teams)
    for (const team of game.teams) {
      socket.leave(`game:${gameId}:team:${team.id}`);
    }

    const success = engine.setObserverTeam(gameId, socket.id, teamId);
    if (!success) {
      socket.emit('error', 'Could not observe this team');
      return;
    }

    // Join the team's socket room so we receive team-specific broadcasts
    socket.join(`game:${gameId}:team:${teamId}`);

    const team = game.teams.find(t => t.id === teamId);
    socket.emit('observer:team_selected', {
      teamId,
      teamName: team?.name || 'Unknown',
    });

    // Send the team's snapshot with observer flag
    const teamSnapshot = engine.getSnapshot(gameId, teamId);
    if (teamSnapshot) {
      teamSnapshot.isObserverView = true;
      socket.emit('game:state_update', teamSnapshot);
    }

    // Send current round data if game is in progress
    if (game.currentRound > 0 && team) {
      const roundConfig = game.config.rounds[game.currentRound - 1];
      if (roundConfig) {
        socket.emit('game:round_started', {
          roundConfig,
          teamAssets: team.assets,
        });
      }
      // Send last round results if in results phase
      if (game.phase === 'results' && game.roundResults.length > 0) {
        socket.emit('game:round_results', game.roundResults[game.roundResults.length - 1]);
      }
    }

    console.log(`Observer now watching team "${team?.name}" in game ${gameId}`);
  }));
}
