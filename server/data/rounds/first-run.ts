import type { RoundConfig } from '../../../shared/types.ts';

/**
 * First Run mode — 8 rounds with a lean portfolio.
 *
 * Each team gets only: 1 coal, 1 gas (CCGT or Peaker), 1 renewable (Wind or Solar), 1 battery.
 * Follows the same progressive unlock pattern but with far fewer assets per team.
 * Designed for a quick 45-60 minute session that still covers the full energy mix journey.
 */
export const firstRunRounds: RoundConfig[] = [
  // ── Round 1: Coal Only — 1 Period, Guided Walkthrough ──
  {
    roundNumber: 1,
    name: 'Your First Bid',
    description: 'A guided walkthrough with just your coal plant and one period. Learn what a bid is, how the merit order works, and how the clearing price is set.',
    learningObjectives: [
      'Understand what a bid is: a price and quantity you offer to generate',
      'See how AEMO stacks bids cheapest to most expensive (the merit order)',
      'Learn that the clearing price is set by the last unit dispatched',
      'ALL dispatched generators receive the same clearing price',
    ],
    season: 'autumn',
    timePeriods: ['day_peak'],
    periodDurations: { day_peak: 6 },
    baseDemandMW: { day_peak: 0 },
    demandVariability: 0.05,
    newAssetsUnlocked: ['coal'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 2,
    hostTeachingNotes: [
      'This is a guided walkthrough — teams see pre-filled bids',
      'Explain: a bid = price + quantity. The merit order stacks bids cheapest first.',
      'Key insight: ALL dispatched generators earn the clearing price, not their bid price',
      'In First Run mode, each team has a smaller coal plant (~400 MW)',
    ],
    uiComplexity: 'minimal',
    educationalContent: {
      title: 'Welcome to GridRival',
      slides: [
        {
          heading: 'How the NEM Works',
          body: 'In the **National Electricity Market**, generators (that\'s you!) bid their power into the market.\n\nA **bid** has two parts:\n- **Price** ($/MWh): How much you want to be paid\n- **Quantity** (MW): How many megawatts you\'re offering\n\nYou own a coal power plant. Each team\'s plant has a slightly different **Short Run Marginal Cost (SRMC)** — the cost of producing each MWh.',
        },
        {
          heading: 'The Merit Order & Clearing Price',
          body: 'AEMO (the market operator) collects ALL bids and sorts them **cheapest to most expensive** — this is the **merit order**.\n\nStarting from the cheapest, AEMO dispatches generators until supply meets demand.\n\nThe **clearing price** is set by the LAST generator needed. **ALL dispatched generators receive this same price**, even if they bid lower!',
        },
      ],
    },
    walkthrough: {
      introText: 'This is a guided round! We\'ve suggested bids for your coal plant. Check your Marginal Cost badge to see your cost to generate.',
      suggestedBids: [
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 0,
          suggestedQuantityPercent: 70,
          explanation: 'Bid 70% at $0/MWh to guarantee dispatch. You still earn the clearing price — NOT $0!',
        },
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 80,
          suggestedQuantityPercent: 30,
          explanation: 'Bid the remaining 30% at $80/MWh. If demand is high enough, this sets the clearing price for everyone.',
        },
      ],
      afterSubmitExplanation: 'Watch the merit order chart. Your bids stack alongside other teams. The clearing price is where supply meets demand.',
    },
  },

  // ── Round 2: Coal Only — 2 Periods ──
  {
    roundNumber: 2,
    name: 'Morning & Afternoon',
    description: 'Same coal plant, but now bid across two periods. Demand differs — morning is quieter, afternoon is busier. Adapt your bids!',
    learningObjectives: [
      'Understand that demand varies through the day',
      'Learn to bid differently for different periods',
      'See how higher demand leads to higher clearing prices',
    ],
    season: 'autumn',
    timePeriods: ['day_offpeak', 'day_peak'],
    periodDurations: { day_offpeak: 6, day_peak: 6 },
    baseDemandMW: { day_offpeak: 0, day_peak: 0 },
    demandVariability: 0.05,
    newAssetsUnlocked: [],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 3,
    hostTeachingNotes: [
      'No walkthrough this round — teams bid independently for the first time',
      'Highlight the demand difference between morning and afternoon',
      'After results: compare who adapted their strategy across periods vs who bid the same',
    ],
    uiComplexity: 'minimal',
    educationalContent: {
      title: 'Time Matters',
      slides: [
        {
          heading: 'Two Periods',
          body: '🌅 **Morning (6am–12pm)**: Moderate demand as businesses open.\n\n☀️ **Afternoon (12pm–6pm)**: Higher demand from commercial activity.\n\nWith only coal in the fleet, afternoon supply is tighter. Should you bid differently in each period?',
        },
        {
          heading: 'Bidding Tips',
          body: 'You now have **3 bid bands** per asset per period.\n\nConsider:\n- **Band 1**: Low price to guarantee dispatch\n- **Band 2**: Medium price as a hedge\n- **Band 3**: High price for the peak period\n\n**Your profit = (Clearing Price − Your Marginal Cost) × Dispatched MW × Hours**',
        },
      ],
    },
  },

  // ── Round 3: Coal Only — 4 Periods ──
  {
    roundNumber: 3,
    name: 'Full Day Trading',
    description: 'Now bidding across all four periods of the day. Overnight is quiet, mornings ramp, afternoons peak, evenings surge.',
    learningObjectives: [
      'Manage a full 24-hour bidding cycle',
      'Understand all four demand periods',
      'Experiment with strategic bidding using multiple bands',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 5,
    hostTeachingNotes: [
      'First full-day round — teams must think about all 4 periods',
      'Discuss strategies: price taker ($0 everywhere) vs strategic bidder (vary by period)',
      'After results: compare team strategies. Who adapted well to each period?',
    ],
    uiComplexity: 'standard',
    educationalContent: {
      title: 'Strategic Bidding',
      slides: [
        {
          heading: 'The Four Periods',
          body: '🌙 **Overnight (12am–6am)**: Lowest demand. Prices typically low.\n🌅 **Morning (6am–12pm)**: Demand rises. Moderate prices.\n☀️ **Afternoon (12pm–6pm)**: Peak demand. Highest prices.\n🌆 **Evening (6pm–12am)**: Second-highest demand.\n\nWith only coal, think about which periods are tightest for supply.',
        },
        {
          heading: 'Strategy Options',
          body: '1. **Price Taker**: Bid $0 everywhere — guaranteed dispatch\n2. **SRMC Bidder**: Bid at your marginal cost\n3. **Price Maker**: Bid high on some capacity to push up prices\n4. **Capacity Repricing**: Reprice capacity to higher bands to tighten effective supply\n\nWith 5 bands you can mix strategies across your capacity!',
        },
      ],
    },
  },

  // ── Round 4: Add Gas (CCGT or Peaker — varies per team) ──
  {
    roundNumber: 4,
    name: 'Gas Power Enters',
    description: 'A gas plant joins your portfolio. Some teams have a CCGT (efficient, mid-cost), others have a Peaker (expensive, flexible). Compare strategies!',
    learningObjectives: [
      'Understand different cost structures across asset types',
      'Learn when gas is profitable vs loss-making',
      'See how portfolio diversity creates different strategies across teams',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.10,
    newAssetsUnlocked: ['gas_ccgt', 'gas_peaker'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 270,
    maxBidBandsPerAsset: 5,
    hostTeachingNotes: [
      'Each team gets EITHER a CCGT or a Peaker — not both!',
      'CCGT teams: mid-merit, moderate cost (~$75/MWh), larger (200 MW)',
      'Peaker teams: expensive (~$145/MWh), smaller (100 MW), but fast and flexible',
      'After results: compare CCGT team strategies vs Peaker team strategies',
      'Key question: "Which type of gas plant made more profit? Why?"',
    ],
    uiComplexity: 'standard',
    educationalContent: {
      title: 'Gas Generation',
      slides: [
        {
          heading: 'Your Gas Plant',
          body: 'Each team receives **one** gas plant — either a **CCGT** or a **Peaker**.\n\n**CCGT (Combined Cycle)**: ~200 MW, moderate cost — efficient mid-merit plant\n**Peaker (Open Cycle)**: ~100 MW, high cost — fast start, peak-only\n\nCheck your **Marginal Cost badge** to see your gas plant\'s cost to run!',
        },
        {
          heading: 'When Does Gas Make Money?',
          body: 'Gas only profits when the clearing price exceeds its marginal cost.\n\n🌙 **Overnight**: Gas typically OFF — prices below gas cost\n🌅 **Morning**: CCGT may be marginal, peakers still uneconomic\n☀️ **Afternoon**: CCGT likely dispatched. Peakers only if very tight\n🌆 **Evening**: Both types may be needed. Peakers can set high prices!',
        },
      ],
    },
  },

  // ── Round 5: Add Renewable (Wind or Solar — varies per team) ──
  {
    roundNumber: 5,
    name: 'Renewables Arrive',
    description: 'A renewable plant joins your portfolio. Some teams have wind (variable, 24/7), others have solar (daytime only). Zero-cost generation reshapes the market!',
    learningObjectives: [
      'See how zero-cost renewables push down clearing prices',
      'Understand capacity factors: solar only works in daytime, wind varies by period',
      'Compare wind vs solar strategies across teams',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Low demand + strong renewables = watch for oversupply!',
      demandContext: 'Spring has the lowest demand — no heating or cooling needed.',
      supplyContext: 'Renewables perform well in spring. With zero-cost generation, total supply may exceed demand during some periods.',
      biddingAdvice: 'Expect lower prices overall. Renewables at $0 push down clearing prices. Adapt your thermal bidding strategy!',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.10,
    newAssetsUnlocked: ['wind', 'solar'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 7,
    hostTeachingNotes: [
      'Each team gets EITHER wind OR solar — not both!',
      'Wind teams: 200 MW, varies by period (check your availability), produces 24/7',
      'Solar teams: 150 MW, daytime only — zero overnight, strong afternoon',
      'Key insight: renewables bid at $0 (no fuel cost) and displace expensive thermal',
      'After results: "Did solar teams dominate afternoon? Did wind teams have an edge overnight?"',
      'Note: this is spring — lower demand means renewables have bigger market impact',
    ],
    uiComplexity: 'standard',
    educationalContent: {
      title: 'The Renewable Revolution',
      slides: [
        {
          heading: 'Your Renewable Plant',
          body: 'Each team receives **one** renewable — either **Wind** or **Solar**.\n\n**Wind**: ~200 MW, $0 cost — output varies by time of day and season. Check your wind availability each period!\n**Solar**: ~150 MW, $0 cost — daytime only. Zero output overnight. Strongest in the afternoon.\n\nRenewables bid at $0 and displace expensive thermal generation.',
        },
        {
          heading: 'How Renewables Change Each Period',
          body: '🌙 **Overnight**: Wind may produce, Solar = 0 MW\n🌅 **Morning**: Solar ramps up, Wind variable\n☀️ **Afternoon**: Solar at peak. Prices may drop!\n🌆 **Evening**: Solar drops off. Wind variable. Prices snap back up.\n\nTeams with different renewables will have very different strategies!',
        },
      ],
    },
  },

  // ── Round 6: Add Battery ──
  {
    roundNumber: 6,
    name: 'Battery Storage',
    description: 'A battery completes your lean portfolio. Charge cheap, discharge at premium. The ultimate arbitrage machine — buy low, sell high across the day.',
    learningObjectives: [
      'Understand energy arbitrage with batteries',
      'Learn to charge during cheap periods and discharge at peaks',
      'Full portfolio optimisation across your 4 asset types',
    ],
    season: 'spring',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.10,
    newAssetsUnlocked: ['battery'],
    activeScenarioEvents: [],
    batteryMiniGame: true,
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'Battery is the last new asset — each team now has their full 4-asset portfolio',
      'Explain arbitrage: charge low, sell high. 92% efficiency = need ~9% spread to profit',
      'In spring: charge during low-price periods, discharge during evening',
      'After results: "Who made the most from their battery? What was the price spread?"',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Grid-Scale Batteries',
      slides: [
        {
          heading: 'The Arbitrage Machine',
          body: '**Battery**: 200 MW / 800 MWh / 4-hour duration / 92% round-trip efficiency\n\nCharge during low prices, discharge at peaks. The spread must exceed the 8% efficiency loss.\n\nYou now have your full First Run portfolio: Coal + Gas + Renewable + Battery.',
        },
        {
          heading: 'Battery Strategy by Period',
          body: '🌙 **Overnight**: CHARGE — prices lowest\n🌅 **Morning**: May continue charging if prices are still low\n☀️ **Afternoon**: CHARGE during renewable surplus if prices drop\n🌆 **Evening**: DISCHARGE — prime time! Renewables fade, demand high.\n\nWith 92% efficiency, charging at $20/MWh requires discharge above ~$22/MWh to break even.',
        },
      ],
    },
  },

  // ── Round 7: Summer Heatwave ──
  {
    roundNumber: 7,
    name: 'Summer Heatwave',
    description: 'Extreme heat, record demand, coal derating. With your lean portfolio, every MW counts. Scarcity pricing in action!',
    learningObjectives: [
      'Manage extreme demand scenarios with a lean portfolio',
      'See scarcity pricing when supply is tight',
      'Understand thermal derating in hot weather',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer: Extreme demand from air conditioning — every MW counts!',
      demandContext: 'Summer has the HIGHEST demand — AC drives consumption well above normal during afternoon peak.',
      supplyContext: 'Solar helps during the day but coal is derated. With your lean portfolio, supply is very tight.',
      biddingAdvice: 'Bid aggressively! Charge batteries during morning. Discharge everything in the evening crunch.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.10,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_extreme'],
    portfolioExplainer: true,
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'First scenario event! Explain heatwave impact: +40% demand, coal derated 10%',
      'With lean portfolios, supply will be very tight — expect high prices',
      'Solar teams have an advantage during the day, wind teams overnight',
      'After results: "Which period had the highest clearing price? Why?"',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Summer Extremes',
      slides: [
        {
          heading: 'Heatwave Alert!',
          body: '42°C+ temperatures. Demand surges during afternoon peak. Coal derated 10%.\n\nWith only one thermal plant and one gas unit, your portfolio is under maximum stress.',
        },
        {
          heading: 'Summer Period Guide',
          body: '🌙 **Overnight**: Hot night — elevated demand\n🌅 **Morning**: Industry + early cooling. Solar teams: your time to shine!\n☀️ **Afternoon**: EXTREME demand. Solar helps but coal derated.\n🌆 **Evening**: Solar cliff + sustained heat = maximum stress. Price cap territory!',
        },
      ],
    },
  },

  // ── Round 8: The Full NEM — Heatwave + Outage ──
  {
    roundNumber: 8,
    name: 'The Full NEM',
    description: 'Final round: summer crisis with heatwave and plant outage. Everything you\'ve learned comes together. Highest cumulative profit wins!',
    learningObjectives: [
      'Apply all strategies under maximum pressure',
      'Portfolio bidding across your assets in crisis conditions',
      'Win the game!',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer Crisis: Heatwave + plant outage = the NEM\'s toughest day',
      demandContext: 'High demand across all periods. A plant outage makes a tight system even more stressed.',
      supplyContext: 'Solar helps during the day but disappears before evening peak. The outage removes capacity when you need it most.',
      biddingAdvice: 'Bid aggressively! Charge batteries in morning, discharge in evening. The team that best manages the transitions wins.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.12,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_moderate', 'plant_outage_random'],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'Final round! Maximum complexity — heatwave + outage',
      'With lean portfolios, the outage is devastating — one team may lose their gas or even coal',
      'Encourage teams to apply everything they\'ve learned',
      'After results: debrief on the full game journey',
      'Discussion: "How did having different portfolios (CCGT vs Peaker, Wind vs Solar) shape your strategy?"',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'The Ultimate Challenge',
      slides: [
        {
          heading: 'Final Round',
          body: 'A hot summer day with a major plant outage. Everything you\'ve learned comes together.\n\nWith your lean portfolio of just 4 assets, every decision matters. One outage could be catastrophic.\n\n🌙 Hot night, elevated demand\n🌅 Industry + solar ramping. Outage makes supply tighter.\n☀️ Peak summer demand. Scarcity pricing likely!\n🌆 Solar cliff + heat + outage = maximum stress.\n\nHighest cumulative profit across all 8 rounds wins!',
        },
      ],
    },
  },
];
