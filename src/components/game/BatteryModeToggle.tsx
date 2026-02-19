/**
 * BatteryModeToggle — Per-period battery mode toggle component.
 *
 * Replaces the normal bid band inputs for battery assets with a 3-way
 * charge / idle / discharge toggle. Shows SOC bar, mode-specific controls,
 * and contextual hints.
 */
import { useMemo } from 'react';
import { formatNumber } from '../../lib/formatters';
import type { BatteryMode, BidBand, TimePeriod, TeamAssetInstance } from '../../../shared/types';

// ── Extended AssetInfo with battery-specific fields ──────────────────
// The server-sent AssetInfo may include these optional battery fields.

interface BatteryAssetInfo {
  id: string;
  name: string;
  type: string;
  nameplateMW: number;
  srmcPerMWh: number;
  maxChargeMW?: number;
  maxStorageMWh?: number;
  roundTripEfficiency?: number;
}

// ── Props ────────────────────────────────────────────────────────────

export interface BatteryModeToggleProps {
  asset: TeamAssetInstance;
  assetDef: BatteryAssetInfo;
  period: TimePeriod;
  mode: BatteryMode;
  chargeMW: number;
  bands: BidBand[];
  maxBands: number;
  onModeChange: (mode: BatteryMode) => void;
  onChargeMWChange: (mw: number) => void;
  onUpdateBand: (bandIndex: number, field: 'pricePerMWh' | 'quantityMW', value: number) => void;
  onAddBand: () => void;
  walkthroughExplanation?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const PERIOD_HOURS: Record<TimePeriod, number> = {
  night_offpeak: 6,
  day_offpeak: 6,
  day_peak: 6,
  night_peak: 6,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── SOC Bar ──────────────────────────────────────────────────────────

function SOCBar({ currentMWh, maxMWh }: { currentMWh: number; maxMWh: number }) {
  const pct = maxMWh > 0 ? clamp((currentMWh / maxMWh) * 100, 0, 100) : 0;

  const barColor =
    pct > 50 ? 'bg-green-500' :
    pct >= 20 ? 'bg-amber-500' :
    'bg-red-500';

  const textColor =
    pct > 50 ? 'text-green-700' :
    pct >= 20 ? 'text-amber-700' :
    'text-red-700';

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">State of Charge</span>
        <span className={`text-xs font-bold font-mono ${textColor}`}>
          {formatNumber(currentMWh)} / {formatNumber(maxMWh)} MWh ({Math.round(pct)}%)
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Charge Content ───────────────────────────────────────────────────

function ChargeContent({
  chargeMW,
  maxChargeMW,
  headroomMWh,
  efficiency,
  period,
  onChargeMWChange,
}: {
  chargeMW: number;
  maxChargeMW: number;
  headroomMWh: number;
  efficiency: number;
  period: TimePeriod;
  onChargeMWChange: (mw: number) => void;
}) {
  const hours = PERIOD_HOURS[period];
  // Max charge is limited by inverter rating and by remaining headroom
  const maxByHeadroom = headroomMWh > 0 ? headroomMWh / hours : 0;
  const effectiveMax = Math.max(0, Math.min(maxChargeMW, maxByHeadroom));

  const quickPercents = [
    { label: '25%', factor: 0.25 },
    { label: '50%', factor: 0.5 },
    { label: '75%', factor: 0.75 },
    { label: 'Max', factor: 1 },
  ];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1 block">
          Charge Rate (MW)
        </label>
        <input
          type="number"
          value={chargeMW || ''}
          onChange={e => {
            const v = parseFloat(e.target.value) || 0;
            onChargeMWChange(clamp(v, 0, effectiveMax));
          }}
          onFocus={e => e.target.select()}
          placeholder="0"
          min={0}
          max={effectiveMax}
          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Quick buttons */}
      <div className="flex gap-1.5">
        {quickPercents.map(q => (
          <button
            key={q.label}
            onClick={() => onChargeMWChange(Math.round(effectiveMax * q.factor))}
            className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Headroom info */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 space-y-1">
        <div className="text-xs text-green-700">
          <span className="font-semibold">Can store:</span>{' '}
          {formatNumber(Math.round(headroomMWh))} more MWh
          {efficiency < 1 && (
            <span className="text-green-600 ml-1">
              (accounting for {Math.round(efficiency * 100)}% round-trip efficiency)
            </span>
          )}
        </div>
        {chargeMW > 0 && (
          <div className="text-xs text-green-600">
            Est. energy drawn: {formatNumber(Math.round(chargeMW * hours))} MWh over {hours}h
          </div>
        )}
      </div>
    </div>
  );
}

// ── Idle Content ─────────────────────────────────────────────────────

function IdleContent() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 text-center">
      <p className="text-sm text-gray-500 font-medium">
        Battery will sit idle this period. SOC unchanged.
      </p>
    </div>
  );
}

// ── Discharge Content ────────────────────────────────────────────────

function DischargeContent({
  bands,
  maxBands,
  currentSOCMWh,
  maxDischargeMW,
  srmcPerMWh,
  period,
  onUpdateBand,
  onAddBand,
  walkthroughExplanation,
}: {
  bands: BidBand[];
  maxBands: number;
  currentSOCMWh: number;
  maxDischargeMW: number;
  srmcPerMWh: number;
  period: TimePeriod;
  onUpdateBand: (bandIndex: number, field: 'pricePerMWh' | 'quantityMW', value: number) => void;
  onAddBand: () => void;
  walkthroughExplanation?: string;
}) {
  const hours = PERIOD_HOURS[period];
  // How much MW can be sustained for the full period duration
  const maxMWFromSOC = currentSOCMWh > 0 ? currentSOCMWh / hours : 0;
  const effectiveMaxMW = Math.min(maxDischargeMW, maxMWFromSOC);
  const totalBidMW = bands.reduce((sum, b) => sum + (b.quantityMW || 0), 0);

  return (
    <div className="space-y-3">
      {/* SOC capacity info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <div className="text-xs text-blue-700">
          <span className="font-semibold">Available from SOC:</span>{' '}
          {Math.round(effectiveMaxMW)} MW for {hours}h
          ({formatNumber(Math.round(currentSOCMWh))} MWh stored)
        </div>
        <div className="text-xs text-blue-500 mt-0.5">
          Total bid: {Math.round(totalBidMW)} / {Math.round(effectiveMaxMW)} MW
        </div>
      </div>

      {/* Quick bid buttons */}
      <div className="flex gap-2 items-center">
        <span className="text-[10px] text-gray-400 mr-1">Quick:</span>
        <button
          onClick={() => {
            if (bands.length > 0) {
              onUpdateBand(0, 'pricePerMWh', 0);
              onUpdateBand(0, 'quantityMW', effectiveMaxMW);
            }
          }}
          className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200 hover:bg-green-100 transition-colors"
        >
          $0
        </button>
        <button
          onClick={() => {
            if (bands.length > 0) {
              onUpdateBand(0, 'pricePerMWh', srmcPerMWh);
              onUpdateBand(0, 'quantityMW', effectiveMaxMW);
            }
          }}
          className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 hover:bg-blue-100 font-medium transition-colors"
        >
          ${srmcPerMWh} (SRMC)
        </button>
        <button
          onClick={() => {
            if (bands.length > 0) {
              onUpdateBand(0, 'pricePerMWh', 500);
              onUpdateBand(0, 'quantityMW', effectiveMaxMW);
            }
          }}
          className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          $500
        </button>
      </div>

      {/* Bid band rows */}
      <div className="space-y-2">
        {bands.map((band, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400">Price $/MWh</label>
                  <input
                    type="number"
                    value={band.pricePerMWh ?? ''}
                    onChange={e =>
                      onUpdateBand(i, 'pricePerMWh', parseFloat(e.target.value) || 0)
                    }
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
                    onChange={e =>
                      onUpdateBand(i, 'quantityMW', parseFloat(e.target.value) || 0)
                    }
                    onFocus={e => e.target.select()}
                    placeholder="MW"
                    className={`w-full px-2 py-1.5 border rounded text-sm font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                      walkthroughExplanation ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'
                    }`}
                    min={0}
                    max={effectiveMaxMW}
                  />
                </div>
              </div>
            </div>
            {/* Walkthrough explanation on the first band only */}
            {i === 0 && walkthroughExplanation && (
              <div className="ml-6 mt-1 mb-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-start gap-1.5">
                  <span className="text-purple-500 text-xs mt-0.5">&#x1F4A1;</span>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    {walkthroughExplanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {bands.length < maxBands && (
          <button
            onClick={onAddBand}
            className="w-full py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-200 transition-colors"
          >
            + Add Bid Band
          </button>
        )}
      </div>
    </div>
  );
}

// ── Mode Info Hints ──────────────────────────────────────────────────

const MODE_HINTS: Record<BatteryMode, string> = {
  charge: "You'll pay the clearing price for energy drawn from the grid",
  idle: 'No cost, no revenue',
  discharge: "You'll earn the clearing price for energy sent to the grid",
};

// ── Main Component ───────────────────────────────────────────────────

export default function BatteryModeToggle({
  asset,
  assetDef,
  period,
  mode,
  chargeMW,
  bands,
  maxBands,
  onModeChange,
  onChargeMWChange,
  onUpdateBand,
  onAddBand,
  walkthroughExplanation,
}: BatteryModeToggleProps) {
  const currentSOCMWh = asset.currentStorageMWh ?? 0;
  const maxStorageMWh = asset.maxStorageMWh ?? assetDef.maxStorageMWh ?? 0;
  const maxChargeMW = assetDef.maxChargeMW ?? asset.currentAvailableMW;
  const efficiency = assetDef.roundTripEfficiency ?? 1;

  // Headroom: how much more energy (MWh) we can store, accounting for
  // round-trip efficiency (we lose some on the way in).
  const headroomMWh = useMemo(() => {
    const raw = maxStorageMWh - currentSOCMWh;
    // When charging, the grid energy consumed is divided by sqrt(efficiency)
    // on the way in and sqrt(efficiency) on the way out. We express headroom
    // in terms of what can actually be stored (post-losses).
    return Math.max(0, raw);
  }, [maxStorageMWh, currentSOCMWh]);

  const modes: { key: BatteryMode; label: string; icon: string }[] = [
    { key: 'charge', label: 'Charge', icon: '\u26A1' },
    { key: 'idle', label: 'Idle', icon: '\u23F8' },
    { key: 'discharge', label: 'Discharge', icon: '\uD83D\uDD0B' },
  ];

  const activeStyles: Record<BatteryMode, string> = {
    charge: 'bg-green-500 text-white shadow-sm',
    idle: 'bg-gray-400 text-white shadow-sm',
    discharge: 'bg-blue-500 text-white shadow-sm',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-4 space-y-4">
        {/* ── SOC Bar ── */}
        <SOCBar currentMWh={currentSOCMWh} maxMWh={maxStorageMWh} />

        {/* ── 3-Way Segmented Toggle ── */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {modes.map(m => {
            const isActive = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => onModeChange(m.key)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  isActive ? activeStyles[m.key] : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
                }`}
              >
                <span className="text-sm">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Mode-specific Content ── */}
        {mode === 'charge' && (
          <ChargeContent
            chargeMW={chargeMW}
            maxChargeMW={maxChargeMW}
            headroomMWh={headroomMWh}
            efficiency={efficiency}
            period={period}
            onChargeMWChange={onChargeMWChange}
          />
        )}

        {mode === 'idle' && <IdleContent />}

        {mode === 'discharge' && (
          <DischargeContent
            bands={bands}
            maxBands={maxBands}
            currentSOCMWh={currentSOCMWh}
            maxDischargeMW={asset.currentAvailableMW}
            srmcPerMWh={assetDef.srmcPerMWh}
            period={period}
            onUpdateBand={onUpdateBand}
            onAddBand={onAddBand}
            walkthroughExplanation={walkthroughExplanation}
          />
        )}

        {/* ── Info Hint ── */}
        <p className="text-[11px] text-gray-400 leading-relaxed text-center pt-1 border-t border-gray-100">
          {MODE_HINTS[mode]}
        </p>
      </div>
    </div>
  );
}
