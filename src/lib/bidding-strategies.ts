/**
 * Client-side bidding strategy generator.
 * Generates bid bands for ALL assets across ALL periods with intensity control.
 */
import type { AssetBid, AssetType, BatteryMode, BidBand, TeamAssetInstance, TimePeriod, Season } from '../../shared/types';

export type StrategyId =
  | 'price_taker'
  | 'srmc_bidder'
  | 'price_maker'
  | 'portfolio_optimizer'
  | 'strategic_withdrawal'
  | 'battery_arbitrageur';

export type Intensity = 'low' | 'medium' | 'max';

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  icon: string;
  shortDescription: string;
  description: string;
  intensityLabels: Record<Intensity, string>;
}

export const STRATEGIES: StrategyDefinition[] = [
  {
    id: 'price_taker',
    name: 'Price Taker',
    icon: '🟢',
    shortDescription: 'Bid low to guarantee dispatch',
    description: 'Bid all capacity at or near $0/MWh to ensure maximum dispatch. You accept the market clearing price.',
    intensityLabels: {
      low: 'Bid at $0, 60% capacity',
      medium: 'Bid at $0, 80% capacity',
      max: 'Bid at $0, 100% capacity',
    },
  },
  {
    id: 'srmc_bidder',
    name: 'Marginal Cost Bidder',
    icon: '🔵',
    shortDescription: 'Bid at marginal cost - safe & rational',
    description: 'Bid at your Short Run Marginal Cost. Economically rational baseline - you only run when it covers costs.',
    intensityLabels: {
      low: 'Bid at 80% of marginal cost',
      medium: 'Bid at marginal cost',
      max: 'Bid at 120% of marginal cost',
    },
  },
  {
    id: 'price_maker',
    name: 'Price Maker',
    icon: '🟠',
    shortDescription: 'Bid high on some capacity to push up prices',
    description: 'Split capacity: bid part cheap for guaranteed dispatch, rest high to try to set the clearing price.',
    intensityLabels: {
      low: 'Split 70/30, high band at $150',
      medium: 'Split 60/40, high band at $300',
      max: 'Split 40/60, high band at $500',
    },
  },
  {
    id: 'portfolio_optimizer',
    name: 'Portfolio Optimizer',
    icon: '🟣',
    shortDescription: 'Smart per-asset bidding like a real gentailer',
    description: 'Each asset type uses its optimal strategy: renewables at $0, coal split, gas mid-merit, peakers at premium.',
    intensityLabels: {
      low: 'Conservative spreads, lower premiums',
      medium: 'Balanced spreads & premiums',
      max: 'Aggressive premiums on all assets',
    },
  },
  {
    id: 'strategic_withdrawal',
    name: 'Strategic Withdrawal',
    icon: '🔴',
    shortDescription: 'Withhold capacity to tighten supply',
    description: 'Bid a portion at market cap ($20,000) to effectively remove it. Tightens supply and pushes prices up.',
    intensityLabels: {
      low: 'Withhold 15% of thermal',
      medium: 'Withhold 30% of thermal',
      max: 'Withhold 50% of thermal',
    },
  },
  {
    id: 'battery_arbitrageur',
    name: 'Battery Arbitrageur',
    icon: '🟡',
    shortDescription: 'Charge cheap, discharge at premium',
    description: 'Battery charges in off-peak and discharges at peak. Other assets bid at marginal cost or slight premium.',
    intensityLabels: {
      low: 'Discharge at $100, others at marginal cost',
      medium: 'Discharge at $200, others at marginal cost',
      max: 'Discharge at $400, others above marginal cost',
    },
  },
];

/**
 * Filter available strategies based on what asset types the team currently has.
 * Hides strategies that don't make sense without the right assets.
 */
export function getAvailableStrategies(assetTypes: AssetType[]): StrategyDefinition[] {
  const typeSet = new Set(assetTypes);
  const hasBattery = typeSet.has('battery');
  const hasThermal = typeSet.has('coal') || typeSet.has('gas_ccgt') || typeSet.has('gas_peaker');
  const uniqueTypes = typeSet.size;

  return STRATEGIES.filter(s => {
    switch (s.id) {
      case 'battery_arbitrageur':
        return hasBattery;
      case 'portfolio_optimizer':
        return uniqueTypes >= 3;
      case 'strategic_withdrawal':
      case 'price_maker':
        return hasThermal;
      default:
        // price_taker and srmc_bidder always available
        return true;
    }
  });
}

