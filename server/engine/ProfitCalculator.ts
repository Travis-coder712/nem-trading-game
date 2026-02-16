import type {
  AssetDefinition, AssetPeriodResult, TeamPeriodResult,
  TeamRoundResult, TimePeriodDispatchResult,
} from '../../shared/types.ts';

/**
 * Calculate profit/loss for each team from dispatch results.
 *
 * Revenue = dispatched_MW * period_hours * clearing_price
 * Variable Cost = dispatched_MW * period_hours * SRMC
 * Startup Cost = fixed cost if unit was not dispatched in prior period
 * Profit = Revenue - Variable Cost - Startup Cost
 */
export function calculateTeamResults(
  teamId: string,
  teamName: string,
  periodResults: TimePeriodDispatchResult[],
  periodDurations: Record<string, number>,
  assetDefs: Map<string, AssetDefinition>,
): TeamRoundResult {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalEnergy = 0;
  let weightedPriceSum = 0;
  let weightedPriceWeight = 0;
  const periodBreakdown: TeamPeriodResult[] = [];

  // Track which assets were dispatched in previous period for startup costs
  const previouslyDispatched = new Set<string>();

  for (const periodResult of periodResults) {
    const period = periodResult.timePeriod;
    const hours = periodDurations[period] || 6;
    const clearingPrice = periodResult.clearingPriceMWh;

    // Find this team's dispatched bands
    const teamDispatchedBands = periodResult.meritOrderStack.filter(
      b => b.teamId === teamId
    );

    // Group by asset
    const byAsset = new Map<string, typeof teamDispatchedBands>();
    for (const band of teamDispatchedBands) {
      const existing = byAsset.get(band.assetDefinitionId) || [];
      existing.push(band);
      byAsset.set(band.assetDefinitionId, existing);
    }

    const assetResults: AssetPeriodResult[] = [];
    const currentlyDispatched = new Set<string>();

    for (const [assetId, bands] of byAsset) {
      const assetDef = assetDefs.get(assetId);
      if (!assetDef) continue;

      const dispatchedMW = bands.reduce((sum, b) => sum + b.dispatchedMW, 0);

      if (dispatchedMW > 0) {
        currentlyDispatched.add(assetId);
      }

      const energyMWh = dispatchedMW * hours;
      const revenue = energyMWh * clearingPrice;
      const variableCost = energyMWh * assetDef.srmcPerMWh;

      // Startup cost if unit was off in previous period
      const wasRunning = previouslyDispatched.has(assetId);
      const startupCost = (!wasRunning && dispatchedMW > 0)
        ? assetDef.startupCostDollars
        : 0;

      const profit = revenue - variableCost - startupCost;

      assetResults.push({
        assetDefinitionId: assetId,
        assetName: assetDef.name,
        assetType: assetDef.type,
        dispatchedMW,
        durationHours: hours,
        energyMWh,
        revenueFromDispatch: Math.round(revenue * 100) / 100,
        variableCost: Math.round(variableCost * 100) / 100,
        startupCost,
        profit: Math.round(profit * 100) / 100,
      });

      totalRevenue += revenue;
      totalCost += variableCost + startupCost;
      totalEnergy += energyMWh;
      weightedPriceSum += clearingPrice * energyMWh;
      weightedPriceWeight += energyMWh;
    }

    const periodRevenue = assetResults.reduce((s, a) => s + a.revenueFromDispatch, 0);
    const periodCost = assetResults.reduce((s, a) => s + a.variableCost + a.startupCost, 0);

    periodBreakdown.push({
      timePeriod: period,
      assets: assetResults,
      periodRevenue: Math.round(periodRevenue * 100) / 100,
      periodCost: Math.round(periodCost * 100) / 100,
      periodProfit: Math.round((periodRevenue - periodCost) * 100) / 100,
    });

    // Update dispatch tracking for next period's startup cost calculation
    previouslyDispatched.clear();
    for (const id of currentlyDispatched) {
      previouslyDispatched.add(id);
    }
  }

  return {
    teamId,
    teamName,
    periodBreakdown,
    totalRevenueDollars: Math.round(totalRevenue * 100) / 100,
    totalCostDollars: Math.round(totalCost * 100) / 100,
    totalProfitDollars: Math.round((totalRevenue - totalCost) * 100) / 100,
    totalEnergyGeneratedMWh: Math.round(totalEnergy * 100) / 100,
    averagePriceMWh: weightedPriceWeight > 0
      ? Math.round((weightedPriceSum / weightedPriceWeight) * 100) / 100
      : 0,
  };
}
