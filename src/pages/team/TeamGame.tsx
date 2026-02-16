import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { formatCurrency, formatMW, formatPrice } from '../../lib/formatters';
import { ASSET_ICONS, ASSET_COLORS } from '../../lib/colors';
import type {
  AssetBid, AssetInfo, BidBand, TeamAssetInstance, TimePeriod,
  AssetType, TeamBidSubmission, WalkthroughSuggestedBid,
  TeamAnalysis, RoundAnalysis, AssetPerformanceSummary,
} from '../../../shared/types';
import {
  TIME_PERIOD_SHORT_LABELS, TIME_PERIOD_TIME_RANGES,
  ASSET_TYPE_LABELS, SEASON_LABELS, getPeriodDescriptions,
} from '../../../shared/types';
import {
  STRATEGIES, generateStrategyBids, getAvailableStrategies,
  type StrategyId, type Intensity,
} from '../../lib/bidding-strategies';

export default function TeamGame() {
  const navigate = useNavigate();
  const {
    gameState, connected, reconnecting, biddingTimeRemaining, roundResults,
    submitBids, requestState,
  } = useSocket();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day_peak');
  const [bids, setBids] = useState<Map<string, AssetBid>>(new Map()); // key: assetId_period
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Only redirect to join if we don't have a team AND we're not reconnecting
    // Also check sessionStorage - if we have saved credentials, wait for reconnection
    const savedTeamId = sessionStorage.getItem('nem_team_id');
    if (!gameState?.myTeam && !reconnecting && !savedTeamId) {
      navigate('/team/join');
    }
  }, [gameState, navigate, reconnecting]);

  const [walkthroughApplied, setWalkthroughApplied] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyId | ''>('');
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>('medium');

  // Reset bids when new round starts
  useEffect(() => {
    if (gameState?.phase === 'bidding' || gameState?.phase === 'briefing') {
      setBids(new Map());
      setSubmitted(false);
      setShowResults(false);
      setWalkthroughApplied(false);
      setSelectedStrategy('');
      setStrategyOpen(false);
    }
    if (gameState?.phase === 'results') {
      setShowResults(true);
    }
  }, [gameState?.phase, gameState?.currentRound]);

  // Set default selected period
  useEffect(() => {
    if (gameState?.roundConfig?.timePeriods) {
      const periods = gameState.roundConfig.timePeriods;
      if (!periods.includes(selectedPeriod) && periods.length > 0) {
        setSelectedPeriod(periods[0] as TimePeriod);
      }
    }
  }, [gameState?.roundConfig]);

  const team = gameState?.myTeam;
  const phase = gameState?.phase;
  const roundConfig = gameState?.roundConfig;
  const assets = team?.assets || [];
  const walkthrough = roundConfig?.walkthrough;
  const assetDefs: AssetInfo[] = (gameState as any)?.myAssetDefs || [];

  // Helper: get asset def info (SRMC, name) for an asset instance
  const getAssetDef = (assetId: string): AssetInfo | undefined =>
    assetDefs.find(d => d.id === assetId);

  // Compute available asset types for period descriptions
  const availableAssetTypes = useMemo(() => {
    const types = new Set<AssetType>();
    for (const a of assets) {
      const def = getAssetDef(a.assetDefinitionId);
      if (def) types.add(def.type);
    }
    return Array.from(types);
  }, [assets, assetDefs]);

  // Filter strategies to only show ones relevant to the team's current asset types
  const filteredStrategies = useMemo(() => {
    return getAvailableStrategies(availableAssetTypes);
  }, [availableAssetTypes]);

  // Auto-populate walkthrough bids when entering bidding phase
  useEffect(() => {
    if (phase === 'bidding' && walkthrough && team && assets.length > 0 && !walkthroughApplied) {
      setWalkthroughApplied(true);
      const newBids = new Map<string, AssetBid>();

      // Group suggested bids by asset type and period
      const bidsByPeriod = new Map<string, WalkthroughSuggestedBid[]>();
      for (const suggestion of walkthrough.suggestedBids) {
        const key = `${suggestion.assetType}_${suggestion.period}`;
        if (!bidsByPeriod.has(key)) bidsByPeriod.set(key, []);
        bidsByPeriod.get(key)!.push(suggestion);
      }

      for (const asset of assets) {
        const typeKey = asset.assetDefinitionId.split('_')[0] as AssetType;
        const fullTypeKey = asset.assetDefinitionId.includes('ccgt') ? 'gas_ccgt' :
                            asset.assetDefinitionId.includes('peaker') ? 'gas_peaker' : typeKey;

        for (const period of (roundConfig?.timePeriods || [])) {
          const suggestions = bidsByPeriod.get(`${fullTypeKey}_${period}`) || bidsByPeriod.get(`${typeKey}_${period}`);
          if (!suggestions || suggestions.length === 0) continue;

          const bands: BidBand[] = suggestions.map(s => ({
            pricePerMWh: s.suggestedPrice,
            quantityMW: Math.round(asset.currentAvailableMW * s.suggestedQuantityPercent / 100),
          }));

          const bidKey = `${asset.assetDefinitionId}_${period}`;
          newBids.set(bidKey, {
            assetInstanceId: `${asset.assetDefinitionId}_${team.id}`,
            assetDefinitionId: asset.assetDefinitionId,
            teamId: team.id,
            timePeriod: period as TimePeriod,
            bands,
            totalOfferedMW: bands.reduce((s, b) => s + b.quantityMW, 0),
            submittedAt: Date.now(),
          });
        }
      }

      if (newBids.size > 0) {
        setBids(newBids);
      }
    }
  }, [phase, walkthrough, team, assets, walkthroughApplied, roundConfig?.timePeriods]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Get or create bids for an asset in a period
  const getBidKey = (assetId: string, period: TimePeriod) => `${assetId}_${period}`;

  const getBidBands = (assetId: string, period: TimePeriod): BidBand[] => {
    const key = getBidKey(assetId, period);
    return bids.get(key)?.bands || [{ pricePerMWh: 0, quantityMW: 0 }];
  };

  const updateBand = (assetId: string, period: TimePeriod, bandIndex: number, field: 'pricePerMWh' | 'quantityMW', value: number) => {
    const key = getBidKey(assetId, period);
    const existing = bids.get(key);
    const bands = existing?.bands ? [...existing.bands] : [{ pricePerMWh: 0, quantityMW: 0 }];

    if (bandIndex >= bands.length) {
      bands.push({ pricePerMWh: 0, quantityMW: 0 });
    }

    bands[bandIndex] = { ...bands[bandIndex], [field]: value };

    const newBid: AssetBid = {
      assetInstanceId: `${assetId}_${team?.id}`,
      assetDefinitionId: assetId,
      teamId: team?.id || '',
      timePeriod: period,
      bands: bands.filter(b => b.quantityMW > 0),
      totalOfferedMW: bands.reduce((sum, b) => sum + (b.quantityMW || 0), 0),
      submittedAt: Date.now(),
    };

    setBids(new Map(bids.set(key, newBid)));
  };

  const addBand = (assetId: string, period: TimePeriod) => {
    const key = getBidKey(assetId, period);
    const existing = bids.get(key);
    const bands = existing?.bands ? [...existing.bands] : [];
    const maxBands = roundConfig?.maxBidBandsPerAsset || 10;
    if (bands.length >= maxBands) return;
    bands.push({ pricePerMWh: 0, quantityMW: 0 });

    const newBid: AssetBid = {
      ...existing!,
      assetInstanceId: `${assetId}_${team?.id}`,
      assetDefinitionId: assetId,
      teamId: team?.id || '',
      timePeriod: period,
      bands,
      totalOfferedMW: bands.reduce((s, b) => s + (b.quantityMW || 0), 0),
      submittedAt: Date.now(),
    };

    setBids(new Map(bids.set(key, newBid)));
  };

  const applyQuickBid = (assetId: string, period: TimePeriod, strategy: 'zero' | 'srmc' | 'high') => {
    const asset = assets.find(a => a.assetDefinitionId === assetId);
    if (!asset) return;

    const maxMW = asset.currentAvailableMW;
    let price = 0;

    if (strategy === 'srmc') {
      // Use actual SRMC from server-provided asset definitions
      const def = getAssetDef(assetId);
      if (def) {
        price = def.srmcPerMWh;
      } else {
        // Fallback if no def available
        const typeDefaults: Record<string, number> = {
          coal: 35, gas_ccgt: 75, gas_peaker: 140, hydro: 8, wind: 0, solar: 0, battery: 0,
        };
        const assetType = assetId.split('_')[0] + (assetId.includes('ccgt') ? '_ccgt' : assetId.includes('peaker') ? '_peaker' : '');
        price = typeDefaults[assetType] || typeDefaults[assetId.split('_')[0]] || 30;
      }
    } else if (strategy === 'high') {
      price = 500;
    }

    const key = getBidKey(assetId, period);
    const newBid: AssetBid = {
      assetInstanceId: `${assetId}_${team?.id}`,
      assetDefinitionId: assetId,
      teamId: team?.id || '',
      timePeriod: period,
      bands: [{ pricePerMWh: price, quantityMW: maxMW }],
      totalOfferedMW: maxMW,
      submittedAt: Date.now(),
    };

    setBids(new Map(bids.set(key, newBid)));
  };

  // Apply a full strategy across ALL assets and ALL periods
  const applyStrategy = (stratId: StrategyId, intens: Intensity) => {
    if (!team || !roundConfig) return;
    const periods = roundConfig.timePeriods as TimePeriod[];
    const newBids = generateStrategyBids(stratId, intens, assets, team.id, periods);
    setBids(newBids);
    setSelectedStrategy(stratId);
    setSelectedIntensity(intens);
  };

  const handleSubmit = () => {
    if (!team || !roundConfig) return;

    // Collect all bids
    const allBids: AssetBid[] = [];
    for (const period of roundConfig.timePeriods) {
      for (const asset of assets) {
        const key = getBidKey(asset.assetDefinitionId, period as TimePeriod);
        const bid = bids.get(key);
        if (bid && bid.bands.some(b => b.quantityMW > 0)) {
          allBids.push(bid);
        }
      }
    }

    const submission: TeamBidSubmission = {
      teamId: team.id,
      roundNumber: gameState?.currentRound || 0,
      bids: allBids,
      isComplete: true,
    };

    submitBids(submission);
    setSubmitted(true);
  };

  // Show reconnecting state
  if (!team && (reconnecting || sessionStorage.getItem('nem_team_id'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-5xl mb-4 animate-spin">🔄</div>
          <h2 className="text-xl font-bold text-gray-800">Reconnecting...</h2>
          <p className="text-gray-500 mt-2">Getting you back in the game</p>
          {!connected && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Connecting to server...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!team) return null;

  // Team header bar with team color
  const teamColor = team.color;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Disconnected banner */}
      {!connected && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-medium animate-pulse">
          ⚠️ Disconnected — reconnecting...
        </div>
      )}

      {/* Team Header */}
      <div className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: teamColor }}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <div className="text-white font-bold text-sm">{team.name}</div>
              <div className="text-white/70 text-xs">
                {phase === 'bidding' ? `Round ${gameState?.currentRound}` :
                 phase === 'lobby' ? 'Waiting...' :
                 phase === 'briefing' ? 'Round starting...' :
                 phase === 'results' ? 'Results' :
                 phase === 'final' ? 'Game Over' : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phase === 'bidding' && (
              <div className={`px-3 py-1 rounded-full font-mono font-bold text-sm ${
                biddingTimeRemaining <= 30 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white'
              }`}>
                {formatTime(biddingTimeRemaining)}
              </div>
            )}
            <div className="text-white/70 text-xs font-mono">
              {formatCurrency(team.cumulativeProfitDollars)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-24">
        {/* Lobby */}
        {phase === 'lobby' && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-gray-800">Waiting for Game to Start</h2>
            <p className="text-gray-500 mt-2">The host will begin the first round shortly.</p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected as {team.name}
            </div>
          </div>
        )}

        {/* Briefing */}
        {phase === 'briefing' && roundConfig && (
          <div className="p-4">
            <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
              <div className="text-xs text-blue-600 font-medium mb-1">Round {gameState?.currentRound}</div>
              <h2 className="text-lg font-bold text-gray-800">{roundConfig.name}</h2>
              <p className="text-gray-600 text-sm mt-2">{roundConfig.description}</p>

              {/* Walkthrough notice in briefing */}
              {roundConfig.walkthrough && (
                <div className="mt-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>🎓</span>
                    <span className="text-xs font-bold text-purple-800">Guided Round</span>
                  </div>
                  <p className="text-xs text-purple-700">When bidding opens, you'll see suggested bids with explanations. Follow along to learn the basics!</p>
                </div>
              )}
            </div>

            {/* Assets Preview */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Assets</h3>
              <div className="space-y-2">
                {assets.map(asset => {
                  const typeKey = asset.assetDefinitionId.split('_')[0] as AssetType;
                  const isNewlyUnlocked = roundConfig.newAssetsUnlocked.includes(typeKey) ||
                    (asset.assetDefinitionId.includes('ccgt') && roundConfig.newAssetsUnlocked.includes('gas_ccgt')) ||
                    (asset.assetDefinitionId.includes('peaker') && roundConfig.newAssetsUnlocked.includes('gas_peaker'));

                  return (
                    <div
                      key={asset.assetDefinitionId}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                        isNewlyUnlocked ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      } ${asset.isForceOutage ? 'opacity-60' : ''}`}
                    >
                      <span className="text-lg">{ASSET_ICONS[typeKey] || '🏭'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {getAssetDef(asset.assetDefinitionId)?.name || asset.assetDefinitionId.replace(/_\d+$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {(() => {
                            const def = getAssetDef(asset.assetDefinitionId);
                            if (!def) return null;
                            return (
                              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border flex-shrink-0 ${
                                def.srmcPerMWh === 0 ? 'bg-green-100 text-green-800 border-green-300' :
                                def.srmcPerMWh < 50 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                def.srmcPerMWh < 100 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }`} title="Short Run Marginal Cost - your cost to generate each MWh">
                                SRMC ${def.srmcPerMWh}/MWh
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatMW(asset.currentAvailableMW)}
                          {asset.isForceOutage && <span className="text-red-500 ml-1">(Outage!)</span>}
                        </div>
                      </div>
                      {isNewlyUnlocked && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demand & Fleet Summary */}
            {gameState?.fleetInfo && roundConfig.baseDemandMW && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
                <div className="text-sm font-bold text-blue-800 mb-2">
                  📊 {SEASON_LABELS[roundConfig.season]} — Demand vs Fleet Capacity
                </div>
                <div className={`grid gap-2 ${roundConfig.timePeriods.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {roundConfig.timePeriods.map(p => {
                    const demandMW = roundConfig.baseDemandMW[p] || 0;
                    const fleetMW = gameState.fleetInfo!.totalFleetMW[p] || 0;
                    const pct = gameState.fleetInfo!.demandAsPercentOfFleet[p] || 0;
                    const desc = getPeriodDescriptions(p as TimePeriod, roundConfig.season, availableAssetTypes);
                    return (
                      <div key={p} className="bg-white/70 rounded-lg px-3 py-2">
                        <div className="text-xs font-medium text-gray-600">{desc.icon} {desc.label}</div>
                        <div className="text-lg font-bold font-mono text-blue-700">{formatMW(demandMW)}</div>
                        <div className="text-xs text-gray-500">of {formatMW(fleetMW)} fleet</div>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          pct >= 90 ? 'bg-red-100 text-red-700' :
                          pct >= 70 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {pct}% of fleet
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-center text-gray-400 text-sm mt-4">
              Waiting for host to open bidding...
            </p>
          </div>
        )}

        {/* Bidding Interface */}
        {phase === 'bidding' && roundConfig && !submitted && (
          <div className="p-3">
            {/* Walkthrough Banner */}
            {walkthrough && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl px-4 py-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎓</span>
                  <span className="text-sm font-bold text-purple-800">Guided Round</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">{walkthrough.introText}</p>
              </div>
            )}

            {/* Demand Overview Banner - All Periods */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-xl p-4 mb-3">
              <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">
                📊 Demand This Round — {SEASON_LABELS[roundConfig.season]}
              </div>
              <div className={`grid gap-2 ${roundConfig.timePeriods.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                {roundConfig.timePeriods.map(p => {
                  const desc = getPeriodDescriptions(p as TimePeriod, roundConfig.season, availableAssetTypes);
                  const demandMW = roundConfig.baseDemandMW[p] || 0;
                  const pctOfFleet = gameState?.fleetInfo?.demandAsPercentOfFleet[p] || 0;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p as TimePeriod)}
                      className={`rounded-lg p-2 text-left transition-all ${
                        selectedPeriod === p ? 'bg-white/25 ring-2 ring-white' : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      <div className="text-xs opacity-80">{desc.icon} {desc.label}</div>
                      <div className="text-lg font-bold font-mono">{formatMW(demandMW)}</div>
                      <div className={`text-xs font-bold ${
                        pctOfFleet >= 90 ? 'text-red-300' : pctOfFleet >= 70 ? 'text-amber-300' : 'text-green-300'
                      }`}>{pctOfFleet}% of fleet</div>
                    </button>
                  );
                })}
              </div>
              {/* Hint for selected period */}
              {(() => {
                const desc = getPeriodDescriptions(selectedPeriod, roundConfig.season, availableAssetTypes);
                return (
                  <div className="mt-2 text-sm text-white/90 bg-white/10 rounded-lg px-3 py-2">
                    <span className="font-semibold">{desc.icon} {desc.label}:</span> {desc.priceContext}
                  </div>
                );
              })()}
            </div>

            {/* Period Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {roundConfig.timePeriods.map(p => {
                const desc = getPeriodDescriptions(p as TimePeriod, roundConfig.season, availableAssetTypes);
                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p as TimePeriod)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedPeriod === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {desc.icon} {desc.label}
                    <span className="ml-1 opacity-70">({TIME_PERIOD_TIME_RANGES[p as TimePeriod]})</span>
                  </button>
                );
              })}
            </div>

            {/* Period Description */}
            {(() => {
              const desc = getPeriodDescriptions(selectedPeriod, roundConfig.season, availableAssetTypes);
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{desc.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{desc.label}</span>
                    <span className="text-xs text-gray-400">{desc.timeRange}</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      desc.demandLevel === 'Low' ? 'bg-green-100 text-green-700' :
                      desc.demandLevel === 'Moderate' || desc.demandLevel.includes('solar') ? 'bg-blue-100 text-blue-700' :
                      desc.demandLevel === 'High' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {desc.demandLevel} demand
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed mb-1">{desc.typicalDispatch}</p>
                  <p className="text-[11px] text-blue-700 font-medium leading-relaxed">💲 {desc.priceContext}</p>
                </div>
              );
            })()}

            {/* Supply vs Demand Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800">
                  {TIME_PERIOD_SHORT_LABELS[selectedPeriod]} &bull; {SEASON_LABELS[roundConfig.season]}
                </span>
                {gameState?.fleetInfo && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (gameState.fleetInfo.demandAsPercentOfFleet[selectedPeriod] || 0) >= 90
                      ? 'bg-red-100 text-red-700'
                      : (gameState.fleetInfo.demandAsPercentOfFleet[selectedPeriod] || 0) >= 70
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {gameState.fleetInfo.demandAsPercentOfFleet[selectedPeriod] || 0}% of fleet
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Demand</div>
                  <div className="text-base font-bold font-mono text-blue-700">
                    {formatMW(roundConfig.baseDemandMW[selectedPeriod] || 0)}
                  </div>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Total Fleet Supply</div>
                  <div className="text-base font-bold font-mono text-indigo-700">
                    {formatMW(gameState?.fleetInfo?.totalFleetMW[selectedPeriod] || 0)}
                  </div>
                </div>
              </div>

              {/* Supply/Demand bar */}
              {gameState?.fleetInfo && (() => {
                const demandMW = roundConfig.baseDemandMW[selectedPeriod] || 0;
                const fleetMW = gameState.fleetInfo.totalFleetMW[selectedPeriod] || 1;
                const pct = Math.min(100, (demandMW / fleetMW) * 100);
                return (
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>0 MW</span>
                      <span>{formatMW(fleetMW)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Educational tip about $0 bidding */}
              {gameState?.fleetInfo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>💡 Tip:</strong> If all teams collectively bid enough capacity at $0 to cover
                    the {formatMW(roundConfig.baseDemandMW[selectedPeriod] || 0)} demand,
                    the clearing price will be <strong>$0/MWh</strong> and nobody covers their costs.
                    {(gameState.fleetInfo.demandAsPercentOfFleet[selectedPeriod] || 0) < 70 && (
                      <span> Supply significantly exceeds demand this period — there's plenty of capacity!</span>
                    )}
                    {(gameState.fleetInfo.demandAsPercentOfFleet[selectedPeriod] || 0) >= 90 && (
                      <span> Demand is close to total supply — capacity is tight and prices may be high.</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Strategy Selector Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-3 overflow-hidden">
              {/* Toggle Header */}
              <button
                onClick={() => setStrategyOpen(!strategyOpen)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🧠</span>
                  <span className="text-sm font-semibold text-gray-800">Strategy Auto-Fill</span>
                  {selectedStrategy && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {STRATEGIES.find(s => s.id === selectedStrategy)?.icon}{' '}
                      {STRATEGIES.find(s => s.id === selectedStrategy)?.name} ({selectedIntensity})
                    </span>
                  )}
                </div>
                <span className={`text-gray-400 transition-transform ${strategyOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Expanded Panel */}
              {strategyOpen && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                  <p className="text-[11px] text-gray-500">
                    Choose a strategy and intensity to auto-fill bids for <strong>all assets</strong> across <strong>all time periods</strong>. You can still adjust individual bids after.
                  </p>

                  {/* Strategy Dropdown */}
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Strategy</label>
                    <select
                      value={selectedStrategy}
                      onChange={e => setSelectedStrategy(e.target.value as StrategyId)}
                      className="w-full mt-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em', paddingRight: '2.5rem' }}
                    >
                      <option value="">Select a strategy...</option>
                      {filteredStrategies.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.name} — {s.shortDescription}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Strategy Description */}
                  {selectedStrategy && (() => {
                    const strat = STRATEGIES.find(s => s.id === selectedStrategy);
                    if (!strat) return null;
                    return (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <p className="text-[11px] text-gray-600 leading-relaxed">{strat.description}</p>
                      </div>
                    );
                  })()}

                  {/* Intensity Selector */}
                  {selectedStrategy && (
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Intensity</label>
                      <div className="flex gap-1.5 mt-1">
                        {(['low', 'medium', 'max'] as Intensity[]).map(level => {
                          const strat = STRATEGIES.find(s => s.id === selectedStrategy);
                          const isActive = selectedIntensity === level;
                          const colors = level === 'low'
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : level === 'medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                            : 'bg-red-50 text-red-700 border-red-300';
                          const activeColors = level === 'low'
                            ? 'bg-green-500 text-white border-green-500'
                            : level === 'medium'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-red-500 text-white border-red-500';

                          return (
                            <button
                              key={level}
                              onClick={() => setSelectedIntensity(level)}
                              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                isActive ? activeColors : `${colors} hover:opacity-80`
                              }`}
                            >
                              <div className="font-bold capitalize">{level}</div>
                              <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'opacity-70'}`}>
                                {strat?.intensityLabels[level]}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Apply Button */}
                  {selectedStrategy && (
                    <button
                      onClick={() => applyStrategy(selectedStrategy as StrategyId, selectedIntensity)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold text-sm rounded-lg shadow-sm active:scale-[0.98] transition-all"
                    >
                      Apply {STRATEGIES.find(s => s.id === selectedStrategy)?.name} ({selectedIntensity}) to All Assets
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Asset Bid Cards */}
            <div className="space-y-3">
              {assets.map(asset => {
                const typeKey = asset.assetDefinitionId.split('_')[0] as AssetType;
                const fullTypeKey = asset.assetDefinitionId.includes('ccgt') ? 'gas_ccgt' :
                                   asset.assetDefinitionId.includes('peaker') ? 'gas_peaker' : typeKey;
                const bands = getBidBands(asset.assetDefinitionId, selectedPeriod);
                const totalBid = bands.reduce((s, b) => s + (b.quantityMW || 0), 0);
                const maxBands = roundConfig.maxBidBandsPerAsset;

                return (
                  <div key={asset.assetDefinitionId} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    asset.isForceOutage ? 'border-red-300 opacity-70' : 'border-gray-200'
                  }`}>
                    {/* Asset Header */}
                    <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100"
                         style={{ borderLeft: `4px solid ${ASSET_COLORS[fullTypeKey as AssetType] || '#999'}` }}>
                      <span className="text-lg">{ASSET_ICONS[fullTypeKey as AssetType] || '🏭'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {getAssetDef(asset.assetDefinitionId)?.name || ASSET_TYPE_LABELS[fullTypeKey as AssetType] || typeKey}
                          </span>
                          {/* SRMC Badge - prominently visible */}
                          {(() => {
                            const def = getAssetDef(asset.assetDefinitionId);
                            if (!def) return null;
                            const srmc = def.srmcPerMWh;
                            return (
                              <span className={`text-sm font-extrabold px-2.5 py-1 rounded-lg border-2 shadow-sm ${
                                srmc === 0 ? 'bg-green-100 text-green-800 border-green-300' :
                                srmc < 50 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                srmc < 100 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-red-100 text-red-800 border-red-300'
                              }`} title="Short Run Marginal Cost - your cost to generate each MWh">
                                SRMC ${srmc}/MWh
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatMW(asset.currentAvailableMW)} available
                          {asset.isForceOutage && <span className="text-red-500"> (OUTAGE)</span>}
                        </div>
                      </div>
                      <div className={`text-xs font-mono px-2 py-1 rounded flex-shrink-0 ${
                        totalBid > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {totalBid}/{asset.currentAvailableMW} MW
                      </div>
                    </div>

                    {/* SRMC Cost Reminder */}
                    {(() => {
                      const def = getAssetDef(asset.assetDefinitionId);
                      if (!def) return null;
                      return (
                        <div className="px-4 py-1.5 bg-gray-50 text-[11px] text-gray-500 border-b border-gray-100">
                          Your cost to generate: <strong className="text-gray-700">${def.srmcPerMWh}/MWh</strong> — bid above this to cover costs
                        </div>
                      );
                    })()}

                    {/* Quick Bid Buttons */}
                    <div className="px-4 py-2 flex gap-2 border-b border-gray-50">
                      <button
                        onClick={() => applyQuickBid(asset.assetDefinitionId, selectedPeriod, 'zero')}
                        className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200 hover:bg-green-100"
                      >
                        Bid $0
                      </button>
                      <button
                        onClick={() => applyQuickBid(asset.assetDefinitionId, selectedPeriod, 'srmc')}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100 font-medium"
                      >
                        Bid SRMC (${getAssetDef(asset.assetDefinitionId)?.srmcPerMWh ?? '?'})
                      </button>
                      <button
                        onClick={() => applyQuickBid(asset.assetDefinitionId, selectedPeriod, 'high')}
                        className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 hover:bg-amber-100"
                      >
                        Bid $500
                      </button>
                    </div>

                    {/* Bid Bands */}
                    <div className="px-4 py-3 space-y-2">
                      {bands.map((band, i) => {
                        // Find matching walkthrough explanation for this band
                        const walkthroughExplanation = walkthrough?.suggestedBids
                          ?.filter(s => s.period === selectedPeriod && (s.assetType === fullTypeKey || s.assetType === typeKey))
                          ?.[i]?.explanation;

                        return (
                          <div key={i}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                              <div className="flex-1 flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-400">$/MWh</label>
                                  <input
                                    type="number"
                                    value={band.pricePerMWh ?? ''}
                                    onChange={e => updateBand(asset.assetDefinitionId, selectedPeriod, i, 'pricePerMWh', parseFloat(e.target.value) || 0)}
                                    placeholder="Price"
                                    className={`w-full px-2 py-1.5 border rounded text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                                      walkthroughExplanation ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                                    }`}
                                    min={-1000}
                                    max={17500}
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-400">MW</label>
                                  <input
                                    type="number"
                                    value={band.quantityMW ?? ''}
                                    onChange={e => updateBand(asset.assetDefinitionId, selectedPeriod, i, 'quantityMW', parseFloat(e.target.value) || 0)}
                                    placeholder="MW"
                                    className={`w-full px-2 py-1.5 border rounded text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                                      walkthroughExplanation ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                                    }`}
                                    min={0}
                                    max={asset.currentAvailableMW}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Walkthrough explanation for this band */}
                            {walkthroughExplanation && (
                              <div className="ml-6 mt-1 mb-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-purple-500 text-xs mt-0.5">💡</span>
                                  <p className="text-[11px] text-purple-700 leading-relaxed">{walkthroughExplanation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {bands.length < maxBands && (
                        <button
                          onClick={() => addBand(asset.assetDefinitionId, selectedPeriod)}
                          className="w-full py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-200"
                        >
                          + Add Band
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submitted Confirmation */}
        {phase === 'bidding' && submitted && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800">Bids Submitted!</h2>
            <p className="text-gray-500 mt-2">Waiting for all teams to finish...</p>
            <div className="mt-4 text-2xl font-mono font-bold text-blue-600">
              {formatTime(biddingTimeRemaining)}
            </div>
            {/* Walkthrough after-submit explanation */}
            {walkthrough?.afterSubmitExplanation && (
              <div className="mt-6 mx-auto max-w-sm bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👀</span>
                  <span className="text-sm font-bold text-purple-800">What to Watch For</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">{walkthrough.afterSubmitExplanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Dispatching */}
        {phase === 'dispatching' && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-4 animate-spin">⚙️</div>
            <h2 className="text-xl font-bold text-gray-800">Running Dispatch...</h2>
            <p className="text-gray-500 mt-2">AEMO is clearing the market</p>
          </div>
        )}

        {/* Results */}
        {(phase === 'results' || showResults) && roundResults && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Round {gameState?.currentRound} Results</h2>

            {/* Your Profit */}
            {(() => {
              const myResult = roundResults.teamResults.find(r => r.teamId === team.id);
              if (!myResult) return null;
              return (
                <div className={`rounded-xl p-5 text-center ${
                  myResult.totalProfitDollars >= 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="text-sm text-gray-600">Your Profit This Round</div>
                  <div className={`text-3xl font-bold font-mono mt-1 ${
                    myResult.totalProfitDollars >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(myResult.totalProfitDollars)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-gray-500">Revenue</div>
                      <div className="font-mono font-bold text-gray-800">{formatCurrency(myResult.totalRevenueDollars)}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-gray-500">Costs</div>
                      <div className="font-mono font-bold text-gray-800">{formatCurrency(myResult.totalCostDollars)}</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Clearing Prices */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Clearing Prices</h3>
              <div className="grid grid-cols-2 gap-2">
                {roundResults.periodResults.map(pr => (
                  <div key={pr.timePeriod} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 capitalize">{pr.timePeriod.replace(/_/g, ' ')}</div>
                    <div className="text-2xl font-bold font-mono text-blue-600">${Math.round(pr.clearingPriceMWh)}<span className="text-sm text-gray-400">/MWh</span></div>
                    <div className="mt-1 text-sm font-mono font-semibold text-gray-600">
                      Demand: {formatMW(pr.demandMW)}
                    </div>
                    <div className="text-xs text-gray-400">
                      Reserve: {pr.reserveMarginPercent.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Leaderboard</h3>
              <div className="space-y-1">
                {(gameState?.leaderboard || []).map((entry, i) => (
                  <div
                    key={entry.teamId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      entry.teamId === team.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-bold w-6 ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-500'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-gray-800 flex-1 truncate">{entry.teamName}</span>
                    <span className={`text-sm font-mono font-bold ${
                      entry.cumulativeProfitDollars >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(entry.cumulativeProfitDollars)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team-Specific Round Analysis */}
            {gameState?.lastRoundAnalysis && (() => {
              const analysis: RoundAnalysis = gameState.lastRoundAnalysis;
              const myAnalysis: TeamAnalysis | undefined = analysis.teamAnalyses.find(
                (ta: TeamAnalysis) => ta.teamId === team.id
              );
              if (!myAnalysis) return null;

              return (
                <div className="space-y-3">
                  {/* Your Performance Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🔍</span>
                      <h3 className="text-sm font-bold text-blue-800">Your Round Analysis</h3>
                    </div>

                    {/* Strengths */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-green-700 mb-1">What you did well</div>
                      {myAnalysis.strengths.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-gray-700 mb-1 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                          <span>{s}</span>
                        </p>
                      ))}
                    </div>

                    {/* Improvements */}
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-amber-700 mb-1">Where to improve</div>
                      {myAnalysis.improvements.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-gray-700 mb-1 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                          <span>{s}</span>
                        </p>
                      ))}
                    </div>

                    {/* Asset Performance */}
                    {myAnalysis.assetPerformance.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-1.5">Asset Performance</div>
                        <div className="space-y-1.5">
                          {myAnalysis.assetPerformance.map((ap: AssetPerformanceSummary, i: number) => (
                            <div key={i} className="bg-white/60 rounded-lg px-3 py-2 border border-white">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-medium text-gray-800">{ap.assetName}</span>
                                <span className={`text-xs font-mono font-bold ${
                                  ap.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {ap.profit >= 0 ? '+' : ''}{formatCurrency(ap.profit)}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-600 leading-relaxed">{ap.assessment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Round Advice */}
                    <div className="bg-blue-100/50 rounded-lg px-3 py-2 border border-blue-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">💡</span>
                        <span className="text-xs font-bold text-blue-800">Going into next round</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">{myAnalysis.nextRoundAdvice}</p>
                    </div>
                  </div>

                  {/* Market Summary (compact) */}
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Market Summary</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{analysis.overallSummary}</p>

                    {/* Who set the price */}
                    <div className="space-y-1.5">
                      {analysis.periodAnalyses.map((pa) => (
                        <div key={pa.timePeriod} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 w-16 flex-shrink-0">
                            {TIME_PERIOD_SHORT_LABELS[pa.timePeriod]}
                          </span>
                          <span className="font-mono font-bold text-blue-600 w-16 flex-shrink-0">
                            ${Math.round(pa.clearingPriceMWh)}
                          </span>
                          <span className="text-gray-500 truncate">
                            Set by {pa.priceSetterTeam}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Takeaways */}
                  <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-4">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">Key Takeaways</h3>
                    {analysis.keyTakeaways.map((t: string, i: number) => (
                      <p key={i} className="text-xs text-amber-700 mb-1 flex items-start gap-1.5">
                        <span className="mt-0.5 flex-shrink-0">•</span>
                        <span>{t}</span>
                      </p>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Game Over */}
        {phase === 'final' && (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">Game Over!</h2>

            <div className="mt-6 space-y-2">
              {(gameState?.leaderboard || []).map((entry, i) => (
                <div
                  key={entry.teamId}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    entry.teamId === team.id ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white border border-gray-200'
                  }`}
                >
                  <span className="text-2xl">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-semibold text-gray-800 flex-1">{entry.teamName}</span>
                  <span className={`font-mono font-bold ${
                    entry.cumulativeProfitDollars >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(entry.cumulativeProfitDollars)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Submit Bar (during bidding) */}
      {phase === 'bidding' && !submitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 z-50">
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-base rounded-xl shadow-md active:scale-[0.98] transition-transform"
          >
            Submit Bids ✓
          </button>
        </div>
      )}
    </div>
  );
}