// Approximate SRMC by asset type (client-side doesn't have exact per-team values)
const SRMC_DEFAULTS: Record<string, number> = {
  coal: 35,
  gas_ccgt: 75,
  gas_peaker: 140,
  hydro: 8,
  wind: 0,
  solar: 0,
  battery: 0,
};

function getAssetType(assetId: string): AssetType {
  if (assetId.includes('ccgt')) return 'gas_ccgt';
  if (assetId.includes('peaker')) return 'gas_peaker';
  const base = assetId.split('_')[0];
  return base as AssetType;
}

function getSrmc(assetId: string): number {
  const type = getAssetType(assetId);
  return SRMC_DEFAULTS[type] ?? 30;
}

function isRenewable(assetId: string): boolean {
  const type = getAssetType(assetId);
  return type === 'wind' || type === 'solar';
}

function isThermal(assetId: string): boolean {
  const type = getAssetType(assetId);
  return ['coal', 'gas_ccgt', 'gas_peaker'].includes(type);
}

/**
 * Generate bids for ALL assets across ALL periods for a given strategy+intensity.
 */
export function generateStrategyBids(
  strategyId: StrategyId,
  intensity: Intensity,
  assets: TeamAssetInstance[],
  teamId: string,
  periods: TimePeriod[],
): Map<string, AssetBid> {
  const newBids = new Map<string, AssetBid>();

  for (const period of periods) {
    for (const asset of assets) {
      const bands = generateBandsForAsset(strategyId, intensity, asset, period);
      if (bands.length === 0) continue;

      const key = `${asset.assetDefinitionId}_${period}`;
      const bid: AssetBid = {
        assetInstanceId: `${asset.assetDefinitionId}_${teamId}`,
        assetDefinitionId: asset.assetDefinitionId,
        teamId,
        timePeriod: period,
        bands,
        totalOfferedMW: bands.reduce((s, b) => s + b.quantityMW, 0),
        submittedAt: Date.now(),
      };

      // Set battery mode metadata for battery_arbitrageur strategy
      if (strategyId === 'battery_arbitrageur' && getAssetType(asset.assetDefinitionId) === 'battery') {
        const isPeak = period === 'day_peak' || period === 'night_peak';
        if (isPeak) {
          bid.batteryMode = 'discharge';
        } else {
          bid.batteryMode = 'charge';
          bid.isBatteryCharging = true;
          bid.chargeMW = asset.currentAvailableMW;
          bid.bands = [];
          bid.totalOfferedMW = 0;
        }
      }

      newBids.set(key, bid);
    }
  }

  return newBids;
}

function generateBandsForAsset(
  strategyId: StrategyId,
  intensity: Intensity,
  asset: TeamAssetInstance,
  period: TimePeriod,
): BidBand[] {
  const mw = asset.currentAvailableMW;
  if (mw <= 0) return [];

  const type = getAssetType(asset.assetDefinitionId);
  const srmc = getSrmc(asset.assetDefinitionId);

  switch (strategyId) {
    case 'price_taker':
      return priceTakerBands(mw, intensity, type);
    case 'srmc_bidder':
      return srmcBidderBands(mw, srmc, intensity, type);
    case 'price_maker':
      return priceMakerBands(mw, srmc, intensity, type);
    case 'portfolio_optimizer':
      return portfolioOptimizerBands(mw, srmc, intensity, type, period);
    case 'strategic_withdrawal':
      return strategicWithdrawalBands(mw, srmc, intensity, type);
    case 'battery_arbitrageur':
      return batteryArbitrageurBands(mw, srmc, intensity, type, period);
    default:
      return [{ pricePerMWh: srmc, quantityMW: mw }];
  }
}

// ──────────────────────────────────────────────
// Individual strategy implementations
// ──────────────────────────────────────────────

function priceTakerBands(mw: number, intensity: Intensity, type: AssetType): BidBand[] {
  const capPercent = intensity === 'low' ? 0.6 : intensity === 'medium' ? 0.8 : 1.0;
  const offered = Math.round(mw * capPercent);
  if (offered <= 0) return [];
  return [{ pricePerMWh: 0, quantityMW: offered }];
}

function srmcBidderBands(mw: number, srmc: number, intensity: Intensity, type: AssetType): BidBand[] {
  if (isRenewable(type)) {
    return [{ pricePerMWh: 0, quantityMW: mw }];
  }
  const multiplier = intensity === 'low' ? 0.8 : intensity === 'medium' ? 1.0 : 1.2;
  const price = Math.round(srmc * multiplier);
  return [{ pricePerMWh: price, quantityMW: mw }];
}

