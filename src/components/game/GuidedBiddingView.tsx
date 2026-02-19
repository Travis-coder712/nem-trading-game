/**
 * GuidedBiddingView — Step-by-step guided bidding interface.
 *
 * Replaces the original "wall of information" bidding layout with a clear
 * 3-step flow: (1) Know Your Assets → (2) Understand Demand → (3) Place Your Bids.
 *
 * All props/callbacks are identical to what the original bidding section uses in
 * TeamGame.tsx so the two can be swapped with a single boolean toggle.
 */
import { useState, useMemo } from 'react';
import { ASSET_ICONS, ASSET_COLORS } from '../../lib/colors';
import { formatCurrency, formatMW, formatPrice, formatNumber } from '../../lib/formatters';
import {
  TIME_PERIOD_SHORT_LABELS, TIME_PERIOD_TIME_RANGES,
  ASSET_TYPE_LABELS, SEASON_LABELS, getPeriodDescriptions,
} from '../../../shared/types';
import {
  STRATEGIES, getAvailableStrategies,
  type StrategyId, type Intensity,
} from '../../lib/bidding-strategies';
import type {
  AssetBid, AssetInfo, BidBand, TeamAssetInstance, TimePeriod,
  AssetType, RoundConfig, GameStateSnapshot, WalkthroughSuggestedBid,
} from '../../../shared/types';
import BatteryModeToggle from './BatteryModeToggle';
import type { BatteryMode } from '../../../shared/types';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

export interface GuidedBiddingProps {
  // Game data
  roundConfig: RoundConfig;
  gameState: GameStateSnapshot;
  assets: TeamAssetInstance[];
  assetDefs: AssetInfo[];
  walkthrough: RoundConfig['walkthrough'];

  // Bid state
  bids: Map<string, AssetBid>;
  selectedPeriod: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;

  // Bid actions
  onUpdateBand: (assetId: string, period: TimePeriod, bandIndex: number, field: 'pricePerMWh' | 'quantityMW', value: number) => void;
  onAddBand: (assetId: string, period: TimePeriod) => void;
  onQuickBid: (assetId: string, period: TimePeriod, strategy: 'zero' | 'srmc' | 'high') => void;
  onApplyStrategy: (stratId: StrategyId, intensity: Intensity) => void;

  // Help modals
  onShowHowToBid: () => void;
  onShowRoundBriefing: () => void;
  onShowStrategyGuide: () => void;
  onShowCommonMistakes: () => void;

  // Helpers
  getAssetDef: (assetId: string) => AssetInfo | undefined;
  getBidBands: (assetId: string, period: TimePeriod) => BidBand[];

  // Battery-specific
  hasBattery?: boolean;

  // Portfolio explainer
  showPortfolioButton?: boolean;
  onShowPortfolioExplainer?: () => void;
  onShowBatteryExplainer?: () => void;
  batteryModes?: Map<string, BatteryMode>;
  chargeMWs?: Map<string, number>;
  onBatteryModeChange?: (assetId: string, period: TimePeriod, mode: BatteryMode) => void;
  onChargeMWChange?: (assetId: string, period: TimePeriod, mw: number) => void;
}

// ═══════════════════════════════════════════════════════
//  STEP INDICATOR
// ═══════════════════════════════════════════════════════

