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
  // Step 1: Flatten all bid bands into a single list
  const allBands: DispatchCandidate[] = [];

  for (const bid of allBids) {
    if (bid.isBatteryCharging) continue; // Skip charging bids from dispatch
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

  // Step 2: Sort by price ascending with tie-breaking
  allBands.sort((a, b) => {
    if (a.bidPriceMWh !== b.bidPriceMWh) return a.bidPriceMWh - b.bidPriceMWh;
    // Tie-break: lower dispatch priority number first (renewables > thermal)
    const prioA = ASSET_TYPE_DISPATCH_PRIORITY[a.assetType] ?? 99;
    const prioB = ASSET_TYPE_DISPATCH_PRIORITY[b.assetType] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    // Tie-break: larger quantities first
    if (a.offeredMW !== b.offeredMW) return b.offeredMW - a.offeredMW;
    // Final: random
    return Math.random() - 0.5;
  });

  // Step 3: Walk the merit order
  let remainingDemand = demandMW;
  let clearingPrice = 0;
  const dispatchedBands: DispatchedBand[] = [];
  const undispatchedBands: DispatchedBand[] = [];
  let totalOfferedMW = 0;

  for (const band of allBands) {
    totalOfferedMW += band.offeredMW;

    if (remainingDemand <= 0) {
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
      continue;
    }

    if (band.offeredMW <= remainingDemand) {
      // Fully dispatch this band
      band.dispatchedMW = band.offeredMW;
      remainingDemand -= band.offeredMW;
      clearingPrice = band.bidPriceMWh;
      dispatchedBands.push({ ...band });
    } else {
      // Partially dispatch - this is the marginal unit
      band.dispatchedMW = remainingDemand;
      band.isPartiallyDispatched = true;
      band.isMarginal = true;
      clearingPrice = band.bidPriceMWh;
      remainingDemand = 0;
      dispatchedBands.push({ ...band });
    }
  }

  // Mark the last fully dispatched band as marginal if none is partial
  if (dispatchedBands.length > 0 && !dispatchedBands.some(b => b.isMarginal)) {
    dispatchedBands[dispatchedBands.length - 1].isMarginal = true;
  }

  // Step 4: Handle demand exceeding supply
  if (remainingDemand > 0) {
    clearingPrice = priceCap;
  }

  const totalDispatchedMW = demandMW - Math.max(0, remainingDemand);

  return {
    timePeriod,
    demandMW,
    clearingPriceMWh: Math.round(clearingPrice * 100) / 100,
    totalDispatchedMW,
    meritOrderStack: dispatchedBands,
    undispatchedBands,
    excessCapacityMW: Math.max(0, totalOfferedMW - demandMW),
    reserveMarginPercent: demandMW > 0
      ? Math.round(((totalOfferedMW - demandMW) / demandMW) * 10000) / 100
      : 0,
  };
}
