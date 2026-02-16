import type { RoundConfig } from '../../../shared/types.ts';

export const experiencedReplayRounds: RoundConfig[] = [
  {
    roundNumber: 1,
    name: 'Autumn - Drought & Gas Crisis',
    description: 'Full portfolio, drought halves hydro, gas prices spiked 60%. Navigate a supply-constrained market.',
    learningObjectives: [
      'Manage portfolio under fuel price stress',
      'Optimise limited hydro resources',
    ],
    season: 'autumn',
    seasonalGuidance: {
      headline: 'Autumn + Drought + Gas Crisis: Moderate demand but constrained supply',
      demandContext: 'Autumn demand is moderate — the mildest season. But don\'t be complacent: the supply constraints change everything.',
      supplyContext: 'Drought has HALVED hydro capacity — your water is precious. Gas prices spiked 60%, dramatically increasing gas marginal costs. Wind and solar are moderate. Coal is your cheapest reliable option, but gas is now very expensive to run.',
      biddingAdvice: 'With gas costs up 60%, check your updated Marginal Cost badges carefully. Gas CCGT and peakers need much higher clearing prices to be profitable. Use your limited hydro only for the highest-price periods. Batteries are valuable for arbitraging the spread. Coal is more competitive than usual relative to expensive gas.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['coal', 'gas_ccgt', 'gas_peaker', 'wind', 'solar', 'hydro', 'battery'],
    activeScenarioEvents: ['drought', 'fuel_price_spike'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Autumn Challenge',
      slides: [
        {
          heading: 'Resource Constraints',
          body: 'Drought has halved your hydro capacity. Gas prices have spiked 60% due to LNG exports. Your full portfolio is available but conditions are tough.\n\nTry a different bidding strategy from last time and see how it affects your results.',
        },
      ],
    },
  },
  {
    roundNumber: 2,
    name: 'Winter - Dunkelflaute',
    description: 'Extended low wind and low solar during winter. Dispatchable generation is critical.',
    learningObjectives: [
      'Navigate the renewable energy drought',
      'Value dispatchable capacity appropriately',
    ],
    season: 'winter',
    seasonalGuidance: {
      headline: 'Winter Dunkelflaute: No renewables, high heating demand — thermal must deliver',
      demandContext: 'Winter demand is elevated by heating, with the Evening being the critical peak (6-9pm). The cold snap adds further pressure. Even overnight demand is higher than autumn as heating runs continuously.',
      supplyContext: 'Dunkelflaute means virtually no renewable output — wind at 10%, solar at 40% through heavy cloud. Batteries can help briefly but only have 2 hours of storage. Coal and gas carry nearly everything.',
      biddingAdvice: 'Completely different from autumn\'s supply-constrained scenario. Here, it\'s DEMAND + no renewables causing the tightness. Bid thermal assets confidently across all periods. Gas peakers may be needed even during normally quiet overnight periods. Every period is tight — there\'s no "cheap" time to charge batteries, so use them strategically.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['dunkelflaute', 'cold_snap'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Winter Dunkelflaute',
      slides: [
        {
          heading: 'Dark Doldrums + Cold Snap',
          body: 'Wind at 10% capacity, solar at 40%, plus a cold snap driving heating demand. Coal and gas must carry the load.\n\nBatteries with just 2 hours of storage can help at the peaks but cannot sustain through the day. How do you maximise your thermal fleet\'s value?',
        },
      ],
    },
  },
  {
    roundNumber: 3,
    name: 'Spring - Renewable Flood',
    description: 'Mild weather, strong renewables, negative prices likely. Can you profit from a flooded market?',
    learningObjectives: [
      'Navigate negative pricing',
      'Use batteries to capture oversupply',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Massive oversupply — negative prices during the day, profit in the Evening',
      demandContext: 'From winter\'s high heating demand to spring\'s minimum — the biggest demand drop in the game. All periods see dramatically lower consumption.',
      supplyContext: 'Strong solar and moderate wind flood the market with cheap energy. After winter\'s renewable drought, supply now massively exceeds demand. The Afternoon solar peak will likely cause negative prices.',
      biddingAdvice: 'Total strategy reversal from winter. Afternoon prices may go NEGATIVE — charge batteries then (you get paid to charge!). Coal will lose money during the day. The Evening remains profitable when solar drops off. The winning strategy is managing the shift: minimise losses during oversupply, maximise gains during the evening scarcity.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['negative_prices'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Spring Oversupply',
      slides: [
        {
          heading: 'Navigating Negative Prices',
          body: 'Mild weather + strong sun + moderate wind = too much supply. Prices will likely go negative during the day.\n\nKey decisions: Do you keep coal running at a loss? Do you charge your battery at negative prices (getting paid to charge)? When do you discharge?',
        },
      ],
    },
  },
  {
    roundNumber: 4,
    name: 'Summer - Heatwave & Outage',
    description: 'The ultimate test: extreme heat, record demand, and a plant outage. Final round decides the winner.',
    learningObjectives: [
      'Manage extreme market conditions',
      'Optimise under uncertainty and scarcity',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer Crisis: Record demand + extreme heat + plant outage',
      demandContext: 'From spring\'s minimum to summer\'s maximum — demand surges 40%+ from air conditioning. The Afternoon and Evening peaks are extreme. Even overnight demand is elevated.',
      supplyContext: 'Solar is strong during the day but a plant outage has removed critical capacity. Coal may be derated from heat. When solar drops off in the Evening, the system faces its biggest challenge.',
      biddingAdvice: 'After spring\'s oversupply, this is the opposite extreme. Every MW of generation is valuable. Bid aggressively on all assets. Charge batteries during Morning solar, discharge during Evening crunch. Gas peakers will likely set clearing prices near the market cap. The team with the highest cumulative profit across all 4 rounds wins!',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.12,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_extreme', 'plant_outage_random'],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'The Final Challenge',
      slides: [
        {
          heading: 'Summer Crisis',
          body: '42°C+, demand surging 40%, a major coal plant has tripped. Solar helps during the day but the evening ramp will be brutal.\n\nEvery MW and every bidding decision counts. The team with the highest cumulative profit wins!',
        },
      ],
    },
  },
];