function StepIndicator({ currentStep, onStepClick, bidsFilled }: {
  currentStep: number;
  onStepClick: (step: number) => void;
  bidsFilled: boolean;
}) {
  const steps = [
    { num: 1, label: 'Your Assets', icon: '⚡' },
    { num: 2, label: 'Market Demand', icon: '📊' },
    { num: 3, label: 'Place Bids', icon: '💰' },
  ];

  return (
    <div className="flex items-center justify-between mb-4 px-1">
      {steps.map((step, i) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num || (step.num === 3 && bidsFilled);
        return (
          <div key={step.num} className="flex items-center flex-1">
            <button
              onClick={() => onStepClick(step.num)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full justify-center ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
                  : isCompleted
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              <span className="text-sm">
                {isCompleted && !isActive ? '✓' : step.icon}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">Step {step.num}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 mx-1 flex-shrink-0 ${
                currentStep > step.num ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  STEP 1: YOUR ASSETS
// ═══════════════════════════════════════════════════════

function Step1Assets({ assets, assetDefs, getAssetDef, onNext }: {
  assets: TeamAssetInstance[];
  assetDefs: AssetInfo[];
  getAssetDef: (id: string) => AssetInfo | undefined;
  onNext: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <h3 className="text-sm font-bold text-blue-800 mb-1">
          Step 1 — Know Your Assets
        </h3>
        <p className="text-xs text-blue-700 leading-relaxed">
          These are the power plants you control this round. Each has a <strong>capacity</strong> (MW you can offer) and a <strong>marginal cost</strong> (what it costs you to generate each MWh). You want to bid <em>above</em> your marginal cost to make a profit.
        </p>
      </div>

      <div className="space-y-2">
        {assets.map(asset => {
          const typeKey = asset.assetDefinitionId.split('_')[0] as AssetType;
          const fullTypeKey = asset.assetDefinitionId.includes('ccgt') ? 'gas_ccgt' as AssetType :
                              asset.assetDefinitionId.includes('peaker') ? 'gas_peaker' as AssetType : typeKey;
          const def = getAssetDef(asset.assetDefinitionId);
          if (!def) return null;

          return (
            <div
              key={asset.assetDefinitionId}
              className={`bg-white rounded-xl border overflow-hidden ${
                asset.isForceOutage ? 'border-red-300 opacity-70' : 'border-gray-200'
              }`}
              style={{ borderLeft: `4px solid ${ASSET_COLORS[fullTypeKey] || '#999'}` }}
            >
              <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ASSET_ICONS[fullTypeKey] || '🏭'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800">{def.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-gray-600">
                        {formatMW(asset.currentAvailableMW)} capacity
                      </span>
                      {asset.isForceOutage && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">OUTAGE</span>
                      )}
                    </div>
                  </div>
                  <div className={`text-right px-3 py-1.5 rounded-lg border-2 ${
                    def.srmcPerMWh === 0 ? 'bg-green-50 border-green-300' :
                    def.srmcPerMWh < 50 ? 'bg-blue-50 border-blue-300' :
                    def.srmcPerMWh < 100 ? 'bg-amber-50 border-amber-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="text-[10px] text-gray-500 uppercase">Cost</div>
                    <div className={`text-sm font-extrabold ${
                      def.srmcPerMWh === 0 ? 'text-green-800' :
                      def.srmcPerMWh < 50 ? 'text-blue-800' :
                      def.srmcPerMWh < 100 ? 'text-amber-800' :
                      'text-red-800'
                    }`}>
                      ${def.srmcPerMWh}/MWh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        Next: See Market Demand →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  STEP 2: MARKET DEMAND
// ═══════════════════════════════════════════════════════

function Step2Demand({ roundConfig, gameState, assets, assetDefs, selectedPeriod, onPeriodChange, onNext, onBack }: {
  roundConfig: RoundConfig;
  gameState: GameStateSnapshot;
  assets: TeamAssetInstance[];
  assetDefs: AssetInfo[];
  selectedPeriod: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const availableAssetTypes = useMemo(() => {
    const types = new Set<AssetType>();
    for (const a of assets) {
      const def = assetDefs.find(d => d.id === a.assetDefinitionId);
      if (def) types.add(def.type);
    }
    return Array.from(types);
  }, [assets, assetDefs]);

  return (
    <div className="space-y-3">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
        <h3 className="text-sm font-bold text-indigo-800 mb-1">
          Step 2 — Understand Market Demand
        </h3>
        <p className="text-xs text-indigo-700 leading-relaxed">
          Demand varies across the day. <strong>Higher demand = tighter market = higher prices.</strong> Tap each period to see details. You will bid for each period separately in Step 3.
        </p>
      </div>

      {/* Period Cards */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-xl p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">
          {SEASON_LABELS[roundConfig.season]} — Demand by Period
        </div>
        <div className={`grid gap-2 ${roundConfig.timePeriods.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {roundConfig.timePeriods.map(p => {
            const desc = getPeriodDescriptions(p as TimePeriod, roundConfig.season, availableAssetTypes);
            const demandMW = roundConfig.baseDemandMW[p] || 0;
            const pctOfFleet = gameState?.fleetInfo?.demandAsPercentOfFleet[p] || 0;

            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p as TimePeriod)}
                className={`rounded-lg p-3 text-left transition-all ${
                  selectedPeriod === p ? 'bg-white/25 ring-2 ring-white' : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                <div className="text-xs opacity-80">{desc.icon} {desc.label}</div>
                <div className="text-[10px] opacity-60">{TIME_PERIOD_TIME_RANGES[p as TimePeriod]}</div>
                <div className="text-xl font-bold font-mono mt-1">{formatMW(demandMW)}</div>
                <div className={`text-xs font-bold ${
                  pctOfFleet >= 90 ? 'text-red-300' : pctOfFleet >= 70 ? 'text-amber-300' : 'text-green-300'
                }`}>{pctOfFleet}% of fleet needed</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected period detail */}
      {(() => {
        const desc = getPeriodDescriptions(selectedPeriod, roundConfig.season, availableAssetTypes);
        const demandMW = roundConfig.baseDemandMW[selectedPeriod] || 0;
        const fleetMW = gameState?.fleetInfo?.totalFleetMW[selectedPeriod] || 1;
        const pct = Math.min(100, (demandMW / fleetMW) * 100);

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{desc.icon}</span>
              <span className="text-sm font-bold text-gray-800">{desc.label}</span>
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                desc.demandLevel === 'Low' ? 'bg-green-100 text-green-700' :
                desc.demandLevel === 'Moderate' || desc.demandLevel.includes('solar') ? 'bg-blue-100 text-blue-700' :
                desc.demandLevel === 'High' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {desc.demandLevel} demand
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 uppercase">Demand</div>
                <div className="text-base font-bold font-mono text-blue-700">{formatMW(demandMW)}</div>
              </div>
              <div className="bg-indigo-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-gray-500 uppercase">Total Supply</div>
                <div className="text-base font-bold font-mono text-indigo-700">{formatMW(fleetMW)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>Loose market</span>
                <span>Tight market</span>
              </div>
            </div>

            <p className="text-[11px] text-blue-700 leading-relaxed">
              <strong>💲</strong> {desc.priceContext}
            </p>
          </div>
        );
      })()}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
        >
          Next: Place Your Bids →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  STEP 3: PLACE BIDS (main bidding interface)
// ═══════════════════════════════════════════════════════

function Step3Bids({
  roundConfig, gameState, assets, assetDefs, walkthrough,
  bids, selectedPeriod, onPeriodChange,
  onUpdateBand, onAddBand, onQuickBid, onApplyStrategy,
  onShowStrategyGuide, getAssetDef, getBidBands, onBack,
}: GuidedBiddingProps & { onBack: () => void }) {
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyId | ''>('');
  const [selectedIntensity, setSelectedIntensity] = useState<Intensity>('medium');
  const [strategyApplyMode, setStrategyApplyMode] = useState<'all' | 'selected'>('all');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  const availableAssetTypes = useMemo(() => {
    const types = new Set<AssetType>();
    for (const a of assets) {
      const def = assetDefs.find(d => d.id === a.assetDefinitionId);
      if (def) types.add(def.type);
    }
    return Array.from(types);
  }, [assets, assetDefs]);

  const filteredStrategies = useMemo(() => {
    return getAvailableStrategies(availableAssetTypes);
  }, [availableAssetTypes]);

  return (
    <div className="space-y-3">
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <h3 className="text-sm font-bold text-green-800 mb-1">
          Step 3 — Place Your Bids
        </h3>
        <p className="text-xs text-green-700 leading-relaxed">
          For each asset, set a <strong>price</strong> ($/MWh you want to be paid) and <strong>quantity</strong> (MW you are offering). Use the period tabs to bid for each time period. Use a <strong>strategy</strong> to auto-fill, or set bids manually.
        </p>
      </div>

      {/* Walkthrough Banner */}
      {walkthrough && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎓</span>
            <span className="text-sm font-bold text-purple-800">Guided Round</span>
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">{walkthrough.introText}</p>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {roundConfig.timePeriods.map(p => {
          const desc = getPeriodDescriptions(p as TimePeriod, roundConfig.season, availableAssetTypes);
          const demandMW = roundConfig.baseDemandMW[p] || 0;
          return (
            <button
              key={p}
              onClick={() => onPeriodChange(p as TimePeriod)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <div>{desc.icon} {desc.label}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${selectedPeriod === p ? 'text-white/70' : 'text-gray-400'}`}>
                {formatMW(demandMW)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Strategy Auto-Fill (Compact) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setStrategyOpen(!strategyOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <span className="text-xs font-semibold text-gray-800">Auto-Fill with Strategy</span>
            <button
              onClick={(e) => { e.stopPropagation(); onShowStrategyGuide(); }}
              className="px-1.5 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded text-[10px] font-bold transition-colors"
            >
              📖
            </button>
            {selectedStrategy && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {STRATEGIES.find(s => s.id === selectedStrategy)?.icon}{' '}
                {STRATEGIES.find(s => s.id === selectedStrategy)?.name} ({selectedIntensity})
              </span>
            )}
          </div>
          <span className={`text-gray-400 text-xs transition-transform ${strategyOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {strategyOpen && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3">
            <p className="text-[11px] text-gray-500">
              Pick a strategy to auto-populate bids. You can still edit individual bids afterwards.
            </p>

            <select
              value={selectedStrategy}
              onChange={e => setSelectedStrategy(e.target.value as StrategyId)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em', paddingRight: '2.5rem' }}
            >
              <option value="">Select a strategy...</option>
              {filteredStrategies.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name} — {s.shortDescription}</option>
              ))}
            </select>

            {selectedStrategy && (
              <>
                {/* Strategy description */}
                {(() => {
                  const strat = STRATEGIES.find(s => s.id === selectedStrategy);
                  if (!strat) return null;
                  return (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <p className="text-[11px] text-gray-600 leading-relaxed">{strat.description}</p>
                    </div>
                  );
                })()}

                {/* Intensity */}
                <div className="flex gap-1.5">
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

                {/* Apply to selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strategyApplyMode === 'all'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStrategyApplyMode('all');
                          setSelectedAssetIds(new Set(assets.map(a => a.assetDefinitionId)));
                        } else {
                          setStrategyApplyMode('selected');
                          setSelectedAssetIds(new Set(assets.map(a => a.assetDefinitionId)));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">All Assets</span>
                  </label>

                  {strategyApplyMode === 'selected' && (
                    <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                      {assets.map(asset => {
                        const typeKey = asset.assetDefinitionId.includes('ccgt') ? 'gas_ccgt' as AssetType :
                                       asset.assetDefinitionId.includes('peaker') ? 'gas_peaker' as AssetType :
                                       asset.assetDefinitionId.split('_')[0] as AssetType;
                        const def = assetDefs.find((d: AssetInfo) => d.id === asset.assetDefinitionId);
                        const isChecked = selectedAssetIds.has(asset.assetDefinitionId);
                        return (
                          <label
                            key={asset.assetDefinitionId}
                            className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg transition-colors ${
                              isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={asset.isForceOutage}
                              onChange={(e) => {
                                const next = new Set(selectedAssetIds);
                                if (e.target.checked) next.add(asset.assetDefinitionId);
                                else next.delete(asset.assetDefinitionId);
                                setSelectedAssetIds(next);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{ASSET_ICONS[typeKey] || '⚡'}</span>
                            <span className="text-xs text-gray-700 font-medium truncate">{def?.name || asset.assetDefinitionId}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{Math.round(asset.currentAvailableMW)} MW</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onApplyStrategy(selectedStrategy as StrategyId, selectedIntensity)}
                  disabled={strategyApplyMode === 'selected' && selectedAssetIds.size === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold text-sm rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  Apply {STRATEGIES.find(s => s.id === selectedStrategy)?.name}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Asset Bid Cards */}
      <div className="space-y-3">
        {assets.map((asset, assetIndex) => {
          const typeKey = asset.assetDefinitionId.split('_')[0] as AssetType;
          const fullTypeKey = asset.assetDefinitionId.includes('ccgt') ? 'gas_ccgt' :
                              asset.assetDefinitionId.includes('peaker') ? 'gas_peaker' : typeKey;
          const bands = getBidBands(asset.assetDefinitionId, selectedPeriod);
          const totalBid = bands.reduce((s, b) => s + (b.quantityMW || 0), 0);
          const maxBands = roundConfig.maxBidBandsPerAsset;
          const def = getAssetDef(asset.assetDefinitionId);

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
                      {def?.name || ASSET_TYPE_LABELS[fullTypeKey as AssetType] || typeKey}
                    </span>
                    {def && (
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border ${
                        def.srmcPerMWh === 0 ? 'bg-green-100 text-green-800 border-green-300' :
                        def.srmcPerMWh < 50 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        def.srmcPerMWh < 100 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        Cost ${def.srmcPerMWh}/MWh
                      </span>
                    )}
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

              {/* Battery Mode Toggle (replaces normal bid inputs for battery assets) */}
              {def?.type === 'battery' && props.batteryModes && props.onBatteryModeChange && props.onChargeMWChange ? (
                <div className="px-4 py-3">
                  <BatteryModeToggle
                    asset={asset}
                    assetDef={def as any}
                    period={selectedPeriod}
                    mode={props.batteryModes.get(`${asset.assetDefinitionId}_${selectedPeriod}`) || 'idle'}
                    chargeMW={props.chargeMWs?.get(`${asset.assetDefinitionId}_${selectedPeriod}`) || 0}
                    bands={bands}
                    maxBands={maxBands}
                    onModeChange={(mode) => props.onBatteryModeChange!(asset.assetDefinitionId, selectedPeriod, mode)}
                    onChargeMWChange={(mw) => props.onChargeMWChange!(asset.assetDefinitionId, selectedPeriod, mw)}
                    onUpdateBand={(bandIndex, field, value) => onUpdateBand(asset.assetDefinitionId, selectedPeriod, bandIndex, field, value)}
                    onAddBand={() => onAddBand(asset.assetDefinitionId, selectedPeriod)}
                    walkthroughExplanation={walkthrough?.suggestedBids
                      ?.filter(s => s.period === selectedPeriod && (s.assetType === fullTypeKey || s.assetType === typeKey))
                      ?.[0]?.explanation}
                  />
                </div>
              ) : (
                <>
                  {/* Quick Bid Buttons */}
                  <div className="px-4 py-2 flex gap-2 border-b border-gray-50 bg-gray-50/50">
                    <span className="text-[10px] text-gray-400 self-center mr-1">Quick:</span>
                    <button
                      onClick={() => onQuickBid(asset.assetDefinitionId, selectedPeriod, 'zero')}
                      className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200 hover:bg-green-100"
                    >
                      $0
                    </button>
                    <button
                      onClick={() => onQuickBid(asset.assetDefinitionId, selectedPeriod, 'srmc')}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100 font-medium"
                    >
                      ${def?.srmcPerMWh ?? '?'} (cost)
                    </button>
                    <button
                      onClick={() => onQuickBid(asset.assetDefinitionId, selectedPeriod, 'high')}
                      className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 hover:bg-amber-100"
                    >
                      $500
                    </button>
                  </div>

                  {/* Bid Bands */}
                  <div className="px-4 py-3 space-y-2">
                    {bands.map((band, i) => {
                      const walkthroughExplanation = walkthrough?.suggestedBids
                        ?.filter(s => s.period === selectedPeriod && (s.assetType === fullTypeKey || s.assetType === typeKey))
                        ?.[i]?.explanation;

                      return (
                        <div key={i}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                            <div className="flex-1 flex gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Price $/MWh</label>
                                <input
                                  type="number"
                                  value={band.pricePerMWh ?? ''}
                                  onChange={e => onUpdateBand(asset.assetDefinitionId, selectedPeriod, i, 'pricePerMWh', parseFloat(e.target.value) || 0)}
                                  onFocus={e => e.target.select()}
                                  placeholder="Price"
                                  className={`w-full px-2 py-1.5 border rounded text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                                    walkthroughExplanation ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                                  }`}
                                  min={-1000}
                                  max={20000}
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Quantity MW</label>
                                <input
                                  type="number"
                                  value={band.quantityMW ?? ''}
                                  onChange={e => onUpdateBand(asset.assetDefinitionId, selectedPeriod, i, 'quantityMW', parseFloat(e.target.value) || 0)}
                                  onFocus={e => e.target.select()}
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
                        onClick={() => onAddBand(asset.assetDefinitionId, selectedPeriod)}
                        className="w-full py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-200"
                      >
                        + Add Bid Band
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl text-sm transition-all"
      >
        ← Back to Demand Overview
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export default function GuidedBiddingView(props: GuidedBiddingProps) {
  const [step, setStep] = useState(1);

  // Check if any bids have been filled
  const hasBids = props.bids.size > 0 && Array.from(props.bids.values()).some(
    b => b.bands.some(band => band.quantityMW > 0)
  );

  return (
    <div className="p-3">
      {/* Help Buttons — always visible, compact */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
        <button onClick={props.onShowHowToBid} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm">
          <span>📖</span> How to Bid
        </button>
        <button onClick={props.onShowRoundBriefing} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors shadow-sm">
          <span>📊</span> Round
        </button>
        <button onClick={props.onShowStrategyGuide} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors shadow-sm">
          <span>🧠</span> Strategies
        </button>
        <button onClick={props.onShowCommonMistakes} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors shadow-sm">
          <span>⚠️</span> Mistakes
        </button>
        {props.hasBattery && props.onShowBatteryExplainer && (
          <button onClick={props.onShowBatteryExplainer} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors shadow-sm">
            <span>🔋</span> Battery
          </button>
        )}
        {props.showPortfolioButton && props.onShowPortfolioExplainer && (
          <button onClick={props.onShowPortfolioExplainer} className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors shadow-sm">
            <span>📊</span> Portfolio
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} onStepClick={setStep} bidsFilled={hasBids} />

      {/* Steps */}
      {step === 1 && (
        <Step1Assets
          assets={props.assets}
          assetDefs={props.assetDefs}
          getAssetDef={props.getAssetDef}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2Demand
          roundConfig={props.roundConfig}
          gameState={props.gameState}
          assets={props.assets}
          assetDefs={props.assetDefs}
          selectedPeriod={props.selectedPeriod}
          onPeriodChange={props.onPeriodChange}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3Bids
          {...props}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}
