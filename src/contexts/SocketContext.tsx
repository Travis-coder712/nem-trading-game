import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../lib/socket';
import type {
  GameStateSnapshot, GamePhase, RoundConfig, TeamAssetInstance,
  RoundDispatchResult, LeaderboardEntry, BalancingResult,
  ScenarioEvent, TeamPublicInfo, AssetConfigOverrides,
} from '../../shared/types';

// SessionStorage keys for reconnection (sessionStorage is per-tab, so multiple tabs can join as different teams)
const SS_TEAM_ID = 'nem_team_id';
const SS_GAME_ID = 'nem_game_id';
const SS_TEAM_NAME = 'nem_team_name';

/** Describes a phase transition detected from a socket event. */
export interface PhaseTransition {
  from: GamePhase;
  to: GamePhase;
  id: number; // monotonically increasing — lets consumers detect new transitions
  timestamp: number; // Date.now() when the transition was detected
}

interface SocketContextValue {
  connected: boolean;
  reconnecting: boolean;
  gameState: GameStateSnapshot | null;
  roundResults: RoundDispatchResult | null;
  lastEvent: ScenarioEvent | null;
  lastBalancing: BalancingResult | null;
  biddingTimeRemaining: number;
  bidStatus: Record<string, boolean>;
  allBidsIn: boolean;
  teamScreenData: GameStateSnapshot | null;
  /** Set exactly once per `game:phase_changed` socket event */
  lastPhaseTransition: PhaseTransition | null;
  /** Last error message received from the server */
  lastError: string | null;
  /** Clear the last error */
  clearLastError: () => void;

  // Host actions
  createGame: (mode: string, teamCount: number, balancingEnabled: boolean, biddingGuardrailEnabled: boolean, assetConfig?: AssetConfigOverrides, assetVariation?: boolean) => void;
  startRound: () => void;
  startBidding: () => void;
  endBidding: () => void;
  showResults: () => void;
  nextRound: () => void;
  adjustTimer: (seconds: number) => void;
  setDemand: (demand: Record<string, number>) => void;
  applySurprises: (eventIds: string[]) => void;
  resetGame: () => void;
  viewTeamScreen: (teamId: string) => void;
  clearHostSession: () => void;

