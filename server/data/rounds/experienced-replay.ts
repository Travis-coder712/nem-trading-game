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
