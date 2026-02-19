import type {
  AssetBid, AssetDefinition, AssetPeriodResult, BatteryMode,
  TeamAssetInstance, TeamPeriodResult,
  TeamRoundResult, TimePeriodDispatchResult,
} from '../../shared/types.ts';

/**
 * Calculate profit/loss for each team from dispatch results.
 *
 * Revenue = dispatched_MW * period_hours * clearing_price
 * Variable Cost = dispatched_MW * period_hours * SRMC
 * Startup Cost = fixed cost if unit was not dispatched in prior period
 * Battery Charge Cost = charge_MW * period_hours * clearing_price
 * Profit = Revenue - Variable Cost - Startup Cost - Battery Charge Cost
 */
export function calculateTeamResults(
  teamId: string,
  teamName: string,
  periodResults: TimePeriodDispatchResult[],
  periodDurations: Record<string, number>,
  assetDefs: Map<string, AssetDefinition>,
  teamBids?: AssetBid[],
  teamAssets?: TeamAssetInstance[],
): TeamRoundResult {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalEnergy = 0;
  let weightedPriceSum = 0;
  let weightedPriceWeight = 0;
  const periodBreakdown: TeamPeriodResult[] = [];

  // Track which assets were dispatched in previous period for startup costs
  const previouslyDispatched = new Set<string>();

  // Track battery SOC across periods (keyed by assetDefinitionId)
  const batterySOC = new Map<string, number>();
  if (teamAssets) {
    for (const asset of teamAssets) {
      if (asset.currentStorageMWh != null && asset.maxStorageMWh != null) {
        batterySOC.set(asset.assetDefinitionId, asset.currentStorageMWh);
      }
    }
  }

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

    // Find battery bids for this period (charging bids won't be in dispatch stack)
    const periodBatteryBids = new Map<string, AssetBid>();
    if (teamBids) {
      for (const bid of teamBids) {
        if (bid.timePeriod === period && bid.teamId === teamId) {
          const def = assetDefs.get(bid.assetDefinitionId);
          if (def && def.type === 'battery') {
            periodBatteryBids.set(bid.assetDefinitionId, bid);
          }
        }
      }
    }

    const assetResults: AssetPeriodResult[] = [];
    const currentlyDispatched = new Set<string>();
    const processedAssets = new Set<string>();

    // Process dispatched assets (includes battery discharge bids that were dispatched)
    for (const [assetId, bands] of byAsset) {
      const assetDef = assetDefs.get(assetId);
      if (!assetDef) continue;
      processedAssets.add(assetId);

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

      // Battery discharge: track SOC
      let storageAtStartMWh: number | undefined;
      let storageAtEndMWh: number | undefined;
      let batteryMode: BatteryMode | undefined;

      if (assetDef.type === 'battery' && batterySOC.has(assetId)) {
        batteryMode = 'discharge';
        storageAtStartMWh = batterySOC.get(assetId)!;
        const energyUsed = Math.min(energyMWh, storageAtStartMWh);
        storageAtEndMWh = Math.max(0, storageAtStartMWh - energyUsed);
        batterySOC.set(assetId, storageAtEndMWh);
      }

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
        batteryMode,
        storageAtStartMWh,
        storageAtEndMWh,
      });

      totalRevenue += revenue;
      totalCost += variableCost + startupCost;
      totalEnergy += energyMWh;
      weightedPriceSum += clearingPrice * energyMWh;
      weightedPriceWeight += energyMWh;
    }

    // Process battery charging bids (not in dispatch stack, need separate handling)
    for (const [assetId, bid] of periodBatteryBids) {
      if (processedAssets.has(assetId) && bid.batteryMode !== 'charge') continue;

      const assetDef = assetDefs.get(assetId);
      if (!assetDef) continue;

      if (bid.batteryMode === 'charge' && bid.chargeMW && bid.chargeMW > 0) {
        const chargeMW = bid.chargeMW;
        const efficiency = assetDef.roundTripEfficiency ?? 0.92;
        const maxStorage = assetDef.maxStorageMWh ?? 0;
        const currentSOC = batterySOC.get(assetId) ?? 0;
        const storageAtStart = currentSOC;

        // Calculate how much energy can actually be stored
        const storageHeadroom = maxStorage - currentSOC;
        const maxChargeEnergyMWh = storageHeadroom / efficiency; // MWh from grid needed to fill remaining storage
        const requestedEnergyMWh = chargeMW * hours;
        const actualEnergyFromGrid = Math.min(requestedEnergyMWh, maxChargeEnergyMWh);
        const energyStored = actualEnergyFromGrid * efficiency;

        const chargeCost = actualEnergyFromGrid * clearingPrice;
        const storageAtEnd = Math.min(maxStorage, currentSOC + energyStored);
        batterySOC.set(assetId, storageAtEnd);

        const profit = -chargeCost; // Charging is pure cost

        // Remove any existing discharge result for this asset (if it was also dispatched somehow)
        const existingIdx = assetResults.findIndex(r => r.assetDefinitionId === assetId);
        if (existingIdx >= 0) {
          // Replace with charge result
          const existing = assetResults[existingIdx];
          totalRevenue -= existing.revenueFromDispatch;
          totalCost -= existing.variableCost + existing.startupCost;
          totalEnergy -= existing.energyMWh;
          assetResults.splice(existingIdx, 1);
        }

        assetResults.push({
          assetDefinitionId: assetId,
          assetName: assetDef.name,
          assetType: assetDef.type,
          dispatchedMW: 0,
          durationHours: hours,
          energyMWh: 0,
          revenueFromDispatch: 0,
          variableCost: 0,
          startupCost: 0,
          profit: Math.round(profit * 100) / 100,
          batteryMode: 'charge',
          chargeMW: Math.round((actualEnergyFromGrid / hours) * 100) / 100,
          chargeCostDollars: Math.round(chargeCost * 100) / 100,
          storageAtStartMWh: Math.round(storageAtStart * 100) / 100,
          storageAtEndMWh: Math.round(storageAtEnd * 100) / 100,
        });

        totalCost += chargeCost;
      } else if (bid.batteryMode === 'idle' && !processedAssets.has(assetId)) {
        // Battery idle — record SOC unchanged
        const currentSOC = batterySOC.get(assetId) ?? 0;
        assetResults.push({
          assetDefinitionId: assetId,
          assetName: assetDef.name,
          assetType: assetDef.type,
          dispatchedMW: 0,
          durationHours: hours,
          energyMWh: 0,
          revenueFromDispatch: 0,
          variableCost: 0,
          startupCost: 0,
          profit: 0,
          batteryMode: 'idle',
          storageAtStartMWh: Math.round(currentSOC * 100) / 100,
          storageAtEndMWh: Math.round(currentSOC * 100) / 100,
        });
      }
      processedAssets.add(assetId);
    }

    const periodRevenue = assetResults.reduce((s, a) => s + a.revenueFromDispatch, 0);
    const periodCost = assetResults.reduce((s, a) => {
      return s + a.variableCost + a.startupCost + (a.chargeCostDollars ?? 0);
    }, 0);

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
