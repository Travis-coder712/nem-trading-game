import type { RoundConfig } from '../../../shared/types.ts';

export const progressiveLearningRounds: RoundConfig[] = [
  // ── Round 1: Coal Only — 1 Period, Guided Walkthrough ──
  {
    roundNumber: 1,
    name: 'Your First Bid',
    description: 'A guided walkthrough with just one asset and one period. Learn what a bid is, how the merit order works, and how the clearing price is set.',
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
      'After dispatch, point out which team set the clearing price and why',
      'Ask: "Did anyone notice they bid $0 but earned much more?"',
    ],
    uiComplexity: 'minimal',
    educationalContent: {
      title: 'Welcome to the NEM',
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
      'Key question: "Which period had the higher clearing price and why?"',
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
    description: 'Now bidding across all four periods of the day. Overnight is quiet, mornings ramp, afternoons peak, evenings surge. Use 5 bid bands to develop your strategy.',
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
      'Introduce concept: "capacity repricing" — repricing capacity to higher bands to tighten effective supply',
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

  // ── Round 4: Add Gas CCGT + Peaker ──
  {
    roundNumber: 4,
    name: 'Gas Power Enters',
    description: 'Gas CCGT and peakers join your portfolio. They cost more but are flexible. Gas CCGT is mid-merit; peakers are expensive but capture high-price periods.',
    learningObjectives: [
      'Understand different cost structures across asset types',
      'Learn when peakers are profitable vs loss-making',
      'See gas as the price-setting technology during peak periods',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['gas_ccgt', 'gas_peaker'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 270,
    maxBidBandsPerAsset: 5,
    hostTeachingNotes: [
      'Two new assets! Explain cost differences: coal ~$35, gas CCGT ~$75, peaker ~$145',
      'Key concept: gas only profits when clearing price > its marginal cost',
      'After results: did peakers get dispatched? In which periods?',
      'Ask: "Is it better to bid your peaker at marginal cost or higher?"',
    ],
    uiComplexity: 'standard',
    educationalContent: {
      title: 'Gas Generation',
      slides: [
        {
          heading: 'Two Types of Gas',
          body: '**CCGT (Combined Cycle)**: ~350 MW, moderate cost — efficient mid-merit plant\n**Peaker (Open Cycle)**: ~150 MW, high cost — fast start, peak-only\n\nCheck the **Marginal Cost badges** on each asset — gas costs much more than coal to run!',
        },
        {
          heading: 'When Does Gas Make Money?',
          body: '🌙 **Overnight**: Gas typically OFF — prices below gas cost\n🌅 **Morning**: Gas CCGT may be marginal\n☀️ **Afternoon**: Gas CCGT likely dispatched. Peakers only if tight\n🌆 **Evening**: Both gas types may be needed. Peakers can set very high prices',
        },
      ],
    },
  },

  // ── Round 5: Add Renewables + Hydro (Spring) ──
  {
    roundNumber: 5,
    name: 'Renewables + Hydro',
    description: 'Wind, solar, and hydro join. Zero-cost renewables reshape the merit order. Spring means low demand + strong renewables — watch for oversupply!',
    learningObjectives: [
      'See how zero-cost renewables push down clearing prices',
      'Understand capacity factors: solar only works in daytime, wind varies',
      'Manage hydro with limited water (opportunity cost)',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Low demand + strong renewables = watch for oversupply!',
      demandContext: 'Spring has the lowest demand — no heating or cooling needed.',
      supplyContext: 'Solar is strong. Wind is moderate. With zero-cost renewables, total supply may exceed demand during the afternoon.',
      biddingAdvice: 'Expect lower prices. Renewables at $0 push down clearing prices. Save hydro water for the evening when solar disappears!',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['wind', 'solar', 'hydro'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 7,
    hostTeachingNotes: [
      'Three new assets! Explain zero marginal cost concept',
      'Discuss capacity factors: solar = 0 at night, wind varies by season/period',
      'Hydro has limited water — save it for high-price periods (opportunity cost)',
      'After results: "Did renewables push prices down? In which periods?"',
      'New season (spring) — explain lower demand context',
    ],
    uiComplexity: 'standard',
    educationalContent: {
      title: 'The Renewable Revolution',
      slides: [
        {
          heading: 'Zero Marginal Cost',
          body: '**Wind**: ~300 MW, $0 cost — output varies by time & season\n**Solar**: ~200 MW, $0 cost — daytime only, zero overnight\n**Hydro**: ~250 MW / 1,000 MWh — limited water, ~$8/MWh cost\n\nRenewables bid at $0 and displace expensive thermal generation.',
        },
        {
          heading: 'How Renewables Change Each Period',
          body: '🌙 **Overnight**: Wind may be strong, NO solar. Potential oversupply!\n🌅 **Morning**: Solar ramps up, prices dropping\n☀️ **Afternoon**: Solar at peak. Spring can flood the market!\n🌆 **Evening**: Solar drops to zero. Prices snap back up.\n\nHydro is your strategic weapon — save water for the highest-price period!',
        },
      ],
    },
  },

  // ── Round 6: Add Battery (Spring) ──
  {
    roundNumber: 6,
    name: 'Battery Storage',
    description: 'Batteries complete your portfolio. Charge cheap, discharge at premium. The ultimate arbitrage machine — buy low, sell high across the day.',
    learningObjectives: [
      'Understand energy arbitrage with batteries',
      'Learn to charge during cheap/negative periods and discharge at peaks',
      'Full portfolio optimisation across 7 asset types',
    ],
    season: 'spring',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['battery'],
    activeScenarioEvents: [],
    batteryMiniGame: true,
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'Battery is the last new asset — portfolio is now complete',
      'Explain arbitrage: charge low, sell high. 92% efficiency = need ~9% spread to profit',
      'In spring: charge during afternoon solar surplus, discharge during evening',
      'After results: "Who made the most from their battery? What was the price spread?"',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Grid-Scale Batteries',
      slides: [
        {
          heading: 'The Arbitrage Machine',
          body: '**Battery**: 500 MW / 2,000 MWh / 4-hour duration / 92% round-trip efficiency\n\nCharge during low prices, discharge at peaks. The spread must exceed the 8% efficiency loss.\n\nYou now have your full portfolio: Coal, Gas CCGT, Peaker, Wind, Solar, Hydro, Battery.',
        },
        {
          heading: 'Battery Strategy by Period',
          body: '🌙 **Overnight**: CHARGE — prices lowest\n🌅 **Morning**: May continue charging if solar pushes prices down\n☀️ **Afternoon**: CHARGE during solar surplus\n🌆 **Evening**: DISCHARGE — prime time! Solar gone, demand high.\n\nWith 92% efficiency, charging at $20/MWh requires discharge above ~$22/MWh to break even.',
        },
      ],
    },
  },

  // ── Round 7: Strategies Deep Dive (Autumn) ──
  {
    roundNumber: 7,
    name: 'Advanced Strategies',
    description: 'Full portfolio in autumn. Focus on strategic bidding: price making, portfolio optimisation, and competitive dynamics.',
    learningObjectives: [
      'Apply advanced bidding strategies with full portfolio',
      'Understand portfolio optimisation across asset types',
      'Recognise competitive dynamics — how other teams\' bids affect yours',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'No new assets — focus on strategy refinement',
      'Discuss: price taker vs price maker. When does each strategy work?',
      'Ask teams to think about what OTHER teams are likely bidding',
      'After results: identify which strategy won and why',
      'Game theory angle: "If everyone bids high, prices spike but nobody gets dispatched"',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Strategy Masterclass',
      slides: [
        {
          heading: 'Beyond Basics',
          body: 'You\'ve learned the assets. Now master the strategies:\n\n1. **Portfolio Optimisation**: Bid each asset at its optimal price point\n2. **Price Making**: Use capacity repricing to influence clearing prices\n3. **Competitive Awareness**: What are other teams likely bidding?\n\nThe best teams combine all three.',
        },
        {
          heading: 'Think Like a Trader',
          body: 'Key questions for each period:\n- What\'s the likely clearing price range?\n- Which of my assets are marginal (on the edge of being dispatched)?\n- Can I push the clearing price up by repricing some capacity to higher bands?\n- What happens if everyone tries the same strategy?\n\nRemember: profit = (price − cost) × volume. Maximise the product, not just one factor.',
        },
      ],
    },
  },

  // ── Round 8: Summer Heatwave ──
  {
    roundNumber: 8,
    name: 'Summer Heatwave',
    description: 'Extreme heat, record demand, coal derating. Every MW counts. Scarcity pricing in action!',
    learningObjectives: [
      'Manage extreme demand scenarios',
      'See scarcity pricing when supply is tight',
      'Understand thermal derating in hot weather',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer: Extreme demand from air conditioning, evening solar cliff is dangerous',
      demandContext: 'Summer has the HIGHEST demand — AC drives consumption 40% above normal during afternoon peak.',
      supplyContext: 'Solar helps during the day but coal is derated 10%. When solar drops off in the evening, the system is under extreme stress.',
      biddingAdvice: 'Bid aggressively! Charge batteries during morning solar ramp. Discharge everything in the evening crunch. Every MW matters.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_extreme'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'First scenario event! Explain heatwave impact: +40% demand, coal derated 10%',
      'This mirrors real NEM stress events (e.g., SA blackout, NSW heatwave)',
      'After results: "Which period had the highest clearing price? Why?"',
      'Discuss scarcity pricing and the price cap ($20,000/MWh in the real NEM)',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Summer Extremes',
      slides: [
        {
          heading: 'Heatwave Alert!',
          body: '42°C+ temperatures. Demand surges +40% during afternoon peak. Coal derated 10%.\n\nThis mirrors real events that have tested the NEM to its limits.',
        },
        {
          heading: 'Summer Period Guide',
          body: '🌙 **Overnight**: Hot night — elevated demand\n🌅 **Morning**: Industry + early cooling. Solar starting.\n☀️ **Afternoon**: EXTREME demand. Solar helps but coal derated.\n🌆 **Evening**: Solar cliff + sustained heat = maximum stress. Price cap territory!',
        },
      ],
    },
  },

  // ── Round 9: Spring Negative Prices ──
  {
    roundNumber: 9,
    name: 'Negative Prices',
    description: 'Spring oversupply. Renewables flood the market. Prices can go negative. Batteries shine — charge and get paid!',
    learningObjectives: [
      'Navigate negative pricing when renewables flood the market',
      'Understand curtailment economics',
      'Use batteries to profit from oversupply',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Lowest demand + highest renewable output = negative prices!',
      demandContext: 'After the intense summer round, demand has dropped dramatically. No heating, no cooling.',
      supplyContext: 'Solar and wind flood the market. Total supply far exceeds demand, especially during afternoon.',
      biddingAdvice: 'Completely different strategy from summer! Afternoon prices may go NEGATIVE. Charge batteries during solar peak. Focus expensive assets on evening.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['negative_prices'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    hostTeachingNotes: [
      'Dramatic contrast to previous round — from scarcity to oversupply',
      'Explain negative prices: generators PAY to produce. Why? (shutdown costs, PPAs)',
      'Batteries can charge and GET PAID during negative prices',
      'After results: "Who adapted best from the summer heatwave strategy?"',
      'Real-world link: negative prices are now routine in spring midday in SA/VIC',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'Negative Pricing',
      slides: [
        {
          heading: 'When Supply Exceeds Demand',
          body: 'Prices can go negative! Generators pay to produce. Why?\n- Coal: too expensive to shut down\n- Renewables with PPAs: earn revenue regardless\n- Batteries: get paid to CHARGE!\n\nNegative prices are now routine in spring midday in the real NEM.',
        },
        {
          heading: 'Strategy by Period',
          body: '🌙 **Overnight**: Low demand, mild oversupply possible\n🌅 **Morning**: Solar flooding in, prices dropping\n☀️ **Afternoon**: NEGATIVE PRICES LIKELY! Charge batteries!\n🌆 **Evening**: Solar gone — prices snap back up. Discharge everything!\n\nThe teams that profit here manage the oversupply-to-scarcity transition.',
        },
      ],
    },
  },

  // ── Round 10: The Full NEM — Heatwave + Outage ──
  {
    roundNumber: 10,
    name: 'The Full NEM',
    description: 'Final round: summer crisis with heatwave and plant outage. Everything you\'ve learned comes together. Highest cumulative profit wins!',
    learningObjectives: [
      'Apply all strategies under maximum pressure',
      'Portfolio bidding across diverse asset types in crisis conditions',
      'Win the game!',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer Crisis: Heatwave + plant outage = the NEM\'s toughest day',
      demandContext: 'Back to summer — high demand across all periods. A plant outage makes a tight system even more stressed.',
      supplyContext: 'Solar helps during the day but disappears before evening peak. The outage removes capacity when you need it most.',
      biddingAdvice: 'After spring\'s oversupply, you\'re back to scarcity. Bid aggressively! Charge batteries in morning, discharge in evening. The team that best manages the solar-to-evening transition wins.',
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
      'Encourage teams to apply everything they\'ve learned',
      'After results: debrief on the full game journey',
      'Discussion: "What was the most important thing you learned?"',
      'Compare strategies across the 10 rounds — who adapted best?',
    ],
    uiComplexity: 'full',
    educationalContent: {
      title: 'The Ultimate Challenge',
      slides: [
        {
          heading: 'Final Round',
          body: 'A hot summer day with a major plant outage. Everything you\'ve learned comes together.\n\n🌙 **Overnight**: Hot night, elevated demand\n🌅 **Morning**: Industry + solar ramping. Outage makes supply tighter.\n☀️ **Afternoon**: Peak summer demand. Scarcity pricing likely!\n🌆 **Evening**: Solar cliff + heat + outage = maximum stress.\n\nHighest cumulative profit across all 10 rounds wins!',
        },
      ],
    },
  },
];
