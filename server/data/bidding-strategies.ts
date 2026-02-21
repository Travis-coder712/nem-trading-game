import type { AssetBid, AssetDefinition, BiddingStrategy, BiddingStrategyType, RoundConfig, TeamAssetInstance, TimePeriod } from '../../shared/types.ts';
import { getWindCapacityFactor, getSolarCapacityFactor } from './assets.ts';

export const BIDDING_STRATEGIES: BiddingStrategy[] = [
  {
    id: 'price_taker',
    name: 'Price Taker',
    description: 'Bid all capacity at $0/MWh to guarantee dispatch. You accept whatever clearing price the market sets. This maximises your dispatch volume but means you have zero influence on the price. Best for: renewables, baseload coal that must keep running, and when you\'re unsure about demand.',
    shortDescription: 'Bid $0 on everything - guarantee dispatch, accept market price',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => [
        { pricePerMWh: 0, quantityMW: available }
      ]);
    },
  },
  {
    id: 'srmc_bidder',
    name: 'Marginal Cost Bidder',
    description: 'Bid at your Short Run Marginal Cost - the actual cost of producing each MWh. This is the economically rational baseline strategy. You\'ll only be dispatched when the clearing price covers your costs, and you\'ll always make at least a small margin on dispatched energy.',
    shortDescription: 'Bid at marginal cost - economically rational baseline',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => [
        { pricePerMWh: def.srmcPerMWh, quantityMW: available }
      ]);
    },
  },
  {
    id: 'price_maker',
    name: 'Price Maker',
    description: 'Bid a portion of your capacity high to try to set the clearing price. Put 60% at marginal cost to ensure some dispatch, and bid the remaining 40% at $200-500/MWh. If supply is tight, your high bids may become the marginal unit. Risk: if supply is abundant, your high-priced capacity won\'t be dispatched.',
    shortDescription: 'Bid high on some capacity to push up the clearing price',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => {
        const lowPortion = Math.round(available * 0.6);
        const highPortion = available - lowPortion;
        const bands = [
          { pricePerMWh: def.srmcPerMWh, quantityMW: lowPortion },
        ];
        if (highPortion > 0) {
          bands.push({ pricePerMWh: 300, quantityMW: highPortion });
        }
        return bands;
      });
    },
  },
  {
    id: 'portfolio_optimizer',
    name: 'Portfolio Optimizer',
    description: 'Bid each asset type according to its optimal strategy: renewables at $0, coal at marginal cost, gas mid-merit, peakers at $300+. This reflects how real gentailers manage diverse portfolios. Each asset plays its natural role in the merit order.',
    shortDescription: 'Different strategies per asset type - like a real gentailer',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => {
        switch (def.type) {
          case 'wind':
          case 'solar':
            return [{ pricePerMWh: 0, quantityMW: available }];
          case 'coal':
            return [
              { pricePerMWh: def.srmcPerMWh * 0.5, quantityMW: Math.round(available * 0.7) },
              { pricePerMWh: def.srmcPerMWh * 1.5, quantityMW: available - Math.round(available * 0.7) },
            ];
          case 'gas_ccgt':
            return [{ pricePerMWh: def.srmcPerMWh, quantityMW: available }];
          case 'gas_peaker':
            return [{ pricePerMWh: 250, quantityMW: available }];
          case 'hydro':
            return [{ pricePerMWh: 100, quantityMW: Math.round(available * 0.5) }];
          case 'battery':
            return [{ pricePerMWh: 200, quantityMW: available }];
          default:
            return [{ pricePerMWh: def.srmcPerMWh, quantityMW: available }];
        }
      });
    },
  },
  {
    id: 'strategic_withdrawal',
    name: 'Strategic Withdrawal',
    description: 'Withhold 30% of your thermal capacity by bidding it at the market cap ($20,000/MWh), effectively removing it from the market. This tightens supply and may push clearing prices higher. The remaining 70% is bid at marginal cost. WARNING: if other teams also withdraw, you could trigger extreme prices.',
    shortDescription: 'Withhold 30% capacity to tighten supply and raise prices',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => {
        if (def.type === 'wind' || def.type === 'solar') {
          return [{ pricePerMWh: 0, quantityMW: available }];
        }
        const activePortion = Math.round(available * 0.7);
        const withdrawnPortion = available - activePortion;
        const bands = [
          { pricePerMWh: def.srmcPerMWh, quantityMW: activePortion },
        ];
        if (withdrawnPortion > 0) {
          bands.push({ pricePerMWh: 20000, quantityMW: withdrawnPortion });
        }
        return bands;
      });
    },
  },
  {
    id: 'battery_arbitrageur',
    name: 'Battery Arbitrageur',
    description: 'Focus battery strategy on arbitrage: charge during cheap/negative periods, discharge at premium during peaks. Other assets bid at marginal cost. Best when there\'s a large spread between off-peak and peak prices. Battery charging bids target $0 or below, discharge at $200+.',
    shortDescription: 'Charge batteries cheap, discharge at peak premium',
    generateBids: (assets, assetDefs, roundConfig) => {
      return generateStrategyBids(assets, assetDefs, roundConfig, (def, available) => {
        if (def.type === 'battery') {
          // Discharge at high price
          return [{ pricePerMWh: 200, quantityMW: available }];
        }
        if (def.type === 'wind' || def.type === 'solar') {
          return [{ pricePerMWh: 0, quantityMW: available }];
        }
        return [{ pricePerMWh: def.srmcPerMWh, quantityMW: available }];
      });
    },
  },
];

function generateStrategyBids(
  assets: TeamAssetInstance[],
  assetDefs: Map<string, AssetDefinition>,
  roundConfig: RoundConfig,
  bandGenerator: (def: AssetDefinition, availableMW: number) => { pricePerMWh: number; quantityMW: number }[],
): AssetBid[] {
  const bids: AssetBid[] = [];

  for (const period of roundConfig.timePeriods) {
    for (const asset of assets) {
      const def = assetDefs.get(asset.assetDefinitionId);
      if (!def) continue;

      let availableMW = asset.currentAvailableMW;

      // Apply capacity factors for renewables
      if (def.type === 'wind') {
        availableMW = Math.round(availableMW * getWindCapacityFactor(roundConfig.season, period as TimePeriod, def));
      } else if (def.type === 'solar') {
        availableMW = Math.round(availableMW * getSolarCapacityFactor(roundConfig.season, period as TimePeriod));
      }

      if (availableMW <= 0) continue;

      const bands = bandGenerator(def, availableMW);

      bids.push({
        assetInstanceId: `${asset.assetDefinitionId}_${asset.teamId}`,
        assetDefinitionId: asset.assetDefinitionId,
        teamId: asset.teamId,
        timePeriod: period as TimePeriod,
        bands: bands.filter(b => b.quantityMW > 0),
        totalOfferedMW: bands.reduce((s, b) => s + b.quantityMW, 0),
        submittedAt: Date.now(),
      });
    }
  }

  return bids;
}

export function getStrategyById(id: BiddingStrategyType): BiddingStrategy | undefined {
  return BIDDING_STRATEGIES.find(s => s.id === id);
}
