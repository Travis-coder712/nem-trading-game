import type { Season, TimePeriod } from '../../shared/types.ts';

/**
 * Seasonal demand multipliers relative to a base demand value.
 * Summer peaks are driven by air conditioning (afternoon).
 * Winter peaks are driven by heating (evening).
 * Spring/autumn have lower, flatter demand.
 */
export const SEASONAL_DEMAND_MULTIPLIERS: Record<Season, Record<TimePeriod, number>> = {
  summer: {
    night_offpeak: 0.65,
    day_offpeak: 0.80,
    day_peak: 1.20,
    night_peak: 0.95,
  },
  autumn: {
    night_offpeak: 0.55,
    day_offpeak: 0.70,
    day_peak: 0.85,
    night_peak: 0.80,
  },
  winter: {
    night_offpeak: 0.60,
    day_offpeak: 0.75,
    day_peak: 0.90,
    night_peak: 1.15,
  },
  spring: {
    night_offpeak: 0.50,
    day_offpeak: 0.65,
    day_peak: 0.80,
    night_peak: 0.75,
  },
};

/**
 * Calculate the base demand for the game scaled to the number of teams.
 * The demand is calibrated so that about 65-80% of total generation capacity
 * is needed on average, creating a competitive market.
 */
export function calculateBaseDemand(teamCount: number): number {
  // Each team starts with 800MW coal
  // With all assets: ~800 + 350 + 150 + 300 + 200 + 250 + 150 = 2200MW per team
  // But renewables have capacity factors, so effective is less
  // Base demand targets ~70% of total coal capacity for early rounds
  return teamCount * 560; // ~70% of 800MW per team
}

/**
 * Generate demand values for each time period in a round.
 */
export function generateDemandForRound(
  teamCount: number,
  season: Season,
  periods: TimePeriod[],
  variability: number,
  roundNumber: number,
  scenarioMultiplier: Record<string, number> = {},
): Record<string, number> {
  const baseDemand = calculateScaledBaseDemand(teamCount, roundNumber);
  const demand: Record<string, number> = {};

  for (const period of periods) {
    const seasonalMult = SEASONAL_DEMAND_MULTIPLIERS[season][period];
    const scenarioMult = scenarioMultiplier[period] || 1.0;
    const randomVariation = 1 + (Math.random() * 2 - 1) * variability;

    demand[period] = Math.round(baseDemand * seasonalMult * scenarioMult * randomVariation);
  }

  return demand;
}

/**
 * Scale base demand based on round number (more assets = higher demand)
 */
function calculateScaledBaseDemand(teamCount: number, roundNumber: number): number {
  const coalBase = teamCount * 560;

  if (roundNumber <= 4) {
    return coalBase;
  } else if (roundNumber <= 6) {
    // Gas added - increase demand to make gas economic at peaks
    return coalBase * 1.3;
  } else if (roundNumber <= 8) {
    // Renewables + hydro + battery added
    return coalBase * 1.5;
  } else {
    // Full portfolio - complex demand
    return coalBase * 1.6;
  }
}
