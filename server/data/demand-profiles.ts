import type { Season, TimePeriod } from '../../shared/types.ts';

/**
 * Target demand as % of fleet capacity per season/period.
 * These drive a competitive market where supply is tight at peaks
 * and loose at off-peaks. Values in range 0.50 – 1.00.
 *
 * Summer afternoon → near 100% (heatwave stress).
 * Winter evening   → near 100% (heating peak).
 * Off-peaks        → 50-65%  (plenty of spare capacity).
 */
export const DEMAND_FLEET_TARGETS: Record<Season, Record<TimePeriod, number>> = {
  summer: {
    night_offpeak: 0.55,
    day_offpeak:   0.65,
    day_peak:      0.88,    // tight but manageable without scenarios; heatwave ×1.4 → capped at 98% of fleet
    night_peak:    0.78,
  },
  autumn: {
    night_offpeak: 0.50,
    day_offpeak:   0.60,
    day_peak:      0.70,
    night_peak:    0.68,
  },
  winter: {
    night_offpeak: 0.55,
    day_offpeak:   0.65,
    day_peak:      0.75,
    night_peak:    0.85,    // tight but manageable; cold snap ×1.35 → 1.15 (shortage)
  },
  spring: {
    night_offpeak: 0.50,
    day_offpeak:   0.58,
    day_peak:      0.65,
    night_peak:    0.63,
  },
};

/**
 * Generate demand values based on actual fleet capacity per period.
 * Targets 50-95% of fleet capacity depending on season and time of day,
 * with random variability around the target.
 *
 * @param fleetCapacityPerPeriod  Total generation MW available per period (all teams, after capacity factors)
 * @param season                  Current season
 * @param periods                 Which time periods to generate demand for
 * @param variability             Random noise factor (0 = exact target, 0.05 = ±5%)
 * @param scenarioMultiplier      Scenario event demand multipliers per period
 */
export function generateDemandForRound(
  _teamCount: number,
  season: Season,
  periods: TimePeriod[],
  variability: number,
  _roundNumber: number,
  scenarioMultiplier: Record<string, number> = {},
  fleetCapacityPerPeriod?: Record<string, number>,
): Record<string, number> {
  const demand: Record<string, number> = {};

  for (const period of periods) {
    const fleetMW = fleetCapacityPerPeriod?.[period];

    if (fleetMW && fleetMW > 0) {
      // Fleet-aware demand: target a percentage of actual fleet capacity
      const target = DEMAND_FLEET_TARGETS[season][period];
      const scenarioMult = scenarioMultiplier[period] || 1.0;
      const randomVariation = 1 + (Math.random() * 2 - 1) * variability;

      const rawDemand = Math.round(fleetMW * target * scenarioMult * randomVariation);
      // Cap demand at 98% of fleet so supply always slightly exceeds demand at round start
      demand[period] = Math.min(rawDemand, Math.round(fleetMW * 0.98));
    } else {
      // Fallback: legacy fixed calculation if fleet info not available
      const baseDemand = calculateScaledBaseDemand(_teamCount, _roundNumber);
      const seasonalMult = LEGACY_SEASONAL_MULTIPLIERS[season][period];
      const scenarioMult = scenarioMultiplier[period] || 1.0;
      const randomVariation = 1 + (Math.random() * 2 - 1) * variability;

      demand[period] = Math.round(baseDemand * seasonalMult * scenarioMult * randomVariation);
    }
  }

  return demand;
}

// ---- Legacy fallback (used when fleet capacity not yet computed) ----

const LEGACY_SEASONAL_MULTIPLIERS: Record<Season, Record<TimePeriod, number>> = {
  summer: { night_offpeak: 0.65, day_offpeak: 0.80, day_peak: 1.20, night_peak: 0.95 },
  autumn: { night_offpeak: 0.55, day_offpeak: 0.70, day_peak: 0.85, night_peak: 0.80 },
  winter: { night_offpeak: 0.60, day_offpeak: 0.75, day_peak: 0.90, night_peak: 1.15 },
  spring: { night_offpeak: 0.50, day_offpeak: 0.65, day_peak: 0.80, night_peak: 0.75 },
};

function calculateScaledBaseDemand(teamCount: number, roundNumber: number): number {
  const coalBase = teamCount * 560;

  if (roundNumber <= 4) {
    return coalBase;
  } else if (roundNumber <= 6) {
    return coalBase * 1.3;
  } else if (roundNumber <= 8) {
    return coalBase * 1.5;
  } else {
    return coalBase * 1.6;
  }
}
