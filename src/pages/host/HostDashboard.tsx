import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { formatCurrency, formatCurrencyFull, formatMW, formatPrice } from '../../lib/formatters';
import { ASSET_ICONS } from '../../lib/colors';
import MeritOrderChart from '../../components/charts/MeritOrderChart';
import ProfitLossBar from '../../components/charts/ProfitLossBar';
import LeaderboardChart from '../../components/charts/LeaderboardChart';
import type { TimePeriod, RoundAnalysis, PeriodAnalysis, TeamAnalysis, AssetType, DispatchedBand } from '../../../shared/types';
import { TIME_PERIOD_SHORT_LABELS, SEASON_LABELS, ASSET_TYPE_LABELS } from '../../../shared/types';

export default function HostDashboard() {
  const navigate = useNavigate();
  const {
    connected, gameState, roundResults, biddingTimeRemaining,
    bidStatus, allBidsIn, lastBalancing,
    startRound, startBidding, endBidding, nextRound, resetGame, setDemand,
  } = useSocket();
  const [qrData, setQrData] = useState<{ qrDataUrl: string; joinUrl: string } | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'merit' | 'profit' | 'leaderboard' | 'slides' | 'analysis' | 'dispatch'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day_peak');
  const [demandEdits, setDemandEdits] = useState<Record<string, number>>({});
  const [demandEditMode, setDemandEditMode] = useState(false);

  // Sync demand edits when round config changes
  useEffect(() => {
    if (gameState?.roundConfig?.baseDemandMW) {
      setDemandEdits({ ...gameState.roundConfig.baseDemandMW });
      setDemandEditMode(false);
    }
  }, [gameState?.currentRound, gameState?.roundConfig?.baseDemandMW]);

  const handleDemandChange = useCallback((period: string, value: number) => {
    setDemandEdits(prev => ({ ...prev, [period]: Math.max(0, Math.round(value)) }));
  }, []);

  const handleDemandSave = useCallback(() => {
    setDemand(demandEdits);
    setDemandEditMode(false);
  }, [demandEdits, setDemand]);

  // Fetch QR code
  useEffect(() => {
    if (gameState?.gameId) {
      fetch(`/api/game/${gameState.gameId}/qr`)
        .then(r => r.json())
        .then(data => setQrData(data))
        .catch(console.error);
    }
  }, [gameState?.gameId]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-white text-lg mb-4">No game in progress</p>
          <button
            onClick={() => navigate('/host')}
            className="px-6 py-2 bg-electric-500 text-white rounded-lg hover:bg-electric-400"
          >
            Create Game
          </button>
        </div>
      </div>
    );
  }

  const phase = gameState.phase;
  const round = gameState.currentRound;
  const totalRounds = gameState.totalRounds;
  const teams = gameState.teams || [];
  const leaderboard = gameState.leaderboard || [];
  const roundConfig = gameState.roundConfig;
  const lastResults = gameState.lastRoundResults;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 to-navy-950">
      {/* Top Bar */}
      <div className="bg-navy-900/80 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-xl">⚡</span>
          <div>
            <h1 className="text-white font-bold text-sm">NEM Merit Order Game</h1>
            <p className="text-navy-400 text-xs">
              {round > 0 ? `Round ${round}/${totalRounds}` : 'Lobby'} &bull; {teams.length} teams
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {phase === 'bidding' && (
            <div className={`px-4 py-2 rounded-full font-mono font-bold text-lg ${
              biddingTimeRemaining <= 30 ? 'bg-red-500/20 text-red-300 animate-pulse' : 'bg-electric-500/20 text-electric-300'
            }`}>
              {formatTime(biddingTimeRemaining)}
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {connected ? '● Connected' : '● Disconnected'}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-[calc(100vh-56px)] bg-navy-900/50 border-r border-white/10 p-4 flex flex-col">
          {/* Phase indicator */}
          <div className="mb-6">
            <div className="text-xs text-navy-400 uppercase tracking-wide mb-2">Phase</div>
            <div className="px-3 py-2 bg-electric-500/10 border border-electric-500/30 rounded-lg text-electric-300 text-sm font-medium capitalize">
              {phase === 'lobby' ? '🏠 Lobby' :
               phase === 'briefing' ? '📋 Briefing' :
               phase === 'bidding' ? '💰 Bidding' :
               phase === 'dispatching' ? '⚙️ Dispatching' :
               phase === 'results' ? '📊 Results' :
               phase === 'final' ? '🏆 Game Over' : phase}
            </div>
          </div>

          {/* Game Controls */}
          <div className="mb-6 space-y-2">
            <div className="text-xs text-navy-400 uppercase tracking-wide mb-2">Controls</div>

            {phase === 'lobby' && (
              <button
                onClick={startRound}
                disabled={teams.length < 2}
                className="w-full py-2.5 bg-electric-500 hover:bg-electric-400 text-white font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                Start Round 1 →
              </button>
            )}

            {phase === 'briefing' && (
              <button
                onClick={startBidding}
                className="w-full py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg transition-colors text-sm animate-pulse-glow"
              >
                Open Bidding 💰
              </button>
            )}

            {phase === 'bidding' && (
              <button
                onClick={endBidding}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                End Bidding Early ⏱️
              </button>
            )}

            {phase === 'results' && (
              <button
                onClick={nextRound}
                className="w-full py-2.5 bg-electric-500 hover:bg-electric-400 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                {round >= totalRounds ? 'Finish Game 🏆' : `Next Round →`}
              </button>
            )}

            {phase === 'final' && (
              <button
                onClick={resetGame}
                className="w-full py-2.5 bg-navy-600 hover:bg-navy-500 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Reset Game 🔄
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="mb-6 space-y-1">
            <div className="text-xs text-navy-400 uppercase tracking-wide mb-2">Display</div>
            {(['overview', 'analysis', 'dispatch', 'merit', 'profit', 'leaderboard', 'slides'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeView === view
                    ? 'bg-electric-500/20 text-electric-300 font-medium'
                    : 'text-navy-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {view === 'overview' ? '📋 Overview' :
                 view === 'analysis' ? '🔍 Round Analysis' :
                 view === 'dispatch' ? '⚡ Dispatch Overview' :
                 view === 'merit' ? '📊 Merit Order' :
                 view === 'profit' ? '💰 Profit/Loss' :
                 view === 'leaderboard' ? '🏆 Leaderboard' :
                 '📖 Slides'}
              </button>
            ))}
          </div>

          {/* Bid Status */}
          {phase === 'bidding' && (
            <div className="mb-6">
              <div className="text-xs text-navy-400 uppercase tracking-wide mb-2">Bid Status</div>
              <div className="space-y-1">
                {teams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      bidStatus[team.id] ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
                    }`} />
                    <span className="text-navy-300 truncate">{team.name}</span>
                    <span className={`ml-auto text-xs ${bidStatus[team.id] ? 'text-green-400' : 'text-amber-400'}`}>
                      {bidStatus[team.id] ? '✓' : '...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team List (lobby) */}
          {phase === 'lobby' && (
            <div className="flex-1">
              <div className="text-xs text-navy-400 uppercase tracking-wide mb-2">
                Teams ({teams.length}/{gameState.expectedTeamCount})
              </div>
              <div className="space-y-1">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg"
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    <span className="text-white text-sm">{team.name}</span>
                    <span className={`ml-auto text-xs ${team.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {team.isConnected ? '●' : '○'}
                    </span>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-navy-500 text-xs italic">Waiting for teams to join...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Lobby View */}
          {phase === 'lobby' && activeView === 'overview' && (
            <div className="max-w-2xl mx-auto text-center animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-2">Waiting for Teams</h2>

              {/* Join Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-3xl font-bold text-electric-300">{teams.length}</span>
                  <span className="text-navy-400 text-lg">/</span>
                  <span className="text-3xl font-bold text-navy-400">{gameState.expectedTeamCount}</span>
                  <span className="text-navy-400 text-sm ml-2">teams joined</span>
                </div>
                <div className="w-64 mx-auto bg-navy-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-electric-500 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${(teams.length / (gameState.expectedTeamCount || 1)) * 100}%` }}
                  />
                </div>
                {teams.length >= (gameState.expectedTeamCount || 0) ? (
                  <p className="text-green-400 text-sm mt-2 font-medium">✓ All teams joined — ready to start!</p>
                ) : (
                  <p className="text-navy-400 text-sm mt-2">
                    Waiting for {(gameState.expectedTeamCount || 0) - teams.length} more team{(gameState.expectedTeamCount || 0) - teams.length !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>

              {/* Team join status cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 text-left">
                {teams.map((team, i) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <span className="text-white text-sm font-medium truncate">{team.name}</span>
                    <span className="ml-auto text-green-400 text-xs flex-shrink-0">✓ Joined</span>
                  </div>
                ))}
                {/* Empty slots for teams not yet joined */}
                {Array.from({ length: Math.max(0, (gameState.expectedTeamCount || 0) - teams.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 border-dashed rounded-lg"
                  >
                    <div className="w-3 h-3 rounded-full bg-navy-600 flex-shrink-0 animate-pulse" />
                    <span className="text-navy-500 text-sm italic">Waiting...</span>
                  </div>
                ))}
              </div>

              {qrData && (
                <div className="bg-white rounded-2xl p-6 inline-block mb-6 shadow-xl">
                  <img src={qrData.qrDataUrl} alt="QR Code" className="w-64 h-64" />
                  <p className="text-navy-700 text-sm font-mono mt-2 break-all">{qrData.joinUrl}</p>
                  {qrData.joinUrl.startsWith('https://') && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      <span>🌐</span> Public link — anyone with this URL can join
                    </div>
                  )}
                </div>
              )}

              <p className="text-navy-300 text-sm">
                {qrData?.joinUrl.startsWith('https://')
                  ? 'Share the QR code or URL with anyone — they can join from anywhere!'
                  : 'Teams scan the QR code above or navigate to the URL on their phones to join.'}
              </p>
              <p className="text-navy-500 text-xs mt-2">
                Game ID: <span className="font-mono text-electric-400">{gameState.gameId}</span>
              </p>
            </div>
          )}

          {/* Briefing View */}
          {phase === 'briefing' && roundConfig && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <div className="mb-6">
                <div className="text-sm text-electric-400 font-medium">Round {round}</div>
                <h2 className="text-3xl font-bold text-white">{roundConfig.name}</h2>
                <p className="text-navy-300 mt-2">{roundConfig.description}</p>
              </div>

              {roundConfig.educationalContent && (
                <div className="space-y-4">
                  {roundConfig.educationalContent.slides.map((slide, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3">{slide.heading}</h3>
                      <div className="text-navy-300 text-sm whitespace-pre-line leading-relaxed">
                        {slide.body.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                          j % 2 === 0 ? part : <strong key={j} className="text-electric-300">{part}</strong>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {roundConfig.learningObjectives.length > 0 && (
                <div className="mt-6 bg-electric-500/10 border border-electric-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-electric-300 mb-2">Learning Objectives</h3>
                  <ul className="space-y-1">
                    {roundConfig.learningObjectives.map((obj, i) => (
                      <li key={i} className="text-sm text-navy-300 flex items-start gap-2">
                        <span className="text-electric-400 mt-0.5">•</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scenario Events */}
              {roundConfig.activeScenarioEvents.length > 0 && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-amber-300 mb-2">⚠️ Active Scenarios</h3>
                  <p className="text-sm text-navy-300">
                    {roundConfig.activeScenarioEvents.join(', ')}
                  </p>
                </div>
              )}

              {/* Demand Configuration Panel */}
              {gameState.fleetInfo && (
                <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      ⚡ Demand Configuration
                      <span className="text-xs text-navy-400 font-normal">({SEASON_LABELS[roundConfig.season]})</span>
                    </h3>
                    {!demandEditMode ? (
                      <button
                        onClick={() => setDemandEditMode(true)}
                        className="px-3 py-1 text-xs bg-electric-500/20 text-electric-300 rounded-lg hover:bg-electric-500/30 transition-colors"
                      >
                        ✏️ Edit Demand
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setDemandEdits({ ...roundConfig.baseDemandMW });
                            setDemandEditMode(false);
                          }}
                          className="px-3 py-1 text-xs bg-navy-600 text-navy-300 rounded-lg hover:bg-navy-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDemandSave}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors font-medium"
                        >
                          ✓ Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {roundConfig.timePeriods.map(period => {
                      const fleetMW = gameState.fleetInfo?.totalFleetMW[period] || 0;
                      const currentDemandMW = demandEditMode
                        ? (demandEdits[period] || 0)
                        : (gameState.fleetInfo?.demandMW[period] || 0);
                      const pctOfFleet = fleetMW > 0 ? Math.round((currentDemandMW / fleetMW) * 1000) / 10 : 0;

                      return (
                        <div key={period} className={`rounded-xl p-3 border transition-all ${
                          demandEditMode ? 'bg-electric-500/10 border-electric-500/30' : 'bg-white/5 border-white/10'
                        }`}>
                          <div className="text-xs text-navy-400 mb-2 capitalize font-medium">
                            {TIME_PERIOD_SHORT_LABELS[period as TimePeriod] || period.replace(/_/g, ' ')}
                          </div>

                          {demandEditMode ? (
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] text-navy-500">Demand (MW)</label>
                                <input
                                  type="number"
                                  value={demandEdits[period] || 0}
                                  onChange={e => handleDemandChange(period, parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-sm font-mono text-white focus:border-electric-400 focus:outline-none"
                                  min={0}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-navy-500">Set as % of fleet</label>
                                <input
                                  type="number"
                                  value={pctOfFleet || 0}
                                  onChange={e => {
                                    const pct = parseFloat(e.target.value) || 0;
                                    handleDemandChange(period, Math.round(fleetMW * pct / 100));
                                  }}
                                  className="w-full px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-sm font-mono text-white focus:border-electric-400 focus:outline-none"
                                  min={0}
                                  max={200}
                                  step={5}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-xl font-bold font-mono text-electric-300">
                                {formatMW(currentDemandMW)}
                              </div>
                              <div className="text-xs text-navy-500 mt-0.5">
                                {pctOfFleet}% of fleet
                              </div>
                            </>
                          )}

                          <div className="text-[10px] text-navy-600 mt-1.5 pt-1.5 border-t border-white/5">
                            Fleet: {formatMW(fleetMW)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Supply vs Demand Summary */}
                  {!demandEditMode && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-navy-400">
                      <div>
                        Total Fleet: <span className="text-white font-mono">
                          {formatMW(Object.values(gameState.fleetInfo?.totalFleetMW || {}).reduce((a, b) => Math.max(a, b), 0))}
                        </span>
                      </div>
                      <div>
                        Avg Demand: <span className="text-white font-mono">
                          {formatMW(Math.round(Object.values(gameState.fleetInfo?.demandMW || {}).reduce((a, b) => a + b, 0) / Math.max(1, roundConfig.timePeriods.length)))}
                        </span>
                      </div>
                      <div>
                        Avg % of Fleet: <span className="text-white font-mono">
                          {Math.round(Object.values(gameState.fleetInfo?.demandAsPercentOfFleet || {}).reduce((a, b) => a + b, 0) / Math.max(1, roundConfig.timePeriods.length))}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bidding Overview */}
          {phase === 'bidding' && activeView === 'overview' && (
            <div className="max-w-3xl mx-auto animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4">Bidding in Progress</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      bidStatus[team.id]
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-amber-500/30 bg-amber-500/5 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="text-white text-sm font-medium truncate">{team.name}</span>
                    </div>
                    <div className={`text-xs font-medium ${
                      bidStatus[team.id] ? 'text-green-400' : 'text-amber-400'
                    }`}>
                      {bidStatus[team.id] ? '✓ Bids Submitted' : '⏳ Waiting...'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <div className={`text-4xl font-mono font-bold ${
                  biddingTimeRemaining <= 30 ? 'text-red-400' : 'text-electric-400'
                }`}>
                  {formatTime(biddingTimeRemaining)}
                </div>
                <p className="text-navy-400 text-sm mt-1">Time Remaining</p>
              </div>
            </div>
          )}

          {/* Merit Order View */}
          {activeView === 'merit' && lastResults && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4">Merit Order Stack</h2>
              <div className="flex gap-2 mb-4">
                {(roundConfig?.timePeriods || []).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p as TimePeriod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedPeriod === p
                        ? 'bg-electric-500 text-white'
                        : 'bg-white/10 text-navy-300 hover:bg-white/20'
                    }`}
                  >
                    {p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <MeritOrderChart
                  periodResult={lastResults.periodResults.find(r => r.timePeriod === selectedPeriod) || lastResults.periodResults[0]}
                  height={450}
                />
              </div>
            </div>
          )}

          {/* Dispatch Overview View */}
          {activeView === 'dispatch' && lastResults && (
            <div className="animate-fade-in space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Dispatch Overview — Round {round}</h2>

              {/* Summary Table: rows = asset types, columns = periods */}
              {(() => {
                const allPeriods = lastResults.periodResults.map(pr => pr.timePeriod);
                // Gather unique asset types across all dispatched bands
                const assetTypesSet = new Set<AssetType>();
                for (const pr of lastResults.periodResults) {
                  for (const band of [...pr.meritOrderStack, ...pr.undispatchedBands]) {
                    assetTypesSet.add(band.assetType);
                  }
                }
                const assetTypes = Array.from(assetTypesSet).sort();

                // Build summary: assetType -> period -> dispatched MW
                const summary: Record<string, Record<string, number>> = {};
                for (const at of assetTypes) {
                  summary[at] = {};
                  for (const p of allPeriods) {
                    summary[at][p] = 0;
                  }
                }

                for (const pr of lastResults.periodResults) {
                  for (const band of pr.meritOrderStack) {
                    if (band.dispatchedMW > 0) {
                      summary[band.assetType][pr.timePeriod] = (summary[band.assetType][pr.timePeriod] || 0) + band.dispatchedMW;
                    }
                  }
                }

                return (
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-white">Total Dispatched MW by Asset Type</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left text-xs text-navy-400 font-medium px-4 py-2">Asset Type</th>
                            {allPeriods.map(p => (
                              <th key={p} className="text-right text-xs text-navy-400 font-medium px-4 py-2">
                                {TIME_PERIOD_SHORT_LABELS[p] || p}
                              </th>
                            ))}
                            <th className="text-right text-xs text-navy-400 font-medium px-4 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assetTypes.map(at => {
                            const rowTotal = allPeriods.reduce((s, p) => s + (summary[at][p] || 0), 0);
                            return (
                              <tr key={at} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-4 py-2 text-sm text-white flex items-center gap-2">
                                  <span>{ASSET_ICONS[at] || '🏭'}</span>
                                  {ASSET_TYPE_LABELS[at] || at}
                                </td>
                                {allPeriods.map(p => (
                                  <td key={p} className="px-4 py-2 text-right text-sm font-mono text-navy-200">
                                    {summary[at][p] > 0 ? `${Math.round(summary[at][p])}` : <span className="text-navy-600">—</span>}
                                  </td>
                                ))}
                                <td className="px-4 py-2 text-right text-sm font-mono font-bold text-electric-300">
                                  {Math.round(rowTotal)}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Demand row */}
                          <tr className="border-t-2 border-white/20 bg-white/5">
                            <td className="px-4 py-2 text-sm font-semibold text-amber-300">📊 Demand</td>
                            {allPeriods.map(p => {
                              const pr = lastResults.periodResults.find(r => r.timePeriod === p);
                              return (
                                <td key={p} className="px-4 py-2 text-right text-sm font-mono font-bold text-amber-300">
                                  {pr ? Math.round(pr.demandMW) : '—'}
                                </td>
                              );
                            })}
                            <td className="px-4 py-2 text-right text-sm font-mono font-bold text-amber-300">
                              {Math.round(lastResults.periodResults.reduce((s, pr) => s + pr.demandMW, 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Per-Team Breakdown */}
              {(() => {
                const allPeriods = lastResults.periodResults.map(pr => pr.timePeriod);

                // Group dispatched bands by team
                const teamDispatched = new Map<string, { teamName: string; assets: Map<string, Record<string, number>> }>();

                for (const pr of lastResults.periodResults) {
                  for (const band of pr.meritOrderStack) {
                    if (band.dispatchedMW <= 0) continue;

                    if (!teamDispatched.has(band.teamId)) {
                      teamDispatched.set(band.teamId, { teamName: band.teamName, assets: new Map() });
                    }
                    const teamData = teamDispatched.get(band.teamId)!;

                    if (!teamData.assets.has(band.assetName)) {
                      teamData.assets.set(band.assetName, {});
                    }
                    const assetPeriods = teamData.assets.get(band.assetName)!;
                    assetPeriods[pr.timePeriod] = (assetPeriods[pr.timePeriod] || 0) + band.dispatchedMW;
                  }
                }

                return (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Per-Team Dispatch Breakdown</h3>
                    {Array.from(teamDispatched.entries()).map(([teamId, teamData]) => {
                      const team = teams.find(t => t.id === teamId);
                      return (
                        <div key={teamId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.color || '#888' }} />
                            <span className="text-sm font-semibold text-white">{teamData.teamName}</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/5">
                                  <th className="text-left text-[11px] text-navy-400 font-medium px-4 py-1.5">Asset</th>
                                  {allPeriods.map(p => (
                                    <th key={p} className="text-right text-[11px] text-navy-400 font-medium px-4 py-1.5">
                                      {TIME_PERIOD_SHORT_LABELS[p] || p}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from(teamData.assets.entries()).map(([assetName, periods]) => (
                                  <tr key={assetName} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-4 py-1.5 text-xs text-navy-200">{assetName}</td>
                                    {allPeriods.map(p => (
                                      <td key={p} className="px-4 py-1.5 text-right text-xs font-mono text-navy-300">
                                        {periods[p] ? `${Math.round(periods[p])} MW` : <span className="text-navy-600">—</span>}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Profit/Loss View */}
          {activeView === 'profit' && lastResults && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4">Round {round} Profit/Loss</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <ProfitLossBar teamResults={lastResults.teamResults} />
              </div>
            </div>
          )}

          {/* Leaderboard View */}
          {activeView === 'leaderboard' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
              <LeaderboardChart leaderboard={leaderboard} />
            </div>
          )}

          {/* Results Overview (default during results phase) */}
          {phase === 'results' && activeView === 'overview' && lastResults && (
            <div className="animate-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Round {round} Results</h2>
                <p className="text-navy-400 text-sm">{roundConfig?.name}</p>
              </div>

              {/* Price Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {lastResults.periodResults.map(pr => (
                  <div key={pr.timePeriod} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-navy-400 capitalize">{pr.timePeriod.replace(/_/g, ' ')}</div>
                    <div className="text-2xl font-bold font-mono text-electric-300 mt-1">
                      ${Math.round(pr.clearingPriceMWh)}
                    </div>
                    <div className="text-xs text-navy-500">/MWh clearing price</div>
                    <div className="text-xs text-navy-400 mt-1">
                      Demand: {formatMW(pr.demandMW)} &bull; Reserve: {pr.reserveMarginPercent.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Team Results Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs text-navy-400 font-medium px-4 py-3">Rank</th>
                      <th className="text-left text-xs text-navy-400 font-medium px-4 py-3">Team</th>
                      <th className="text-right text-xs text-navy-400 font-medium px-4 py-3">Round Profit</th>
                      <th className="text-right text-xs text-navy-400 font-medium px-4 py-3">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => {
                      const roundResult = lastResults.teamResults.find(r => r.teamId === entry.teamId);
                      return (
                        <tr key={entry.teamId} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-white font-bold">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-white text-sm">{entry.teamName}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-sm ${
                            (roundResult?.totalProfitDollars || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(roundResult?.totalProfitDollars || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-sm font-bold ${
                            entry.cumulativeProfitDollars >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(entry.cumulativeProfitDollars)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Round Analysis View */}
          {activeView === 'analysis' && gameState.lastRoundAnalysis && (() => {
            const analysis = gameState.lastRoundAnalysis;
            return (
              <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">🔍 Round {analysis.roundNumber} Analysis</h2>
                  <p className="text-navy-400 text-sm">{analysis.roundName}</p>
                </div>

                {/* Overall Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-electric-300 mb-2">Overall Summary</h3>
                  <p className="text-sm text-navy-200 leading-relaxed">{analysis.overallSummary}</p>
                </div>

                {/* Period-by-Period Analysis */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Period-by-Period Breakdown</h3>
                  {analysis.periodAnalyses.map(pa => (
                    <div key={pa.timePeriod} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-white capitalize">
                          {TIME_PERIOD_SHORT_LABELS[pa.timePeriod] || pa.timePeriod.replace(/_/g, ' ')}
                        </span>
                        <span className="text-lg font-bold font-mono text-electric-300">
                          ${Math.round(pa.clearingPriceMWh)}/MWh
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-navy-300">
                        <p><span className="text-amber-300 font-medium">⚡ Price setter:</span> {pa.priceSetterTeam} — {pa.priceSetterAsset} (bid ${Math.round(pa.priceSetterBidPrice)}/MWh)</p>
                        <p>{pa.priceExplanation}</p>
                        <p className="text-navy-400">{pa.supplyDemandNarrative}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collective Insight */}
                <div className="bg-electric-500/10 border border-electric-500/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-electric-300 mb-2">💡 Market Insight</h3>
                  <p className="text-sm text-navy-200 leading-relaxed">{analysis.collectiveInsight}</p>
                </div>

                {/* Key Takeaways */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">📝 Key Takeaways</h3>
                  <ul className="space-y-2">
                    {analysis.keyTakeaways.map((takeaway, i) => (
                      <li key={i} className="text-sm text-navy-300 flex items-start gap-2">
                        <span className="text-electric-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Team-by-Team Summary (collapsed by default) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Team Performance</h3>
                  {analysis.teamAnalyses.map(ta => (
                    <div key={ta.teamId} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ta.color }} />
                        <span className="text-sm font-semibold text-white">{ta.teamName}</span>
                        <span className="text-xs text-navy-400">#{ta.rank}</span>
                        <span className={`ml-auto text-sm font-mono font-bold ${
                          ta.roundProfit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {ta.roundProfit >= 0 ? '+' : ''}${Math.round(ta.roundProfit)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-green-400 font-medium mb-1">✓ Strengths</div>
                          {ta.strengths.map((s, i) => (
                            <p key={i} className="text-navy-300 mb-1">{s}</p>
                          ))}
                        </div>
                        <div>
                          <div className="text-amber-400 font-medium mb-1">→ Improvements</div>
                          {ta.improvements.map((s, i) => (
                            <p key={i} className="text-navy-300 mb-1">{s}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Final Results */}
          {phase === 'final' && (
            <div className="max-w-2xl mx-auto text-center animate-fade-in">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-white mb-6">Game Over!</h2>

              {leaderboard.length > 0 && (
                <div className="mb-8">
                  <div className="text-7xl mb-2">🥇</div>
                  <div className="text-2xl font-bold text-electric-300">{leaderboard[0]?.teamName}</div>
                  <div className="text-xl font-mono text-green-400">
                    {formatCurrencyFull(leaderboard[0]?.cumulativeProfitDollars || 0)}
                  </div>
                </div>
              )}

              <LeaderboardChart leaderboard={leaderboard} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
