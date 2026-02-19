import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

type BatteryMode = 'charge' | 'idle' | 'discharge';
type Phase = 'INTRO' | 'DECIDE' | 'REVEAL' | 'RESULTS';

interface BatteryArbitrageMiniGameProps {
  onComplete: (result: { totalProfit: number; optimalProfit: number }) => void;
  onSkip: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_MW = 500;
const MAX_STORAGE = 2000;
const EFFICIENCY = 0.92;
const HOURS = 24;

// ─── Price Generation ────────────────────────────────────────────────────────

function generatePrices(): { predispatch: number[]; actuals: number[] } {
  const baseProfile = [
    35, 32, 28, 25, 24, 26,      // 00-05: overnight low
    38, 55, 72, 65, 48, 35,      // 06-11: morning ramp, then solar pushes down
    25, 18, 15, 20, 35, 65,      // 12-17: solar glut midday, then ramp up
    120, 145, 130, 95, 65, 45,   // 18-23: evening peak then decline
  ];

  const predispatch = baseProfile.map(p => {
    const variation = 1 + (Math.random() - 0.5) * 0.30;
    return Math.round(p * variation);
  });

  const actuals = predispatch.map(p => {
    const variation = 1 + (Math.random() - 0.5) * 0.40;
    return Math.max(0, Math.round(p * variation));
  });

  return { predispatch, actuals };
}

// ─── Profit Simulation ───────────────────────────────────────────────────────

function simulateProfit(
  decisions: BatteryMode[],
  prices: number[],
  initialSOC: number,
): { profit: number; socHistory: number[] } {
  let soc = initialSOC;
  let profit = 0;
  const socHistory: number[] = [soc];

  for (let h = 0; h < HOURS; h++) {
    const price = prices[h];
    if (decisions[h] === 'charge') {
      const roomForCharge = (MAX_STORAGE - soc) / EFFICIENCY;
      const chargeAmount = Math.min(MAX_MW, roomForCharge);
      if (chargeAmount > 0) {
        soc += chargeAmount * EFFICIENCY;
        profit -= price * chargeAmount;
      }
    } else if (decisions[h] === 'discharge') {
      const dischargeAmount = Math.min(MAX_MW, soc);
      if (dischargeAmount > 0) {
        soc -= dischargeAmount;
        profit += price * dischargeAmount;
      }
    }
    socHistory.push(soc);
  }

  return { profit, socHistory };
}

// ─── Optimal Strategy ────────────────────────────────────────────────────────

function calculateOptimalProfit(actuals: number[], initialSOC: number): number {
  const indexed = actuals.map((price, hour) => ({ price, hour }));
  const sorted = [...indexed].sort((a, b) => a.price - b.price);

  const chargeHours = new Set(sorted.slice(0, 8).map(h => h.hour));
  const dischargeHours = new Set(sorted.slice(-8).map(h => h.hour));

  // Determine actions respecting chronological SOC constraints
  const actions: BatteryMode[] = new Array(HOURS).fill('idle');
  for (let h = 0; h < HOURS; h++) {
    if (chargeHours.has(h)) {
      actions[h] = 'charge';
    } else if (dischargeHours.has(h)) {
      actions[h] = 'discharge';
    }
  }

  // Simulate chronologically to respect SOC constraints
  let soc = initialSOC;
  let profit = 0;
  for (let h = 0; h < HOURS; h++) {
    if (actions[h] === 'charge' && soc < MAX_STORAGE) {
      const chargeAmount = Math.min(MAX_MW, (MAX_STORAGE - soc) / EFFICIENCY);
      soc += chargeAmount * EFFICIENCY;
      profit -= actuals[h] * chargeAmount;
    } else if (actions[h] === 'discharge' && soc > 0) {
      const dischargeAmount = Math.min(MAX_MW, soc);
      soc -= dischargeAmount;
      profit += actuals[h] * dischargeAmount;
    }
  }

  return profit;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}:00`;
}

function formatCurrency(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function priceColor(price: number): string {
  if (price >= 100) return 'text-red-600 font-semibold';
  if (price >= 60) return 'text-amber-600';
  if (price >= 30) return 'text-gray-700';
  return 'text-green-600';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BatteryArbitrageMiniGame({
  onComplete,
  onSkip,
}: BatteryArbitrageMiniGameProps) {
  const [phase, setPhase] = useState<Phase>('INTRO');
  const [decisions, setDecisions] = useState<BatteryMode[]>(
    () => new Array(HOURS).fill('idle') as BatteryMode[],
  );
  const [prices, setPrices] = useState<{
    predispatch: number[];
    actuals: number[];
  }>(() => generatePrices());
  const [initialSOC, setInitialSOC] = useState<number>(() =>
    Math.round(MAX_STORAGE * (0.2 + Math.random() * 0.6)),
  );
  const [revealProgress, setRevealProgress] = useState(0);

  // Generate prices on mount
  useEffect(() => {
    setPrices(generatePrices());
    setInitialSOC(Math.round(MAX_STORAGE * (0.2 + Math.random() * 0.6)));
  }, []);

  // ─── Derived state ──────────────────────────────────────────────────────

  const predispatchResult = useMemo(
    () => simulateProfit(decisions, prices.predispatch, initialSOC),
    [decisions, prices.predispatch, initialSOC],
  );

  const actualResult = useMemo(
    () => simulateProfit(decisions, prices.actuals, initialSOC),
    [decisions, prices.actuals, initialSOC],
  );

  const optimalProfit = useMemo(
    () => calculateOptimalProfit(prices.actuals, initialSOC),
    [prices.actuals, initialSOC],
  );

  const currentSOC = predispatchResult.socHistory[predispatchResult.socHistory.length - 1];

  // ─── Actions ────────────────────────────────────────────────────────────

  const setDecision = useCallback((hour: number, mode: BatteryMode) => {
    setDecisions(prev => {
      const next = [...prev];
      next[hour] = mode;
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const newPrices = generatePrices();
    const newSOC = Math.round(MAX_STORAGE * (0.2 + Math.random() * 0.6));
    setPrices(newPrices);
    setInitialSOC(newSOC);
    setDecisions(new Array(HOURS).fill('idle') as BatteryMode[]);
    setRevealProgress(0);
    setPhase('INTRO');
  }, []);

  const handleSubmitDecisions = useCallback(() => {
    setRevealProgress(0);
    setPhase('REVEAL');
  }, []);

  // Reveal animation
  useEffect(() => {
    if (phase !== 'REVEAL') return;
    if (revealProgress >= HOURS) return;
    const timer = setTimeout(() => {
      setRevealProgress(prev => prev + 1);
    }, 80);
    return () => clearTimeout(timer);
  }, [phase, revealProgress]);

  // ─── Phase content rendering ────────────────────────────────────────────

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  INTRO PHASE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        <div className="text-6xl mb-4">&#9889;</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          Battery Arbitrage Challenge
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          You have a 500 MW battery with 2,000 MWh storage. Your job: charge
          when electricity is cheap, discharge when it's expensive, and maximize
          your profit over 24 hours.
        </p>

        {/* Battery specs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Battery Specifications
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">500</div>
              <div className="text-xs text-gray-500">MW Power</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">2,000</div>
              <div className="text-xs text-gray-500">MWh Storage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">92%</div>
              <div className="text-xs text-gray-500">Round-trip Eff.</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Starting State of Charge:{' '}
              <span className="font-bold text-gray-800">
                {initialSOC.toLocaleString()} MWh
              </span>{' '}
              <span className="text-gray-400">
                ({((initialSOC / MAX_STORAGE) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Pre-dispatch price preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pre-dispatch Price Forecast
          </h3>
          <div className="flex items-end gap-[2px] h-16">
            {prices.predispatch.map((p, i) => {
              const maxP = Math.max(...prices.predispatch);
              const height = Math.max(4, (p / maxP) * 100);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${height}%`,
                    backgroundColor:
                      p >= 100
                        ? '#ef4444'
                        : p >= 60
                          ? '#f59e0b'
                          : p >= 30
                            ? '#6b7280'
                            : '#22c55e',
                  }}
                  title={`${formatHour(i)}: $${p}/MWh`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPhase('DECIDE')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold transition-colors shadow-sm"
          >
            Start Challenge
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  DECIDE PHASE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDecide = () => {
    // Check if current decisions are valid (no SOC constraint violations)
    const socSteps = predispatchResult.socHistory;
    const hasViolation = socSteps.some(s => s < -0.01 || s > MAX_STORAGE + 0.01);

    return (
      <div className="flex flex-col min-h-full">
        {/* Sticky top bar with SOC + P&L */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* SOC bar */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                  State of Charge
                </span>
                <span className="text-xs font-mono text-gray-700">
                  {Math.round(currentSOC).toLocaleString()} / {MAX_STORAGE.toLocaleString()} MWh
                  ({((currentSOC / MAX_STORAGE) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentSOC / MAX_STORAGE) * 100))}%`,
                    backgroundColor:
                      currentSOC / MAX_STORAGE > 0.7
                        ? '#22c55e'
                        : currentSOC / MAX_STORAGE > 0.3
                          ? '#3b82f6'
                          : '#ef4444',
                  }}
                />
              </div>
            </div>

            {/* P&L display */}
            <div className="text-right shrink-0">
              <div className="text-xs font-medium text-gray-500 mb-0.5">
                Estimated P&L
              </div>
              <div
                className={`text-xl font-bold font-mono ${
                  predispatchResult.profit >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(predispatchResult.profit)}
              </div>
            </div>
          </div>
        </div>

        {/* Hour grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-5xl mx-auto">
            {/* Desktop: 4-column grid */}
            <div className="hidden md:grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(col => (
                <div key={col} className="space-y-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                    {col === 0
                      ? 'Overnight (00-05)'
                      : col === 1
                        ? 'Morning (06-11)'
                        : col === 2
                          ? 'Midday (12-17)'
                          : 'Evening (18-23)'}
                  </div>
                  {Array.from({ length: 6 }, (_, i) => col * 6 + i).map(h => (
                    <HourRow
                      key={h}
                      hour={h}
                      price={prices.predispatch[h]}
                      mode={decisions[h]}
                      onSetMode={mode => setDecision(h, mode)}
                      socBefore={predispatchResult.socHistory[h]}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile: vertical list */}
            <div className="md:hidden space-y-1">
              {Array.from({ length: HOURS }, (_, h) => (
                <HourRow
                  key={h}
                  hour={h}
                  price={prices.predispatch[h]}
                  mode={decisions[h]}
                  onSetMode={mode => setDecision(h, mode)}
                  socBefore={predispatchResult.socHistory[h]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setPhase('INTRO')}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              &larr; Back
            </button>
            {hasViolation && (
              <span className="text-xs text-red-500">
                SOC constraint violated &mdash; adjust decisions
              </span>
            )}
            <button
              onClick={handleSubmitDecisions}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
            >
              Submit Decisions
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  REVEAL PHASE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderReveal = () => {
    const allRevealed = revealProgress >= HOURS;

    return (
      <div className="flex flex-col min-h-full">
        {/* Dramatic comparison header */}
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Market Prices Revealed
            </h2>
            {allRevealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-4 flex-wrap"
              >
                <div className="text-sm text-gray-500">
                  Expected Profit:{' '}
                  <span
                    className={`font-bold font-mono ${
                      predispatchResult.profit >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(predispatchResult.profit)}
                  </span>
                </div>
                <div className="text-xl text-gray-400">&rarr;</div>
                <div className="text-sm text-gray-500">
                  Actual Profit:{' '}
                  <span
                    className={`font-bold font-mono text-lg ${
                      actualResult.profit >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(actualResult.profit)}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Reveal grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-5xl mx-auto">
            {/* Table header */}
            <div className="bg-gray-100 rounded-t-xl px-4 py-2 grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Hour</div>
              <div className="col-span-2 text-right">Forecast</div>
              <div className="col-span-2 text-right">Actual</div>
              <div className="col-span-2 text-center">Diff</div>
              <div className="col-span-2 text-center">Action</div>
              <div className="col-span-2 text-right">P&L</div>
            </div>

            {/* Rows */}
            <div className="bg-white rounded-b-xl border border-gray-200 divide-y divide-gray-100">
              {Array.from({ length: HOURS }, (_, h) => {
                const revealed = h < revealProgress;
                const predPrice = prices.predispatch[h];
                const actPrice = prices.actuals[h];
                const diff = actPrice - predPrice;
                const mode = decisions[h];

                let hourPL = 0;
                if (revealed) {
                  if (mode === 'charge') {
                    const roomForCharge =
                      (MAX_STORAGE - actualResult.socHistory[h]) / EFFICIENCY;
                    const amt = Math.min(MAX_MW, Math.max(0, roomForCharge));
                    hourPL = -actPrice * amt;
                  } else if (mode === 'discharge') {
                    const amt = Math.min(MAX_MW, actualResult.socHistory[h]);
                    hourPL = actPrice * amt;
                  }
                }

                return (
                  <motion.div
                    key={h}
                    initial={false}
                    animate={{
                      backgroundColor: revealed
                        ? h % 2 === 0
                          ? '#ffffff'
                          : '#f9fafb'
                        : '#f3f4f6',
                    }}
                    className="grid grid-cols-12 px-4 py-2 items-center text-sm"
                  >
                    <div className="col-span-2 font-mono text-gray-700 text-xs">
                      {formatHour(h)}
                    </div>
                    <div
                      className={`col-span-2 text-right font-mono text-xs ${priceColor(predPrice)}`}
                    >
                      ${predPrice}
                    </div>
                    <div
                      className={`col-span-2 text-right font-mono text-xs ${
                        revealed ? priceColor(actPrice) : 'text-gray-300'
                      }`}
                    >
                      {revealed ? `$${actPrice}` : '---'}
                    </div>
                    <div className="col-span-2 text-center font-mono text-xs">
                      {revealed ? (
                        <span
                          className={
                            diff > 0
                              ? 'text-red-500'
                              : diff < 0
                                ? 'text-green-500'
                                : 'text-gray-400'
                          }
                        >
                          {diff > 0 ? '+' : ''}
                          {diff}
                        </span>
                      ) : (
                        <span className="text-gray-300">---</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          mode === 'charge'
                            ? 'bg-green-100 text-green-700'
                            : mode === 'discharge'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {mode === 'charge'
                          ? 'CHG'
                          : mode === 'discharge'
                            ? 'DIS'
                            : 'IDLE'}
                      </span>
                    </div>
                    <div
                      className={`col-span-2 text-right font-mono text-xs ${
                        revealed
                          ? hourPL > 0
                            ? 'text-green-600 font-semibold'
                            : hourPL < 0
                              ? 'text-red-600'
                              : 'text-gray-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {revealed
                        ? hourPL !== 0
                          ? formatCurrency(hourPL)
                          : '-'
                        : '---'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-5xl mx-auto text-center">
            {allRevealed ? (
              <button
                onClick={() => setPhase('RESULTS')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
              >
                See Results
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                Revealing prices... ({revealProgress}/{HOURS})
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RESULTS PHASE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderResults = () => {
    const profit = actualResult.profit;
    const ratio = optimalProfit > 0 ? profit / optimalProfit : 0;

    let insightTitle: string;
    let insightText: string;
    let insightColor: string;

    if (profit < 0) {
      insightTitle = 'Room for Improvement';
      insightText =
        'You lost money. Remember: charge LOW, discharge HIGH, and account for the 8% efficiency loss.';
      insightColor = 'border-red-200 bg-red-50 text-red-800';
    } else if (ratio >= 0.8) {
      insightTitle = 'Excellent!';
      insightText =
        'You captured most of the available value. Strong understanding of battery arbitrage.';
      insightColor = 'border-green-200 bg-green-50 text-green-800';
    } else if (ratio >= 0.5) {
      insightTitle = 'Great work!';
      insightText =
        'You made money from battery arbitrage. With better timing you could capture even more value.';
      insightColor = 'border-blue-200 bg-blue-50 text-blue-800';
    } else {
      insightTitle = 'Keep Practicing';
      insightText =
        'Tip: Focus on charging during the lowest-price hours and discharging during the highest.';
      insightColor = 'border-amber-200 bg-amber-50 text-amber-800';
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
        <div className="max-w-xl w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Results
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Here's how your battery strategy performed against actual market
            prices.
          </p>

          {/* Profit card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="text-sm text-gray-500 mb-1">Your Actual Profit</div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className={`text-5xl font-bold font-mono ${
                profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(profit)}
            </motion.div>
          </div>

          {/* Optimal comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Your profit</span>
              <span
                className={`font-mono font-bold ${
                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(profit)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Optimal profit</span>
              <span className="font-mono font-bold text-gray-700">
                {formatCurrency(optimalProfit)}
              </span>
            </div>
            <div className="h-px bg-gray-200 mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Capture rate
              </span>
              <span className="text-lg font-bold text-gray-800">
                {optimalProfit > 0
                  ? `${(ratio * 100).toFixed(0)}%`
                  : 'N/A'}
              </span>
            </div>

            {/* Capture bar */}
            {optimalProfit > 0 && (
              <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, Math.max(0, ratio * 100))}%`,
                  }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      ratio >= 0.8
                        ? '#22c55e'
                        : ratio >= 0.5
                          ? '#3b82f6'
                          : ratio >= 0
                            ? '#f59e0b'
                            : '#ef4444',
                  }}
                />
              </div>
            )}
          </div>

          {/* Insight card */}
          <div
            className={`rounded-xl border p-5 mb-4 text-left ${insightColor}`}
          >
            <div className="font-semibold mb-1">{insightTitle}</div>
            <div className="text-sm">{insightText}</div>
          </div>

          {/* Market impact insight */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 p-5 mb-8 text-left">
            <div className="font-semibold mb-1">⚡ In the Real Game: Charging Moves the Market</div>
            <div className="text-sm space-y-2">
              <p>
                Notice how actual prices differed from the forecast? In the multiplayer game, a similar
                effect happens when batteries charge — your 500 MW of charging <strong>adds to market demand</strong>,
                pushing the clearing price higher for everyone.
              </p>
              <p>
                If multiple teams charge at once, the combined load can spike prices dramatically. Plan
                your charging for periods with excess supply capacity, and watch your SOC carefully.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() =>
                onComplete({
                  totalProfit: Math.round(profit),
                  optimalProfit: Math.round(optimalProfit),
                })
              }
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
            >
              Continue to Round
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Main render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 z-[90] bg-gray-50 overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="min-h-full"
        >
          {phase === 'INTRO' && renderIntro()}
          {phase === 'DECIDE' && renderDecide()}
          {phase === 'REVEAL' && renderReveal()}
          {phase === 'RESULTS' && renderResults()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface HourRowProps {
  hour: number;
  price: number;
  mode: BatteryMode;
  onSetMode: (mode: BatteryMode) => void;
  socBefore: number;
}

function HourRow({ hour, price, mode, onSetMode, socBefore }: HourRowProps) {
  // Check if charge/discharge is feasible
  const canCharge = socBefore + MAX_MW * EFFICIENCY <= MAX_STORAGE + 0.01;
  const canDischarge = socBefore >= MAX_MW - 0.01;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
        mode === 'charge'
          ? 'bg-green-50 border-green-200'
          : mode === 'discharge'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-white border-gray-200'
      }`}
    >
      {/* Time */}
      <div className="w-12 text-xs font-mono text-gray-600 shrink-0">
        {formatHour(hour)}
      </div>

      {/* Price */}
      <div
        className={`w-14 text-right text-xs font-mono shrink-0 ${priceColor(price)}`}
      >
        ${price}
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-0.5 ml-auto shrink-0">
        <button
          onClick={() => onSetMode(mode === 'charge' ? 'idle' : 'charge')}
          disabled={!canCharge && mode !== 'charge'}
          className={`px-2 py-1 text-[10px] font-semibold rounded-l-md transition-colors ${
            mode === 'charge'
              ? 'bg-green-500 text-white'
              : canCharge
                ? 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Charge"
        >
          CHG
        </button>
        <button
          onClick={() => onSetMode('idle')}
          className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
            mode === 'idle'
              ? 'bg-gray-400 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Idle"
        >
          IDLE
        </button>
        <button
          onClick={() => onSetMode(mode === 'discharge' ? 'idle' : 'discharge')}
          disabled={!canDischarge && mode !== 'discharge'}
          className={`px-2 py-1 text-[10px] font-semibold rounded-r-md transition-colors ${
            mode === 'discharge'
              ? 'bg-blue-500 text-white'
              : canDischarge
                ? 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Discharge"
        >
          DIS
        </button>
      </div>
    </div>
  );
}
