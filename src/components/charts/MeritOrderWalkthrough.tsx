import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  ReferenceLine, Cell, Tooltip,
} from 'recharts';
import type { TimePeriodDispatchResult, DispatchedBand, TimePeriod } from '../../../shared/types';
import { TIME_PERIOD_SHORT_LABELS } from '../../../shared/types';
import { formatMW } from '../../lib/formatters';

interface Props {
  periodResults: TimePeriodDispatchResult[];
  initialPeriod?: TimePeriod;
  onClose?: () => void;
}

interface WalkthroughBand {
  teamName: string;
  teamId: string;
  assetName: string;
  assetType: string;
  bidPriceMWh: number;
  offeredMW: number;
  dispatchedMW: number;
  isMarginal: boolean;
  isDispatched: boolean;
  color: string;
  cumulativeMW: number;
}

const TEAM_COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#c05621',
  '#2f855a', '#2b6cb0', '#6b46c1', '#b83280', '#e53e3e',
];

const STEP_INTERVAL = 1200;

export default function MeritOrderWalkthrough({ periodResults, initialPeriod, onClose }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(
    initialPeriod || (periodResults[0]?.timePeriod as TimePeriod) || 'day_peak'
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const periodResult = useMemo(() =>
    periodResults.find(p => p.timePeriod === selectedPeriod) || periodResults[0],
    [periodResults, selectedPeriod]
  );

  // Build the ordered band list (dispatched + undispatched sorted by price)
  const allBands = useMemo(() => {
    if (!periodResult) return [];

    const teamColorMap = new Map<string, string>();
    let colorIdx = 0;

    const bands: WalkthroughBand[] = [];
    const sorted = [
      ...periodResult.meritOrderStack.map(b => ({ ...b, isDispatched: true })),
      ...periodResult.undispatchedBands.map(b => ({ ...b, isDispatched: false })),
    ]
      .filter(b => b.offeredMW > 0)
      .sort((a, b) => a.bidPriceMWh - b.bidPriceMWh);

    let cumMW = 0;
    for (const band of sorted) {
      if (!teamColorMap.has(band.teamId)) {
        teamColorMap.set(band.teamId, TEAM_COLORS[colorIdx++ % TEAM_COLORS.length]);
      }

      bands.push({
        teamName: band.teamName,
        teamId: band.teamId,
        assetName: band.assetName,
        assetType: band.assetType,
        bidPriceMWh: band.bidPriceMWh,
        offeredMW: band.offeredMW,
        dispatchedMW: band.dispatchedMW,
        isMarginal: band.isMarginal,
        isDispatched: band.dispatchedMW > 0,
        color: teamColorMap.get(band.teamId)!,
        cumulativeMW: cumMW,
      });
      cumMW += band.offeredMW;
    }
    return bands;
  }, [periodResult]);

  // Total steps: 0 (intro) + N bands + 1 (reveal clearing price)
  const totalSteps = allBands.length + 2;
  const isIntroStep = currentStep === 0;
  const isFinalStep = currentStep >= totalSteps - 1;
  const visibleBandCount = isIntroStep ? 0 : Math.min(currentStep, allBands.length);

  // Find the marginal band index
  const marginalIndex = allBands.findIndex(b => b.isMarginal);

  // Current visible data
  const chartData = useMemo(() => {
    return allBands.slice(0, visibleBandCount);
  }, [allBands, visibleBandCount]);

  // Cumulative MW so far
  const cumulativeMW = chartData.reduce((s, b) => s + b.offeredMW, 0);

  // Find if we've crossed demand
  const demandMW = periodResult?.demandMW || 0;
  const hasCrossedDemand = cumulativeMW >= demandMW && visibleBandCount > 0;

  // Show clearing price line only on final step or after crossing demand
  const showClearingPrice = isFinalStep || (currentStep > allBands.length);

  // The band being added in this step
  const currentBand = !isIntroStep && currentStep <= allBands.length ? allBands[currentStep - 1] : null;

  // Narrative text
  const narrative = useMemo(() => {
    if (isIntroStep) {
      return {
        title: 'Market Opens',
        text: `The market has ${formatMW(demandMW)} of demand to fill. Bids are sorted from cheapest to most expensive — this is the merit order.`,
        highlight: 'info',
      };
    }

    if (isFinalStep) {
      const clearingPrice = periodResult?.clearingPriceMWh || 0;
      return {
        title: 'Clearing Price Set!',
        text: `The clearing price is $${clearingPrice.toFixed(0)}/MWh. Every dispatched generator earns this price — not their bid price. This is how the NEM's uniform pricing works.`,
        highlight: 'success',
      };
    }

    if (currentBand) {
      if (currentBand.isMarginal) {
        return {
          title: `Marginal Unit!`,
          text: `${currentBand.teamName}'s ${currentBand.assetName} (bid $${currentBand.bidPriceMWh}/MWh, ${currentBand.offeredMW} MW) is the marginal unit — it's the last generator needed to meet demand. Its bid price sets the clearing price for ALL generators!`,
          highlight: 'marginal',
        };
      }

      if (currentBand.isDispatched) {
        return {
          title: `Bid Dispatched`,
          text: `${currentBand.teamName}'s ${currentBand.assetName} bids $${currentBand.bidPriceMWh}/MWh for ${currentBand.offeredMW} MW. Cumulative supply: ${formatMW(cumulativeMW)}${demandMW > 0 ? ` (${Math.round((cumulativeMW / demandMW) * 100)}% of demand)` : ''}.`,
          highlight: 'dispatched',
        };
      } else {
        return {
          title: `Not Dispatched`,
          text: `${currentBand.teamName}'s ${currentBand.assetName} bids $${currentBand.bidPriceMWh}/MWh for ${currentBand.offeredMW} MW — but demand is already met. This unit earns nothing.`,
          highlight: 'undispatched',
        };
      }
    }

    return { title: '', text: '', highlight: 'info' };
  }, [currentStep, isIntroStep, isFinalStep, currentBand, cumulativeMW, demandMW, periodResult]);

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, STEP_INTERVAL);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps]);

  // Reset when period changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [selectedPeriod]);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  const togglePlay = useCallback(() => {
    if (isFinalStep) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, [isFinalStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  // Y-axis range
  const yMax = useMemo(() => {
    const prices = allBands.map(b => b.bidPriceMWh);
    const maxPrice = Math.max(...prices, periodResult?.clearingPriceMWh || 0, 50);
    return Math.min(Math.ceil(maxPrice * 1.2 / 50) * 50, 500);
  }, [allBands, periodResult]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]?.payload) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-navy-800 border border-white/20 rounded-lg p-2.5 shadow-xl text-xs">
        <div className="font-semibold text-white">{d.teamName}</div>
        <div className="text-navy-300">{d.assetName} ({d.assetType})</div>
        <div className="text-electric-300 mt-1">Bid: <span className="font-mono">${d.bidPriceMWh}/MWh</span></div>
        <div className="text-navy-300">Offered: <span className="font-mono">{d.offeredMW} MW</span></div>
        {d.isMarginal && <div className="text-amber-400 font-bold mt-1">Sets the clearing price!</div>}
      </div>
    );
  };

  if (!periodResult) {
    return <div className="text-navy-400 text-center py-8">No dispatch data available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      {periodResults.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {periodResults.map(pr => (
            <button
              key={pr.timePeriod}
              onClick={() => setSelectedPeriod(pr.timePeriod as TimePeriod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedPeriod === pr.timePeriod
                  ? 'bg-electric-500/20 text-electric-300 border border-electric-500/30'
                  : 'bg-white/10 text-navy-300 hover:bg-white/20'
              }`}
            >
              {TIME_PERIOD_SHORT_LABELS[pr.timePeriod as TimePeriod] || pr.timePeriod}
            </button>
          ))}
        </div>
      )}

      {/* Info bar */}
      <div className="flex items-center gap-4 text-sm text-navy-300">
        <span>Demand: <strong className="text-red-400 font-mono">{formatMW(demandMW)}</strong></span>
        {showClearingPrice && (
          <span>Clearing Price: <strong className="text-yellow-400 font-mono">${periodResult.clearingPriceMWh.toFixed(0)}/MWh</strong></span>
        )}
        <span>Supply shown: <strong className="text-electric-300 font-mono">{formatMW(cumulativeMW)}</strong></span>
      </div>

      {/* Chart */}
      <div className="bg-navy-900/50 border border-white/10 rounded-xl p-4">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} barCategoryGap={0} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="cumulativeMW"
              type="number"
              domain={[0, Math.max(cumulativeMW * 1.1, demandMW * 1.2, 100)]}
              tick={{ fill: '#a0aec0', fontSize: 11 }}
              label={{ value: 'Cumulative MW', position: 'bottom', fill: '#a0aec0', fontSize: 11 }}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: '#a0aec0', fontSize: 11 }}
              label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fill: '#a0aec0', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Demand line (always visible) */}
            <ReferenceLine
              x={demandMW}
              stroke="#e53e3e"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `Demand ${formatMW(demandMW)}`, fill: '#fc8181', fontSize: 10, position: 'top' }}
            />

            {/* Clearing price line (only after final step or after marginal) */}
            {showClearingPrice && (
              <ReferenceLine
                y={periodResult.clearingPriceMWh}
                stroke="#ecc94b"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `$${periodResult.clearingPriceMWh.toFixed(0)}/MWh`,
                  fill: '#ecc94b', fontSize: 11, position: 'right',
                }}
              />
            )}

            <Bar dataKey="bidPriceMWh" name="Bid Price">
              {chartData.map((entry, idx) => {
                const isCurrentBand = idx === visibleBandCount - 1;
                const isMarginal = entry.isMarginal;
                return (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.isDispatched ? entry.color : `${entry.color}33`}
                    stroke={isMarginal ? '#ecc94b' : isCurrentBand ? '#fff' : 'transparent'}
                    strokeWidth={isMarginal ? 3 : isCurrentBand ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative */}
      <div className={`rounded-xl p-4 border transition-all ${
        narrative.highlight === 'marginal' ? 'bg-amber-500/10 border-amber-500/30' :
        narrative.highlight === 'success' ? 'bg-green-500/10 border-green-500/30' :
        narrative.highlight === 'undispatched' ? 'bg-red-500/10 border-red-500/30' :
        narrative.highlight === 'dispatched' ? 'bg-blue-500/10 border-blue-500/30' :
        'bg-white/5 border-white/10'
      }`}>
        <div className={`text-sm font-bold mb-1 ${
          narrative.highlight === 'marginal' ? 'text-amber-300' :
          narrative.highlight === 'success' ? 'text-green-300' :
          narrative.highlight === 'undispatched' ? 'text-red-300' :
          narrative.highlight === 'dispatched' ? 'text-blue-300' :
          'text-white'
        }`}>
          {narrative.highlight === 'marginal' ? '⭐ ' : ''}{narrative.title}
        </div>
        <p className="text-sm text-navy-200 leading-relaxed">{narrative.text}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={togglePlay}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-electric-500/20 text-electric-300 hover:bg-electric-500/30'
            }`}
          >
            {isPlaying ? '⏸ Pause' : isFinalStep ? '↻ Replay' : '▶ Play'}
          </button>
          <button
            onClick={goNext}
            disabled={isFinalStep}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <div className="text-xs text-navy-400">
          Step {currentStep + 1} of {totalSteps}
        </div>

        {/* Progress bar */}
        <div className="w-32 bg-navy-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-electric-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