function priceMakerBands(mw: number, srmc: number, intensity: Intensity, type: AssetType): BidBand[] {
  if (isRenewable(type)) {
    return [{ pricePerMWh: 0, quantityMW: mw }];
  }

  const lowSplit = intensity === 'low' ? 0.70 : intensity === 'medium' ? 0.60 : 0.40;
  const highPrice = intensity === 'low' ? 150 : intensity === 'medium' ? 300 : 500;

  const lowMW = Math.round(mw * lowSplit);
  const highMW = mw - lowMW;

  const bands: BidBand[] = [
    { pricePerMWh: Math.max(0, srmc - 5), quantityMW: lowMW },
  ];
  if (highMW > 0) {
    bands.push({ pricePerMWh: highPrice, quantityMW: highMW });
  }
  return bands;
}

function portfolioOptimizerBands(mw: number, srmc: number, intensity: Intensity, type: AssetType, period: TimePeriod): BidBand[] {
  const mult = intensity === 'low' ? 0.8 : intensity === 'medium' ? 1.0 : 1.4;

  switch (type) {
    case 'wind':
    case 'solar':
      return [{ pricePerMWh: 0, quantityMW: mw }];

    case 'coal': {
      const lowMW = Math.round(mw * 0.65);
      const highMW = mw - lowMW;
      return [
        { pricePerMWh: Math.round(srmc * 0.5 * mult), quantityMW: lowMW },
        { pricePerMWh: Math.round(srmc * 1.8 * mult), quantityMW: highMW },
      ];
    }
    case 'gas_ccgt':
      return [
        { pricePerMWh: Math.round(srmc * mult), quantityMW: mw },
      ];

    case 'gas_peaker': {
      const premiumPrice = intensity === 'low' ? 200 : intensity === 'medium' ? 300 : 500;
      return [{ pricePerMWh: premiumPrice, quantityMW: mw }];
    }
    case 'hydro': {
      // Hydro has opportunity cost - bid higher at peak, lower off-peak
      const isPeak = period === 'day_peak' || period === 'night_peak';
      const hydroPrice = isPeak
        ? Math.round((intensity === 'low' ? 80 : intensity === 'medium' ? 120 : 200) * mult)
        : Math.round(30 * mult);
      const hydroMW = isPeak ? mw : Math.round(mw * 0.4);
      return [{ pricePerMWh: hydroPrice, quantityMW: hydroMW }];
    }
    case 'battery': {
      const isPeak = period === 'day_peak' || period === 'night_peak';
      if (isPeak) {
        const dischargePrice = intensity === 'low' ? 150 : intensity === 'medium' ? 250 : 400;
        return [{ pricePerMWh: dischargePrice, quantityMW: mw }];
      } else {
        // Charge in off-peak (bid negative or zero)
        return [{ pricePerMWh: intensity === 'max' ? -50 : 0, quantityMW: mw }];
      }
    }
    default:
      return [{ pricePerMWh: srmc, quantityMW: mw }];
  }
}

function strategicWithdrawalBands(mw: number, srmc: number, intensity: Intensity, type: AssetType): BidBand[] {
  if (isRenewable(type)) {
    return [{ pricePerMWh: 0, quantityMW: mw }];
  }

  const withdrawPercent = intensity === 'low' ? 0.15 : intensity === 'medium' ? 0.30 : 0.50;
  const activeMW = Math.round(mw * (1 - withdrawPercent));
  const withdrawnMW = mw - activeMW;

  const bands: BidBand[] = [
    { pricePerMWh: srmc, quantityMW: activeMW },
  ];
  if (withdrawnMW > 0) {
    bands.push({ pricePerMWh: 20000, quantityMW: withdrawnMW });
  }
  return bands;
}

function batteryArbitrageurBands(mw: number, srmc: number, intensity: Intensity, type: AssetType, period: TimePeriod): BidBand[] {
  const isPeak = period === 'day_peak' || period === 'night_peak';

  if (type === 'battery') {
    if (isPeak) {
      const dischargePrice = intensity === 'low' ? 100 : intensity === 'medium' ? 200 : 400;
      return [{ pricePerMWh: dischargePrice, quantityMW: mw }];
    } else {
      // Charge during off-peak
      return [{ pricePerMWh: intensity === 'max' ? -30 : 0, quantityMW: mw }];
    }
  }

  if (isRenewable(type)) {
    return [{ pricePerMWh: 0, quantityMW: mw }];
  }

  // Non-battery thermal: SRMC with slight premium at max intensity
  const mult = intensity === 'max' ? 1.15 : 1.0;
  return [{ pricePerMWh: Math.round(srmc * mult), quantityMW: mw }];
}