  // Team actions
  joinGame: (teamName: string, gameId: string) => void;
  submitBids: (bids: any) => void;
  requestState: () => void;
  clearSession: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [gameState, setGameState] = useState<GameStateSnapshot | null>(null);
  const [roundResults, setRoundResults] = useState<RoundDispatchResult | null>(null);
  const [lastEvent, setLastEvent] = useState<ScenarioEvent | null>(null);
  const [lastBalancing, setLastBalancing] = useState<BalancingResult | null>(null);
  const [biddingTimeRemaining, setBiddingTimeRemaining] = useState(0);
  const [bidStatus, setBidStatus] = useState<Record<string, boolean>>({});
  const [allBidsIn, setAllBidsIn] = useState(false);
  const [teamScreenData, setTeamScreenData] = useState<GameStateSnapshot | null>(null);
  const [lastPhaseTransition, setLastPhaseTransition] = useState<PhaseTransition | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const phaseTrackRef = useRef<{ currentPhase: GamePhase | null; nextId: number }>({ currentPhase: null, nextId: 1 });
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);

      // On every (re)connection, try to rejoin as previously connected team
      const savedTeamId = sessionStorage.getItem(SS_TEAM_ID);
      const savedGameId = sessionStorage.getItem(SS_GAME_ID);

      if (savedTeamId && savedGameId) {
        setReconnecting(true);
        console.log(`Attempting reconnect: team=${savedTeamId} game=${savedGameId}`);
        socket.emit('team:reconnect', { teamId: savedTeamId, gameId: savedGameId });

        // Clear any previous timeout
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

        // Generous timeout for slow mobile/hotspot connections
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnecting(false);
        }, 15000);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game:state_update', (state) => {
      // Keep phase tracker in sync (but don't emit a transition — only phase_changed does that)
      if (state.phase) phaseTrackRef.current.currentPhase = state.phase;
      setGameState(state);
      setBiddingTimeRemaining(state.biddingTimeRemaining);
      setBidStatus(state.bidStatus || {});
      setReconnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('game:phase_changed', (phase) => {
      const from = phaseTrackRef.current.currentPhase;
      phaseTrackRef.current.currentPhase = phase;
      if (from && from !== phase) {
        const id = phaseTrackRef.current.nextId++;
        setLastPhaseTransition({ from, to: phase, id, timestamp: Date.now() });
      }
      setGameState(prev => prev ? { ...prev, phase } : null);
      if (phase !== 'bidding') {
        setAllBidsIn(false);
      }
    });

    socket.on('game:round_results', (results) => {
      setRoundResults(results);
    });

    socket.on('bidding:time_remaining', (seconds) => {
      setBiddingTimeRemaining(seconds);
    });

    socket.on('bidding:all_submitted', () => {
      setAllBidsIn(true);
    });

    socket.on('host:bid_status', (status) => {
      setBidStatus(status);
    });

    socket.on('scenario:event_triggered', (event) => {
      setLastEvent(event);
    });

    socket.on('scenario:balancing_applied', (result) => {
      setLastBalancing(result);
    });

    socket.on('host:team_screen_data', (data) => {
      setTeamScreenData(data);
    });

    socket.on('team:reconnected', (data) => {
      console.log(`Reconnected as team "${data.teamName}" in game ${data.gameId}`);
      setReconnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Refresh stored values (in case they changed)
      sessionStorage.setItem(SS_TEAM_ID, data.teamId);
      sessionStorage.setItem(SS_GAME_ID, data.gameId);
      sessionStorage.setItem(SS_TEAM_NAME, data.teamName);
    });

    socket.on('game:reset', () => {
      console.log('Game was reset by host — clearing session');
      sessionStorage.removeItem(SS_TEAM_ID);
      sessionStorage.removeItem(SS_GAME_ID);
      sessionStorage.removeItem(SS_TEAM_NAME);
      setGameState(null);
      setRoundResults(null);
      setBiddingTimeRemaining(0);
      setReconnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('error', (msg) => {
      console.error('Socket error:', msg);
      setLastError(msg);
      setReconnecting(false);
    });

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game:state_update');
      socket.off('game:phase_changed');
      socket.off('game:round_results');
      socket.off('bidding:time_remaining');
      socket.off('bidding:all_submitted');
      socket.off('host:bid_status');
      socket.off('scenario:event_triggered');
      socket.off('scenario:balancing_applied');
      socket.off('team:reconnected');
      socket.off('host:team_screen_data');
      socket.off('game:reset');
      socket.off('error');
      socket.disconnect();
    };
  }, []);

  const createGame = useCallback((mode: string, teamCount: number, balancingEnabled: boolean, biddingGuardrailEnabled: boolean = true, assetConfig?: AssetConfigOverrides, assetVariation?: boolean) => {
    socket.emit('host:create_game', { mode: mode as any, teamCount, balancingEnabled, biddingGuardrailEnabled, assetConfig, assetVariation });
  }, []);

  const startRound = useCallback(() => socket.emit('host:start_round'), []);
  const startBidding = useCallback(() => socket.emit('host:start_bidding'), []);
  const endBidding = useCallback(() => socket.emit('host:end_bidding'), []);
  const showResults = useCallback(() => socket.emit('host:show_results'), []);
  const nextRound = useCallback(() => socket.emit('host:next_round'), []);
  const adjustTimer = useCallback((s: number) => socket.emit('host:adjust_timer', s), []);
  const setDemand = useCallback((demand: Record<string, number>) => socket.emit('host:set_demand', demand), []);
  const applySurprises = useCallback((eventIds: string[]) => socket.emit('host:apply_surprises', eventIds), []);
  const resetGame = useCallback(() => {
    socket.emit('host:reset_game');
  }, []);

  const clearLastError = useCallback(() => setLastError(null), []);

  const clearHostSession = useCallback(() => {
    setGameState(null);
    setRoundResults(null);
    setBiddingTimeRemaining(0);
    setBidStatus({});
    setAllBidsIn(false);
    setTeamScreenData(null);
    setLastPhaseTransition(null);
    setLastEvent(null);
    setLastBalancing(null);
    phaseTrackRef.current = { currentPhase: null, nextId: 1 };
  }, []);

  const viewTeamScreen = useCallback((teamId: string) => {
    socket.emit('host:view_team_screen', { teamId });
  }, []);

  const joinGame = useCallback((teamName: string, gameId: string) => {
    socket.emit('team:join', { teamName, gameId });

    // Listen for the state update that confirms we joined - save credentials
    const onStateUpdate = (state: GameStateSnapshot) => {
      if (state.myTeam) {
        sessionStorage.setItem(SS_TEAM_ID, state.myTeam.id);
        sessionStorage.setItem(SS_GAME_ID, state.gameId);
        sessionStorage.setItem(SS_TEAM_NAME, teamName);
        console.log(`Saved team session: team=${state.myTeam.id} game=${state.gameId}`);
        socket.off('game:state_update', onStateUpdate);
      }
    };
    socket.on('game:state_update', onStateUpdate);

    // Clean up listener after 5 seconds if no response
    setTimeout(() => socket.off('game:state_update', onStateUpdate), 5000);
  }, []);

  const submitBids = useCallback((submission: any) => {
    socket.emit('team:submit_bids', submission);
  }, []);

  const requestState = useCallback(() => {
    socket.emit('team:request_state');
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SS_TEAM_ID);
    sessionStorage.removeItem(SS_GAME_ID);
    sessionStorage.removeItem(SS_TEAM_NAME);
    setGameState(null);
  }, []);

  return (
    <SocketContext.Provider value={{
      connected,
      reconnecting,
      gameState,
      roundResults,
      lastEvent,
      lastBalancing,
      biddingTimeRemaining,
      bidStatus,
      allBidsIn,
      teamScreenData,
      lastPhaseTransition,
      lastError,
      clearLastError,
      createGame,
      startRound,
      startBidding,
      endBidding,
      showResults,
      nextRound,
      adjustTimer,
      setDemand,
      applySurprises,
      resetGame,
      viewTeamScreen,
      clearHostSession,
      joinGame,
      submitBids,
      requestState,
      clearSession,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
