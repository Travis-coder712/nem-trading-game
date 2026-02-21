import type {
  AssetBid, AssetDefinition, AssetType,
  DispatchedBand, TimePeriod, TimePeriodDispatchResult,
} from '../../shared/types.ts';

interface DispatchCandidate {
  teamId: string;
  teamName: string;
  assetDefinitionId: string;
  assetName: string;
  assetType: AssetType;
  bandIndex: number;
  bidPriceMWh: number;
  offeredMW: number;
  dispatchedMW: number;
  isPartiallyDispatched: boolean;
  isMarginal: boolean;
}

const ASSET_TYPE_DISPATCH_PRIORITY: Record<AssetType, number> = {
  solar: 0,
  wind: 1,
  hydro: 2,
  battery: 3,
  coal: 4,
  gas_ccgt: 5,
  gas_peaker: 6,
};

/**
 * Merit Order Dispatch Engine
 *
 * Implements a simplified version of AEMO's NEMDE:
 * 1. Collect all bid bands from all teams for a given time period
 * 2. Sort all bands by price ascending (merit order)
 * 3. Walk up the merit order dispatching each band until demand is met
 * 4. The marginal band sets the clearing price
 * 5. All dispatched generators earn the clearing price
 */
export function dispatchTimePeriod(
  allBids: AssetBid[],
  demandMW: number,
  timePeriod: TimePeriod,
  priceCap: number,
  priceFloor: number,
  assetDefs: Map<string, AssetDefinition>,
  teamNames: Map<string, string>,
): TimePeriodDispatchResult {
  // Step 1: Collect battery charging load (not part of supply, batteries pay clearing price)
  let totalChargingLoadMW = 0;
  for (const bid of allBids) {
    if ((bid.batteryMode === 'charge' || bid.isBatteryCharging) && bid.chargeMW && bid.chargeMW > 0) {
      totalChargingLoadMW += bid.chargeMW;
    }
  }

  // Step 2: Flatten all bid bands into a single list (skip charging bids)
  const allBands: DispatchCandidate[] = [];

  for (const bid of allBids) {
    if (bid.isBatteryCharging || bid.batteryMode === 'charge' || bid.batteryMode === 'idle') continue; // Skip charging/idle bids from dispatch
    const assetDef = assetDefs.get(bid.assetDefinitionId);
    if (!assetDef) continue;

    for (let i = 0; i < bid.bands.length; i++) {
      const band = bid.bands[i];
      if (band.quantityMW <= 0) continue;

      const clampedPrice = Math.max(priceFloor, Math.min(priceCap, band.pricePerMWh));

      allBands.push({
        teamId: bid.teamId,
        teamName: teamNames.get(bid.teamId) || `Team ${bid.teamId}`,
        assetDefinitionId: bid.assetDefinitionId,
        assetName: assetDef.name,
        assetType: assetDef.type,
        bandIndex: i,
        bidPriceMWh: clampedPrice,
        offeredMW: band.quantityMW,
        dispatchedMW: 0,
        isPartiallyDispatched: false,
        isMarginal: false,
      });
    }
  }

  // Step 3: Sort by price ascending (deterministic tie-breaking for grouping order only)
  allBands.sort((a, b) => {
    if (a.bidPriceMWh !== b.bidPriceMWh) return a.bidPriceMWh - b.bidPriceMWh;
    // Deterministic tie-break for stable ordering within price groups
    // (pro-rata dispatch means ordering within a tied group doesn't affect dispatch amounts)
    const prioA = ASSET_TYPE_DISPATCH_PRIORITY[a.assetType] ?? 99;
    const prioB = ASSET_TYPE_DISPATCH_PRIORITY[b.assetType] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    if (a.teamId !== b.teamId) return a.teamId.localeCompare(b.teamId);
    return a.assetDefinitionId.localeCompare(b.assetDefinitionId);
  });

  // Step 4: Walk the merit order with pro-rata dispatch for tied bids
  //
  // Like the real AEMO NEMDE, when multiple bands are bid at the same price
  // and they collectively straddle the margin (total capacity > remaining demand),
  // dispatch is split proportionally across all tied bands rather than arbitrarily
  // fully dispatching some and partially dispatching one.
  //
  // Battery charging adds to demand — generators must serve both consumer load
  // AND battery charging load. This means if many teams charge simultaneously,
  // the market tightens and the clearing price rises.
  const totalDemandMW = demandMW + totalChargingLoadMW;
  let remainingDemand = totalDemandMW;
  let clearingPrice = 0;
  const dispatchedBands: DispatchedBand[] = [];
  const undispatchedBands: DispatchedBand[] = [];
  let totalOfferedMW = 0;

  // Process bands in price groups for pro-rata dispatch
  let i = 0;
  while (i < allBands.length) {
    // Find all bands at the same price (a "price group")
    const groupPrice = allBands[i].bidPriceMWh;
    const groupStart = i;
    let groupTotalMW = 0;
    while (i < allBands.length && allBands[i].bidPriceMWh === groupPrice) {
      groupTotalMW += allBands[i].offeredMW;
      totalOfferedMW += allBands[i].offeredMW;
      i++;
    }
    const group = allBands.slice(groupStart, i);

    if (remainingDemand <= 0) {
      // All demand already met — entire group is undispatched
      for (const band of group) {
        undispatchedBands.push({
          teamId: band.teamId,
          teamName: band.teamName,
          assetDefinitionId: band.assetDefinitionId,
          assetName: band.assetName,
          assetType: band.assetType,
          bandIndex: band.bandIndex,
          bidPriceMWh: band.bidPriceMWh,
          offeredMW: band.offeredMW,
          dispatchedMW: 0,
          isPartiallyDispatched: false,
          isMarginal: false,
        });
      }
      continue;
    }

    if (groupTotalMW <= remainingDemand) {
      // Entire group fits within remaining demand — fully dispatch all bands
      for (const band of group) {
        band.dispatchedMW = band.offeredMW;
        clearingPrice = band.bidPriceMWh;
        dispatchedBands.push({ ...band });
      }
      remainingDemand -= groupTotalMW;
    } else {
      // Pro-rata: this group straddles the margin.
      // Split remaining demand proportionally across all bands in the group.
      clearingPrice = groupPrice;
      const proRataRatio = remainingDemand / groupTotalMW;

      for (const band of group) {
        const dispatch = Math.round(band.offeredMW * proRataRatio * 100) / 100;
        if (dispatch > 0) {
          band.dispatchedMW = dispatch;
          band.isPartiallyDispatched = dispatch < band.offeredMW;
          band.isMarginal = true;
          dispatchedBands.push({ ...band });
        } else {
          undispatchedBands.push({
            teamId: band.teamId,
            teamName: band.teamName,
            assetDefinitionId: band.assetDefinitionId,
            assetName: band.assetName,
            assetType: band.assetType,
            bandIndex: band.bandIndex,
            bidPriceMWh: band.bidPriceMWh,
            offeredMW: band.offeredMW,
            dispatchedMW: 0,
            isPartiallyDispatched: false,
            isMarginal: false,
          });
        }
      }
      remainingDemand = 0;
    }
  }

  // Mark the last fully dispatched band as marginal if none is partial
  if (dispatchedBands.length > 0 && !dispatchedBands.some(b => b.isMarginal)) {
    dispatchedBands[dispatchedBands.length - 1].isMarginal = true;
  }

  // Step 5: Handle demand exceeding supply
  //
  // AEMO Emergency Generation: When demand exceeds supply, the price cap hits
  // for the first hour, then AEMO activates emergency generation (RERT/reserves)
  // to restore supply for the remaining 5 hours. The "restored price" is based
  // on the highest SRMC among dispatched generators — representing the cost of
  // emergency generation filling the gap. This prevents unrealistically large
  // profits from a full 6-hour period at the price cap.
  let aemoInterventionTriggered = false;
  let aemoRestoredPriceMWh: number | undefined;
  let aemoEffectivePriceMWh: number | undefined;

  if (remainingDemand > 0) {
    clearingPrice = priceCap;
    aemoInterventionTriggered = true;

    // Compute the restored price: highest SRMC among dispatched generators
    const dispatchedSRMCs = dispatchedBands
      .map(b => assetDefs.get(b.assetDefinitionId)?.srmcPerMWh ?? 0)
      .filter(s => s > 0);
    aemoRestoredPriceMWh = dispatchedSRMCs.length > 0
      ? Math.max(...dispatchedSRMCs)
      : 200; // Fallback: typical gas peaker SRMC

    // Blended price: 1/6 at cap + 5/6 at restored
    aemoEffectivePriceMWh = Math.round(
      (priceCap * (1 / 6) + aemoRestoredPriceMWh * (5 / 6)) * 100
    ) / 100;
  }

  const totalDispatchedMW = totalDemandMW - Math.max(0, remainingDemand);

  // Step 6: Oversupply negative price trigger
  //
  // When total supply massively exceeds demand (reserve margin > 200%, meaning
  // supply is 3× demand), force the clearing price to the price floor (-$1,000/MWh).
  //
  // This models real NEM dynamics where massive oversupply — from everyone
  // discharging batteries simultaneously, or renewables flooding during low demand —
  // drives prices deeply negative. Inflexible generators are effectively "paying
  // to stay on" because the cost of shutting down and restarting exceeds the
  // short-term losses from negative prices.
  //
  // The threshold is deliberately high (3× supply:demand) so it only triggers
  // during genuinely extreme oversupply events, not normal surplus conditions.
  const reserveMarginPercent = totalDemandMW > 0
    ? Math.round(((totalOfferedMW - totalDemandMW) / totalDemandMW) * 10000) / 100
    : 0;

  let oversupplyNegativePriceTriggered = false;
  if (totalDemandMW > 0 && reserveMarginPercent > 200 && clearingPrice > priceFloor) {
    clearingPrice = priceFloor;
    oversupplyNegativePriceTriggered = true;
  }

  return {
    timePeriod,
    demandMW: totalDemandMW, // includes charging load — this is what generators must serve
    clearingPriceMWh: Math.round(clearingPrice * 100) / 100,
    totalDispatchedMW,
    meritOrderStack: dispatchedBands,
    undispatchedBands,
    excessCapacityMW: Math.max(0, totalOfferedMW - totalDemandMW),
    reserveMarginPercent,
    totalChargingLoadMW,
    oversupplyNegativePriceTriggered,
    aemoInterventionTriggered: aemoInterventionTriggered || undefined,
    aemoRestoredPriceMWh,
    aemoEffectivePriceMWh,
  };
}
