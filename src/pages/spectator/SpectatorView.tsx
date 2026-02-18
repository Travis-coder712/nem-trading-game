import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { formatCurrency, formatMW, formatNumber } from '../../lib/formatters';
import { ASSET_ICONS } from '../../lib/colors';
import type { TimePeriod, AssetType } from '../../../shared/types';
import { TIME_PERIOD_SHORT_LABELS, SEASON_LABELS } from '../../../shared/types';

/**
 * Spectator View (Improvement 5.7)
 * Read-only view that displays the current game state.
 * Spectators can observe the game without participating.
 */
export default function SpectatorView() {
  const { gameState, connected } = useSocket();
  const [gameId, setGameId] = useState('');
  const [joined, setJoined] = useState(false);

  if (!connected) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin">📡</div>
          <h2 className="text-xl font-bold text-white">Connecting...</h2>
          <p className="text-navy-400 mt-2">Establishing connection to game server</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-navy-900 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">👁️</div>
            <h1 className="text-2xl font-bold text-white mb-2">Spectator Mode</h1>
            <p className="text-navy-400 mb-6">Watch a game in progress without participating.</p>

            <div className="text-left mb-4">
              <label className="block text-sm font-medium text-navy-300 mb-1">Game Code</label>
              <input
                type="text"
                value={gameId}
                onChange={e => setGameId(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                className="w-full px-4 py-3 bg-navy-800 border border-navy-600 rounded-xl text-white text-lg font-mono text-center uppercase tracking-widest focus:border-electric-400 focus:outline-none focus:ring-1 focus:ring-electric-400"
                maxLength={6}
              />
            </div>

            <p className="text-xs text-navy-500 mb-4">
              Ask the host for the game code displayed on their screen.
            </p>

            <button
              onClick={() => setJoined(true)}
              disabled={gameId.length < 4}
              className="w-full py-3 bg-electric-500 hover:bg-electric-400 disabled:bg-navy-700 disabled:text-navy-500 text-white font-bold rounded-xl transition-colors"
            >
              Watch Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { phase, currentRound, totalRounds, teams, leaderboard, roundConfig, lastRoundResults } = gameState;

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header */}
      <div className="bg-navy-900 border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-lg">👁️</span>
            <div>
              <div className="text-sm font-bold text-white">Spectator Mode</div>
              <div className="text-xs text-navy-400">
                Round {currentRound}/{totalRounds} &bull; {phase?.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-navy-400">
              {teams?.length || 0} teams &bull; {roundConfig?.season && SEASON_LABELS[roundConfig.season]}
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Phase Banner */}
        <div className={`text-center py-4 rounded-xl ${
          phase === 'bidding' ? 'bg-electric-500/10 border border-electric-500/20' :
          phase === 'results' ? 'bg-green-500/10 border border-green-500/20' :
          phase === 'briefing' ? 'bg-purple-500/10 border border-purple-500/20' :
          'bg-white/5 border border-white/10'
        }`}>
          <div className="text-2xl mb-1">
            {phase === 'lobby' ? '⏳' : phase === 'briefing' ? '📋' : phase === 'bidding' ? '⚡' : phase === 'results' ? '📊' : phase === 'final' ? '🏆' : '🎮'}
          </div>
          <div className="text-lg font-bold text-white">
            {phase === 'lobby' ? 'Waiting for Teams' :
             phase === 'briefing' ? `Round ${currentRound}: ${roundConfig?.name || 'Briefing'}` :
             phase === 'bidding' ? 'Bidding in Progress' :
             phase === 'results' ? 'Round Results' :
             phase === 'final' ? 'Game Over!' : 'Unknown'}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Leaderboard</h2>
          <div className="space-y-2">
            {(leaderboard || []).map((entry, i) => (
              <div key={entry.teamId} className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-lg">
                <span className="text-lg w-8">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="font-medium flex-1">{entry.teamName}</span>
                <span className={`font-mono font-bold ${
                  entry.cumulativeProfitDollars >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(entry.cumulativeProfitDollars)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Clearing Prices (during results) */}
        {lastRoundResults && phase === 'results' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Clearing Prices — Round {currentRound}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {lastRoundResults.periodResults.map(pr => (
                <div key={pr.timePeriod} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xs text-navy-400">
                    {TIME_PERIOD_SHORT_LABELS[pr.timePeriod as TimePeriod] || pr.timePeriod}
                  </div>
                  <div className="text-xl font-bold font-mono text-electric-300">
                    ${formatNumber(pr.clearingPriceMWh)}
                  </div>
                  <div className="text-xs text-navy-500">
                    {formatMW(pr.demandMW)} demand
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game info */}
        <div className="text-center text-navy-500 text-xs">
          Spectator mode — view only. Game code: {gameState.gameId || ''}
        </div>
      </div>
    </div>
  );
}
