import type { RoundConfig } from '../../../shared/types.ts';

export const fullGameRounds: RoundConfig[] = [
  // Phase 1: Fundamentals (Rounds 1-4)
  {
    roundNumber: 1,
    name: 'Guided Walkthrough: Your First Bid',
    description: 'This is a guided round to teach you the basics. Follow the suggested bids, then watch the market clear to see how it all works!',
    learningObjectives: [
      'Understand what a bid is: a price and quantity you offer to generate',
      'See how AEMO stacks bids into a merit order',
      'Learn that the clearing price is set by the last (most expensive) unit dispatched',
      'Understand that ALL dispatched generators receive the same clearing price',
    ],
    season: 'autumn',
    timePeriods: ['day_peak'],
    periodDurations: { day_peak: 6 },
    baseDemandMW: { day_peak: 0 },
    demandVariability: 0,
    newAssetsUnlocked: ['coal'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 3,
    educationalContent: {
      title: 'How the NEM Merit Order Works',
      slides: [
        {
          heading: 'Welcome to the NEM',
          body: 'The National Electricity Market (NEM) is one of the world\'s longest interconnected power systems, spanning 5,000km down Australia\'s eastern seaboard. Established in 1998, it serves over 10 million customers across Queensland, New South Wales, Victoria, South Australia, and Tasmania.\n\nToday you will step into the role of an energy company, bidding your generation assets into this market. Your goal: maximise profit by understanding how the dispatch mechanism works.',
        },
        {
          heading: 'The Bid Stack',
          body: 'Every 5 minutes, AEMO (the market operator) runs a dispatch engine. Each generator submits bids: a price ($/MWh) and a quantity (MW) they\'re willing to generate at that price.\n\nAEMO stacks all bids from cheapest to most expensive - this is the **merit order** (or bid stack). Generation is dispatched from the bottom up until demand is met.',
        },
        {
          heading: 'The Clearing Price',
          body: 'The critical insight: the **clearing price** is set by the last (most expensive) generator needed to meet demand. ALL dispatched generators receive this price, not their individual bid prices.\n\nThis means if you bid low and get dispatched, you still earn the clearing price. But if you bid too high, you might not be dispatched at all.',
        },
        {
          heading: 'Your First Bid (Guided)',
          body: 'You have one coal power station with a capacity of 800 MW. Each team\'s plant has a slightly different **Short Run Marginal Cost** — check the **Marginal Cost badge** on your asset to see your cost per MWh.\n\nFor this first round, we\'ll **suggest bids for you**. On your phone, you\'ll see pre-filled bids with explanations. You can adjust them or submit as-is.\n\nWe\'ll split your coal plant into 2 bands:\n- **Band 1**: Bid most capacity cheap to guarantee dispatch\n- **Band 2**: Bid the rest higher to try to push up the clearing price\n\n**Your profit = (Clearing Price - Your Marginal Cost) × Dispatched MW × Hours**\n\nAfter all teams submit, watch the merit order chart to see how it plays out!',
        },
      ],
    },
    walkthrough: {
      introText: 'Welcome to your first bid! We\'ve pre-filled suggested bids below. Each bid has an explanation so you can understand the strategy. You can adjust the numbers or submit as-is.',
      suggestedBids: [
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 0,
          suggestedQuantityPercent: 60,
          explanation: 'Bid 60% of your capacity at $0/MWh. This guarantees you\'ll be dispatched (lowest in the merit order). You still earn whatever the clearing price turns out to be - NOT $0! This is called being a "price taker".',
        },
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 100,
          suggestedQuantityPercent: 40,
          explanation: 'Bid the remaining 40% at $100/MWh. If demand is high enough that this capacity is needed, it gets dispatched too. If YOUR bid ends up being the marginal unit (last one needed), the clearing price becomes $100/MWh - which ALL dispatched generators receive!',
        },
      ],
      afterSubmitExplanation: 'Now watch the main screen! The host will show the merit order chart - a staircase of all bids from cheapest to most expensive. The vertical red line is demand. Where demand meets the staircase is the clearing price. Every team to the LEFT of that line gets paid the clearing price. Teams to the RIGHT miss out.',
    },
  },
  {
    roundNumber: 2,
    name: 'Morning vs Afternoon',
    description: 'Now bidding across two time periods with different demand. Morning demand is moderate as businesses open; Afternoon demand peaks with commercial activity and cooling.',
    learningObjectives: [
      'Understand demand varies by time of day',
      'See how clearing prices differ between Morning and Afternoon',
      'Consider bidding differently for different time periods',
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
    educationalContent: {
      title: 'Understanding Demand Patterns',
      slides: [
        {
          heading: 'Demand Varies by Time of Day',
          body: 'Electricity demand follows predictable daily patterns. In Australia:\n\n🌙 **Overnight (12am–6am)**: Lowest demand — baseload only\n🌅 **Morning (6am–12pm)**: Demand rises as businesses open\n☀️ **Afternoon (12pm–6pm)**: Highest demand from commercial activity and cooling\n🌆 **Evening (6pm–12am)**: Residential demand peaks as people return home\n\nHigher demand means more generators are needed, pushing up the clearing price.',
        },
        {
          heading: 'Round 2: Your Task',
          body: 'This round you bid for TWO periods:\n\n🌅 **Morning (6am–12pm)**: Moderate demand. Coal provides baseload. Prices tend to be moderate.\n☀️ **Afternoon (12pm–6pm)**: Higher demand. With only coal in the fleet, supply gets tighter. Prices higher.\n\nShould you bid the same in both periods? Or bid more aggressively in the Afternoon when demand is higher? Check your **Marginal Cost badge** to see your cost to generate.',
        },
      ],
    },
  },
  {
    roundNumber: 3,
    name: 'Full Day Trading',
    description: 'Bid across all 4 periods of the day. Each period has different demand — overnight is quiet, mornings ramp up, afternoons peak, and evenings see residential demand surge.',
    learningObjectives: [
      'Manage bidding across a complete 24-hour cycle',
      'See the full demand curve shape',
      'Understand baseload vs peaking generation concepts',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.05,
    newAssetsUnlocked: [],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 5,
    educationalContent: {
      title: 'The 24-Hour Cycle',
      slides: [
        {
          heading: 'Four Periods of the Day',
          body: 'You now bid across the full 24-hour day:\n\n🌙 **Overnight (12am–6am)**: LOW demand. Coal runs at minimum stable load. Prices typically low.\n🌅 **Morning (6am–12pm)**: MODERATE demand. Coal ramps up as businesses open.\n☀️ **Afternoon (12pm–6pm)**: HIGH demand. All coal needed. Highest prices with only coal in fleet.\n🌆 **Evening (6pm–12am)**: HIGH demand. Residential peak as people return home.\n\nCoal plants are **baseload** — they run 24/7 because shutting down costs $50,000+. This is why coal bids low: to guarantee dispatch.',
        },
        {
          heading: 'Expanded Bidding: 5 Bands',
          body: 'You now have 5 bid bands per asset. This lets you offer different prices for different portions of your capacity.\n\nFor example:\n- Band 1: 400 MW at $0/MWh (guarantee base dispatch)\n- Band 2: 200 MW at your marginal cost (check the badge on your asset!)\n- Band 3: 100 MW at $80/MWh (peaking margin)\n- Band 4: 50 MW at $200/MWh (for tight supply)\n- Band 5: 50 MW at $500/MWh (scarcity pricing)\n\nConsider bidding more aggressively during ☀️ Afternoon and 🌆 Evening when demand is highest!',
        },
      ],
    },
  },
  {
    roundNumber: 4,
    name: 'Market Power & Strategy',
    description: 'Introduction to strategic bidding. With varying marginal costs across teams, the merit order creates natural winners and losers. Time to think strategically.',
    learningObjectives: [
      'Understand market power and how large players influence prices',
      'Learn price-taker vs price-maker strategies',
      'Observe the effect of strategic withdrawal on prices',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 210,
    maxBidBandsPerAsset: 5,
    educationalContent: {
      title: 'Bidding Strategies',
      slides: [
        {
          heading: 'Six Bidding Strategies',
          body: '1. **Price Taker**: Bid at $0 - guarantees dispatch, accepts market price\n2. **Marginal Cost Bidder**: Bid at your marginal cost - economically rational\n3. **Price Maker**: Bid high on some capacity to push up the clearing price\n4. **Portfolio Optimizer**: Mix strategies across different assets\n5. **Strategic Withdrawal**: Withhold capacity to tighten supply\n6. **Arbitrageur**: (For batteries later) Charge low, discharge high\n\nEach strategy has trade-offs between guaranteed dispatch volume and price.',
        },
        {
          heading: 'Real-World Context',
          body: 'In the real NEM, large generator-retailers ("gentailers") like AGL, Origin, and EnergyAustralia own diverse portfolios. They optimise across their entire book - sometimes accepting lower prices on generation to benefit their retail customers.\n\nThe ACCC and AER monitor for potential exercise of market power, but strategic bidding within the rules is a fundamental feature of the NEM design.',
        },
      ],
    },
  },

  // Phase 2: Technology Mix (Rounds 5-8)
  {
    roundNumber: 5,
    name: 'Gas Enters the Market',
    description: 'Each team receives a gas CCGT and a gas peaker (OCGT). Gas has higher fuel costs but offers flexibility - peakers can start quickly to capture high-price periods.',
    learningObjectives: [
      'Understand different generation cost structures',
      'Learn when to bid expensive peaking capacity',
      'See gas as a price-setter during peak periods',
    ],
    season: 'autumn',
    seasonalGuidance: {
      headline: 'Autumn: Moderate demand, comfortable supply margins',
      demandContext: 'Autumn is the NEM\'s mildest season. Demand is moderate across all periods — no heating or cooling extremes. The evening peak is present but manageable.',
      supplyContext: 'With gas now in your fleet, you have significantly more capacity. Wind is moderate (25-35% capacity factor). Solar is decent but the days are getting shorter. Supply should comfortably exceed demand.',
      biddingAdvice: 'With plenty of supply, don\'t over-bid. Coal should bid low to guarantee dispatch. Your new gas assets have higher marginal costs — bid them in peak periods where clearing prices are likely to cover their costs. Peakers may only be profitable in the Evening.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: ['gas_ccgt', 'gas_peaker'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 5,
    educationalContent: {
      title: 'Gas Generation in the NEM',
      slides: [
        {
          heading: 'Two Types of Gas',
          body: '**CCGT (Combined Cycle Gas Turbine)**: 350 MW — efficient mid-merit plant\n**Peaker (Open Cycle)**: 150 MW — fast start, expensive, peak-only\n\nCheck the **Marginal Cost badges** on each asset — gas costs much more than coal to run! Gas only profits when the clearing price exceeds its marginal cost.',
        },
        {
          heading: 'When Does Gas Make Money?',
          body: 'Gas dispatch depends on the period:\n\n🌙 **Overnight**: Gas typically OFF — demand too low, clearing price below gas marginal cost\n🌅 **Morning**: Gas CCGT may be marginal as demand rises\n☀️ **Afternoon**: Gas CCGT likely dispatched. Peakers only if supply is very tight\n🌆 **Evening**: Both gas types may be needed. Peakers can set high clearing prices\n\nKey decision: bid gas at marginal cost (safe but low margin), or higher to try to capture scarcity pricing?',
        },
      ],
    },
  },
  {
    roundNumber: 6,
    name: 'Renewables Revolution',
    description: 'Wind and solar farms join your portfolio! Zero fuel cost but variable output - you can only bid what the wind and sun provide.',
    learningObjectives: [
      'Understand variable renewable energy (VRE) bidding',
      'Learn about capacity factors and time-of-day variation',
      'Observe the merit order effect: renewables push down prices',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Mild demand meets abundant renewables — oversupply risk!',
      demandContext: 'Spring has the LOWEST demand of any season. No heating or cooling load. Overnight and morning demand are very low. Even the afternoon and evening peaks are modest.',
      supplyContext: 'Solar output is strong (long days, good sun angles). Wind is moderate. With renewables flooding cheap energy into a low-demand market, there\'s a real risk of oversupply — especially during the Afternoon when solar peaks.',
      biddingAdvice: 'Expect lower clearing prices across all periods. During the Afternoon solar peak, prices may drop very low or even go negative! Bid coal conservatively — it may lose money if prices collapse. Renewables should bid at $0 to guarantee dispatch. Save gas for the Evening when solar disappears and prices should recover.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['wind', 'solar'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 270,
    maxBidBandsPerAsset: 7,
    educationalContent: {
      title: 'The Renewable Energy Transformation',
      slides: [
        {
          heading: 'Zero Marginal Cost Generation',
          body: '**Wind Farm**: 300 MW, $0 marginal cost — output varies by time and season\n**Solar Farm**: 200 MW, $0 marginal cost — daytime only, zero output overnight\n\nRenewables bid at $0 and displace expensive thermal generation. But they\'re variable — check the available MW for each period!',
        },
        {
          heading: 'How Renewables Change Each Period',
          body: '🌙 **Overnight**: Wind may be strong, NO solar. Coal + wind may create oversupply — prices could drop!\n🌅 **Morning**: Solar ramps up, wind variable. Increasing supply pushes down prices.\n☀️ **Afternoon**: Solar at peak. In spring this can flood the market — prices may go very low or even NEGATIVE!\n🌆 **Evening**: Solar drops to zero (the "solar cliff"). Wind may help, but this is when supply gets tight. Gas fills the gap. Highest prices likely.\n\nThis is the real "duck curve" — low prices during solar hours, high prices during the evening ramp.',
        },
        {
          heading: 'Capacity Factors This Round',
          body: 'It\'s spring — moderate wind and good solar conditions.\n\nYour wind and solar farms can only bid up to their available output (nameplate × capacity factor). Check each period to see how much capacity is available — the period description panel will show you.\n\nRemember: you cannot bid more MW than your asset can physically generate!',
        },
      ],
    },
  },
  {
    roundNumber: 7,
    name: 'Hydro & Opportunity Cost',
    description: 'Hydro plants with limited water storage. You have 250 MW of capacity but only 1,000 MWh of water for the day. When do you generate?',
    learningObjectives: [
      'Understand opportunity cost concepts',
      'Learn to bid hydro at expected clearing price, not marginal cost',
      'Manage a constrained resource across time periods',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['hydro'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 270,
    maxBidBandsPerAsset: 7,
    educationalContent: {
      title: 'Hydro Power & Water Value',
      slides: [
        {
          heading: 'The Hydro Dilemma',
          body: '**Hydro Plant**: 250 MW, 1,000 MWh of stored water, $8/MWh marginal cost\n\nHydro is cheap to run BUT water used now CANNOT be used later. This creates an **opportunity cost**.\n\nYou only have 1,000 MWh — you CAN\'T generate at full capacity in every period. You must decide WHEN to generate. The smart play: save water for the highest-price period!',
        },
        {
          heading: 'Hydro Strategy by Period',
          body: '🌙 **Overnight**: Skip hydro — prices low, save water\n🌅 **Morning**: Maybe light output if prices are decent\n☀️ **Afternoon**: If solar is flooding the market, prices might be low — skip!\n🌆 **Evening**: BEST period for hydro! Solar gone, demand high, prices peak. Use your water here.\n\nBid hydro at or above the expected clearing price. Real-world operators like Snowy Hydro are among the NEM\'s most sophisticated traders.',
        },
      ],
    },
  },
  {
    roundNumber: 8,
    name: 'Battery Storage',
    description: 'Grid-scale batteries can charge during cheap periods and discharge during expensive ones. The ultimate arbitrage machine.',
    learningObjectives: [
      'Understand energy arbitrage',
      'Learn to charge at low/negative prices and discharge at peaks',
      'Manage state of charge across the day',
    ],
    season: 'spring',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: ['battery'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Grid-Scale Batteries',
      slides: [
        {
          heading: 'The Battery Revolution',
          body: '**Battery**: 150 MW / 300 MWh, 85% round-trip efficiency\n\nCharge when prices are low, discharge when high. You need the price spread to exceed the 15% efficiency loss to profit.',
        },
        {
          heading: 'Battery Strategy by Period',
          body: '🌙 **Overnight**: CHARGE — prices lowest, fill up the battery\n🌅 **Morning**: May continue charging if prices are dropping from solar\n☀️ **Afternoon**: CHARGE during solar surplus (spring) or DISCHARGE in summer peaks\n🌆 **Evening**: DISCHARGE — prime time! Solar gone, demand high, prices peak. This is where batteries earn.\n\nWith 85% efficiency, charging at $20/MWh means you need $24+/MWh to break even on discharge. The bigger the spread, the bigger the profit.',
        },
        {
          heading: 'Full Portfolio Unlocked',
          body: 'You now have **10 bid bands** per asset and your complete fleet:\n- Coal (800 MW) — baseload, check your Marginal Cost badge\n- Gas CCGT (350 MW) — mid-merit\n- Gas Peaker (150 MW) — expensive peak-only\n- Wind (300 MW) — variable, $0 marginal cost\n- Solar (200 MW) — daytime only, $0 marginal cost\n- Hydro (250 MW / 1,000 MWh) — limited water\n- Battery (150 MW / 300 MWh) — arbitrage\n\nThink about how each asset performs across periods. Each period description panel on your phone will guide you!',
        },
      ],
    },
  },

  // Phase 3: Seasons & Scenarios (Rounds 9-12)
  {
    roundNumber: 9,
    name: 'Summer Heatwave',
    description: 'Extreme heat drives air conditioning demand to record levels. Some thermal plants derate. Welcome to an Australian summer.',
    learningObjectives: [
      'Experience extreme demand scenarios',
      'See how scarcity drives prices toward the cap',
      'Understand thermal derating in hot weather',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer: Extreme demand from air conditioning, solar helps but evenings are brutal',
      demandContext: 'Summer has the HIGHEST demand, especially during the Afternoon (air conditioning peaks) and Evening (residential returns home to hot houses). Even overnight demand is elevated because AC runs all night. This heatwave pushes demand 40% above normal during peak periods.',
      supplyContext: 'Solar is at its strongest — long, hot days with peak output. But coal is DERATED by 10% (high cooling water temperatures reduce efficiency). The critical period is the Evening when solar drops off but demand stays extreme. Wind is typically weakest in summer.',
      biddingAdvice: 'This is a scarcity round — bid aggressively! The Afternoon and Evening periods will see very tight supply. Gas peakers and hydro should target the Evening when solar disappears. Batteries should charge during the Morning solar period and discharge in the Evening. Coal should bid higher than usual — every MW matters when supply is tight.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_extreme'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Summer Extremes',
      slides: [
        {
          heading: 'Heatwave Alert!',
          body: '42°C+ temperatures! Air conditioning demand surging. Coal derated 10%.\n\n**Demand**: Afternoon +40%, Evening +20%\n**Supply**: Coal plants reduced by 10% (high cooling water temp)',
        },
        {
          heading: 'Summer Period Guide',
          body: '🌙 **Overnight**: Even overnight demand elevated — hot night with AC. Normally quiet, now tighter.\n🌅 **Morning**: Demand ramping, industry plus early cooling. Solar starting to help.\n☀️ **Afternoon**: EXTREME demand. Solar helps but coal derated. Every MW counts. Scarcity pricing likely!\n🌆 **Evening**: The "solar cliff" — solar drops off but demand stays high. This is where blackouts happen in real life. Price cap territory.\n\nBatteries + hydro should discharge during Evening. Gas peakers will likely set prices.',
        },
      ],
    },
  },
  {
    roundNumber: 10,
    name: 'Winter Evening Peak',
    description: 'A cold snap creates heating demand. No solar, variable wind. The evening becomes the critical period.',
    learningObjectives: [
      'Understand winter demand patterns',
      'See how lack of solar shifts the peak',
      'Value of wind generation in cold conditions',
    ],
    season: 'winter',
    seasonalGuidance: {
      headline: 'Winter: Heating demand surges, short days cripple solar, evening is critical',
      demandContext: 'Winter demand is driven by heating — especially the Evening peak (6-9pm) when everyone comes home and turns on heaters. Overnight demand is also elevated from heating. The cold snap pushes Evening demand to near-summer levels, but spread across different periods.',
      supplyContext: 'Solar output is severely reduced — short days and low sun angle mean less energy, and it drops off earlier. Wind can be strong in winter (cold fronts bring wind) but is variable. The key issue: there\'s no solar cushion during the Afternoon and Evening, so thermal generation must carry a much heavier load.',
      biddingAdvice: 'The Evening is where the money is this round. With no solar and peak heating demand, supply will be very tight from 6pm onwards. Bid gas and peakers aggressively for the Evening. Hydro and batteries should target Evening discharge. During the day, moderate prices are likely — coal handles most demand. Don\'t waste your limited hydro/battery capacity on low-price daytime periods.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['cold_snap'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Winter Challenges',
      slides: [
        {
          heading: 'Winter Period Guide',
          body: '🌙 **Overnight**: Cold nights = elevated heating demand. Wind may be strong (cold fronts).\n🌅 **Morning**: Demand rises quickly. Short days mean minimal solar contribution.\n☀️ **Afternoon**: Lower solar output in winter. Coal + gas carry the load. Moderate-high prices.\n🌆 **Evening**: CRITICAL PERIOD. Heating demand peaks 6-9pm. No solar at all. Wind may help but gas peakers essential. Highest prices.\n\nThe winter evening peak, with no solar and surging heating demand, has become the NEM\'s tightest period in real life.',
        },
      ],
    },
  },
  {
    roundNumber: 11,
    name: 'Spring Oversupply',
    description: 'Mild weather meets abundant renewables. Demand is low, supply is high. Negative prices are likely during the day. Can you profit from a flooded market?',
    learningObjectives: [
      'Understand negative pricing in high-renewables periods',
      'Learn about curtailment decisions',
      'Strategic bidding with must-run coal vs cheap renewables',
    ],
    season: 'spring',
    seasonalGuidance: {
      headline: 'Spring: Lowest demand + highest renewable output = negative prices!',
      demandContext: 'Spring demand is at its annual minimum. No heating, no cooling. Overnight and Morning demand are very low. Even the peak periods see modest consumption.',
      supplyContext: 'Solar is strong and wind is moderate, flooding cheap energy into an already low-demand market. Total supply far exceeds demand during the day. Coal can\'t easily shut down ($50K+ restart cost), so it keeps running even at a loss.',
      biddingAdvice: 'The Afternoon will likely see NEGATIVE prices — supply crushes demand. Charge batteries during this period (you get paid to charge!). Coal will lose money during the day, so consider bidding it at negative prices to stay dispatched (avoiding shutdown costs) or bid high to withdraw capacity. The Evening is your profit window — solar disappears, demand picks up, and prices snap back. Concentrate your gas, hydro, and battery discharge in the Evening.',
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
      title: 'When Too Much is a Problem',
      slides: [
        {
          heading: 'Negative Prices — When Too Much is a Problem',
          body: 'When supply exceeds demand, the clearing price can go NEGATIVE!\n\n🌙 **Overnight**: Low demand, moderate wind — mild oversupply possible\n🌅 **Morning**: Solar flooding in, prices dropping\n☀️ **Afternoon**: NEGATIVE PRICES LIKELY! Solar + wind crush demand. Batteries should CHARGE (you get paid to charge!). Coal loses money.\n🌆 **Evening**: Solar gone — prices snap back up. Discharge batteries, run gas. Profit from the spread!\n\nCoal can\'t easily shut down ($50K+ restart cost). The teams that profit will manage the transition from oversupply to scarcity.',
        },
      ],
    },
  },
  {
    roundNumber: 12,
    name: 'Drought & Gas Crisis',
    description: 'Drought halves hydro availability. International LNG demand spikes gas prices by 60%. The market tightens.',
    learningObjectives: [
      'See how fuel price volatility impacts the merit order',
      'Understand water scarcity effects on hydro operators',
      'Experience a supply-constrained market',
    ],
    season: 'autumn',
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['drought', 'fuel_price_spike'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Resource Constraints',
      slides: [
        {
          heading: 'Drought & Gas Price Spike',
          body: '**Drought**: Dam levels are critically low. Your hydro plant can only operate at 50% of normal capacity.\n\n**Gas Crisis**: LNG export demand has pushed domestic gas prices from $10/GJ to $18/GJ, increasing gas generator marginal costs by 60%.\n\nThis mirrors the 2022 energy crisis when gas prices spiked globally, flowing through to record NEM wholesale prices. The AEMC had to intervene with administered pricing.',
        },
      ],
    },
  },

  // Phase 4: Advanced (Rounds 13-15)
  {
    roundNumber: 13,
    name: 'Dunkelflaute',
    description: 'Extended low wind AND low solar. The renewable energy drought. How does the system cope when the wind doesn\'t blow and the sun doesn\'t shine?',
    learningObjectives: [
      'Understand system reliability without renewables',
      'See the value of dispatchable generation during "dark doldrums"',
      'Recognise battery limitations during extended low-VRE periods',
    ],
    season: 'winter',
    seasonalGuidance: {
      headline: 'Winter Dunkelflaute: No wind, minimal solar, high heating demand — thermal is king',
      demandContext: 'Winter demand is elevated by heating, with the Evening peak being the most critical. The cold snap adds further pressure. Demand is consistently high across all periods — there\'s no "quiet" time.',
      supplyContext: 'This is the worst-case scenario for renewables. Wind is at just 10% of normal output. Solar is reduced to 40% (heavy cloud cover on short winter days). Batteries only have 2 hours of storage — nowhere near enough to bridge the gap. Coal and gas must carry nearly all demand.',
      biddingAdvice: 'Your thermal assets (coal, gas) are essential this round — bid them confidently. Every period will have tight supply. Peakers will likely be dispatched in multiple periods, not just Evening. Save your limited battery charge for the absolute peak (Evening). Hydro should also target Evening. Don\'t bid renewables aggressively — there simply isn\'t much output available.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.08,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['dunkelflaute'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Dark Doldrums - Dunkelflaute',
      slides: [
        {
          heading: 'When Renewables Disappear',
          body: '**Dunkelflaute** (German: "dark doldrums") — extended low wind AND low solar.\n\nWind at 10% of normal. Solar at 40% (heavy cloud). Winter demand elevated.\n\nEvery period relies heavily on thermal generation:',
        },
        {
          heading: 'Dunkelflaute Period Guide',
          body: '🌙 **Overnight**: Almost no renewable output. Coal carries everything. Prices elevated.\n🌅 **Morning**: Minimal solar ramp, negligible wind. All thermal running. Moderate-high prices.\n☀️ **Afternoon**: Normally solar-rich, but clouds reduce output to 40%. Gas CCGT essential. Higher prices.\n🌆 **Evening**: Zero solar, minimal wind. Gas peakers critical. Very high prices likely.\n\nBatteries can\'t bridge a multi-day gap with only 2 hours of storage. Coal and gas earn their keep in this scenario. Bid thermal assets aggressively!',
        },
      ],
    },
  },
  {
    roundNumber: 14,
    name: 'Carbon Price World',
    description: 'A $50/tonne carbon price is introduced, adding ~$45/MWh to coal costs and ~$20-25/MWh to gas costs. The merit order is about to change dramatically.',
    learningObjectives: [
      'See how carbon pricing restructures the merit order',
      'Understand how policy settings change investment signals',
      'Observe renewables becoming more competitive',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer + Carbon Price: High demand meets dramatically higher thermal costs',
      demandContext: 'Summer brings high demand from air conditioning, especially in the Afternoon and Evening. This creates tight supply conditions that would normally drive high prices.',
      supplyContext: 'Solar is strong during the day. But the carbon price has fundamentally changed the cost structure: coal\'s marginal cost has jumped by ~$45/MWh, and gas by $20-25/MWh. Renewables are unaffected ($0 emissions). The merit order is reshuffled — coal is no longer the cheapest option.',
      biddingAdvice: 'Re-think everything! Your coal plant\'s marginal cost has increased significantly — check the updated Marginal Cost badge. Renewables and batteries are now even more valuable relative to thermal. During the Afternoon solar peak, thermal generation may not be needed at all. The Evening remains critical — high demand plus solar cliff means gas and peakers are essential, but must bid higher to cover their new carbon-inclusive costs.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.1,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['carbon_price', 'demand_response'],
    biddingTimeLimitSeconds: 240,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'Carbon Pricing & the Energy Transition',
      slides: [
        {
          heading: 'Carbon Price Impact',
          body: 'A carbon price of $50/tonne CO₂ has been introduced.\n\nImpact on generator costs:\n- **Coal**: +$45/MWh (high emissions intensity ~0.9t CO₂/MWh)\n- **Gas CCGT**: +$20/MWh (lower emissions ~0.4t CO₂/MWh)\n- **Gas Peaker**: +$25/MWh (less efficient ~0.5t CO₂/MWh)\n- **Renewables, Hydro, Battery**: No change ($0 emissions)\n\nYour coal plant\'s effective marginal cost has jumped significantly. Is it still competitive?',
        },
        {
          heading: 'Policy Meets Market',
          body: 'Australia briefly had a carbon price from 2012-2014 ($23/tonne). It was repealed in 2014.\n\nThe Safeguard Mechanism (reformed 2023) effectively creates a declining emissions baseline for large emitters, including power stations.\n\nThis round demonstrates how explicit carbon pricing would reshape the merit order, potentially making coal the most expensive generation technology and accelerating the transition to renewables + storage.',
        },
      ],
    },
  },
  {
    roundNumber: 15,
    name: 'The Full NEM Challenge',
    description: 'All assets, realistic demand, multiple scenarios. A hot summer day with a major plant outage. This is the real NEM. May the best portfolio win.',
    learningObjectives: [
      'Apply all learned strategies in a complex market',
      'Portfolio bidding across diverse asset types',
      'Real-world decision-making under uncertainty',
    ],
    season: 'summer',
    seasonalGuidance: {
      headline: 'Summer Crisis: Heatwave + plant outage = the NEM\'s toughest day',
      demandContext: 'Peak summer demand with a heatwave. Air conditioning drives extreme consumption in the Afternoon and Evening. Even overnight demand is elevated. A plant outage further tightens an already stressed system.',
      supplyContext: 'Solar is strong during the day but drops off before the evening peak. The plant outage removes capacity from the market. Wind is typically weak in summer. Every available MW of generation is needed.',
      biddingAdvice: 'Apply everything you\'ve learned. Charge batteries and keep hydro for the Evening crunch. Bid thermal assets firmly — this is a high-price environment across all periods. The Evening "solar cliff" combined with the outage means scarcity pricing is likely. The team that best manages their portfolio across the day will win the game.',
    },
    timePeriods: ['night_offpeak', 'day_offpeak', 'day_peak', 'night_peak'],
    periodDurations: { night_offpeak: 6, day_offpeak: 6, day_peak: 6, night_peak: 6 },
    baseDemandMW: { night_offpeak: 0, day_offpeak: 0, day_peak: 0, night_peak: 0 },
    demandVariability: 0.12,
    newAssetsUnlocked: [],
    activeScenarioEvents: ['heatwave_moderate', 'plant_outage_random'],
    biddingTimeLimitSeconds: 300,
    maxBidBandsPerAsset: 10,
    educationalContent: {
      title: 'The Ultimate Challenge',
      slides: [
        {
          heading: 'Final Round',
          body: 'A hot summer day with a major plant outage. Everything comes together:\n\n🌙 **Overnight**: Hot night, elevated demand. Battery charging opportunity?\n🌅 **Morning**: Industry starting up, solar ramping. With an outage, supply is tighter.\n☀️ **Afternoon**: Peak summer demand. Solar helps but some capacity is out. Prices may spike!\n🌆 **Evening**: The crunch. Solar cliff + sustained heat + outage = maximum stress. Every MW earns premium.\n\nThe team with the highest cumulative profit across all rounds wins!',
        },
        {
          heading: 'The NEM Today',
          body: 'The Australian NEM is in the midst of the world\'s most rapid energy transition:\n- Coal provides ~47% of energy (down from 85% in 2000)\n- Renewables regularly exceed 50% of instantaneous generation\n- 20+ GW of rooftop solar has reshaped the demand curve\n- Grid-scale batteries are the fastest-growing technology\n- The evening peak (4-8pm) is the new system stress point\n\nUnderstanding these dynamics - and how to profit from them - is the key to success in the modern energy market.',
        },
      ],
    },
  },
];
