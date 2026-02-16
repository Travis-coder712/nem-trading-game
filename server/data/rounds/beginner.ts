import type { RoundConfig } from '../../../shared/types.ts';

/**
 * Beginner mode: 1 round, 2 assets (coal + gas CCGT), 2 periods, 2 bid bands max.
 * Designed as a super-simplified intro for first-time players.
 * The walkthrough guides every step with plain-English explanations.
 */
export const beginnerRounds: RoundConfig[] = [
  {
    roundNumber: 1,
    name: 'Your First Electricity Market',
    description:
      'Welcome! You own a coal plant and a gas plant. ' +
      'You will set prices to sell your electricity in the Morning and Afternoon. ' +
      'The cheapest electricity gets used first. Let\'s see how it works!',
    learningObjectives: [
      'Understand what a "bid" is — a price and quantity you offer to sell',
      'See how bids are stacked cheapest-first into the "merit order"',
      'Learn that ALL generators earn the same "clearing price"',
      'Discover why bidding strategy matters — cheap bids get dispatched but don\'t set the price',
    ],
    season: 'autumn',
    timePeriods: ['day_offpeak', 'day_peak'],
    periodDurations: { day_offpeak: 6, day_peak: 6 },
    baseDemandMW: { day_offpeak: 0, day_peak: 0 }, // filled by demand generator
    demandVariability: 0.03, // very low variability for predictability
    newAssetsUnlocked: ['coal', 'gas_ccgt'],
    activeScenarioEvents: [],
    biddingTimeLimitSeconds: 360, // 6 minutes — plenty of time for beginners
    maxBidBandsPerAsset: 2, // keep it simple
    educationalContent: {
      title: 'How Electricity Markets Work',
      slides: [
        {
          heading: 'Welcome to the NEM!',
          body:
            'You are a **power company** in Australia\'s National Electricity Market.\n\n' +
            'You own two power stations:\n' +
            '- 🏭 **Coal Plant** (800 MW) — cheap to run, always available\n' +
            '- 🔥 **Gas CCGT** (350 MW) — more expensive, but flexible\n\n' +
            'Your job: **set a price** for your electricity and sell it to the grid.\n\n' +
            'The market operator (AEMO) decides who gets to generate — cheapest bids go first!',
        },
        {
          heading: 'How Pricing Works',
          body:
            'Each generator submits a **bid**: a price ($/MWh) and quantity (MW).\n\n' +
            'AEMO lines up ALL bids from cheapest to most expensive — this is called the **merit order**.\n\n' +
            'Starting from the cheapest, AEMO turns on generators one-by-one until there is enough electricity to meet demand.\n\n' +
            'The magic: the **last generator turned on** sets the price for EVERYONE. ' +
            'Even if you bid $0, you earn whatever that last generator bid. This is the **clearing price**.',
        },
        {
          heading: 'Your Two Time Periods',
          body:
            'You\'ll bid for two time periods:\n\n' +
            '🌅 **Morning** — lower demand, more supply available, expect lower prices\n' +
            '☀️ **Afternoon** — higher demand, supply gets tighter, prices go up\n\n' +
            'Think about it: if demand is high and supply is tight, ' +
            'should you bid your gas plant cheaply, or hold out for a higher price?\n\n' +
            '**Your profit = (Clearing Price − Your Cost) × MW dispatched × Hours**',
        },
      ],
    },
    walkthrough: {
      introText:
        'We\'ve pre-filled bids for you! Your coal plant is cheap to run (check the SRMC badge). ' +
        'Your gas plant costs more. You can adjust the bids or submit as-is. ' +
        'Tip: your coal should bid low to guarantee dispatch. Your gas can bid higher for afternoon peak!',
      suggestedBids: [
        // Coal in morning — bid cheap to guarantee dispatch
        {
          assetType: 'coal',
          period: 'day_offpeak',
          suggestedPrice: 0,
          suggestedQuantityPercent: 100,
          explanation:
            'Bid all your coal at $0/MWh in the morning. This guarantees dispatch. ' +
            'Don\'t worry — you\'ll still earn the clearing price, not $0!',
        },
        // Coal in afternoon — split: some cheap, some higher
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 0,
          suggestedQuantityPercent: 60,
          explanation:
            'Bid 60% of your coal cheap to guarantee it runs in the afternoon.',
        },
        {
          assetType: 'coal',
          period: 'day_peak',
          suggestedPrice: 80,
          suggestedQuantityPercent: 40,
          explanation:
            'Bid the other 40% at $80/MWh. If demand is high enough this will be dispatched too — ' +
            'and might even set the clearing price, earning $80/MWh for ALL your power!',
        },
        // Gas in morning — at SRMC
        {
          assetType: 'gas_ccgt',
          period: 'day_offpeak',
          suggestedPrice: 75,
          suggestedQuantityPercent: 100,
          explanation:
            'Bid your gas at its running cost ($75/MWh). ' +
            'It may or may not be dispatched in the morning — depends on demand.',
        },
        // Gas in afternoon — bid above SRMC for margin
        {
          assetType: 'gas_ccgt',
          period: 'day_peak',
          suggestedPrice: 120,
          suggestedQuantityPercent: 100,
          explanation:
            'Bid your gas at $120/MWh for the afternoon. ' +
            'Demand is higher, so gas is more likely to be needed — and you want to earn a margin above your $75 cost!',
        },
      ],
      afterSubmitExplanation:
        'Now watch the host screen! You\'ll see the "merit order" chart — all bids stacked cheapest to most expensive. ' +
        'The red dotted line is demand. Where it crosses the stack, that\'s the clearing price. ' +
        'Everyone to the LEFT of that line gets dispatched and earns the clearing price. ' +
        'Check your profit afterwards to see how your strategy worked!',
    },
  },
];
