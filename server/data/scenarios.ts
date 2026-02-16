import type { ScenarioEvent } from '../../shared/types.ts';

export const SCENARIO_EVENTS: ScenarioEvent[] = [
  {
    id: 'heatwave_extreme',
    type: 'heatwave',
    name: 'Extreme Summer Heatwave',
    description: 'A severe heatwave has pushed temperatures above 42°C across the eastern seaboard. Air conditioning demand is at record levels. Some thermal plants are derated due to high cooling water temperatures.',
    learningObjective: 'Understand how extreme weather drives demand spikes and can constrain thermal generation.',
    effects: [
      { type: 'modify_demand', targetTimePeriod: 'day_peak', multiplier: 1.4 },
      { type: 'modify_demand', targetTimePeriod: 'night_peak', multiplier: 1.2 },
      { type: 'modify_asset_availability', targetAssetType: 'coal', multiplier: 0.9 },
    ],
    triggerRound: 9,
  },
  {
    id: 'heatwave_moderate',
    type: 'heatwave',
    name: 'Hot Summer Day',
    description: 'A hot day with temperatures around 38°C. Above-average cooling demand expected.',
    learningObjective: 'See how moderate heat events affect the supply-demand balance.',
    effects: [
      { type: 'modify_demand', targetTimePeriod: 'day_peak', multiplier: 1.25 },
      { type: 'modify_demand', targetTimePeriod: 'night_peak', multiplier: 1.1 },
    ],
    triggerRound: 15,
  },
  {
    id: 'cold_snap',
    type: 'cold_snap',
    name: 'Winter Cold Snap',
    description: 'A polar blast has brought freezing temperatures to southeastern Australia. Evening heating demand surges as temperatures drop below 5°C. Wind generation is above average with the cold front.',
    learningObjective: 'Understand winter demand patterns driven by heating and how wind often correlates with cold weather.',
    effects: [
      { type: 'modify_demand', targetTimePeriod: 'night_peak', multiplier: 1.35 },
      { type: 'modify_demand', targetTimePeriod: 'night_offpeak', multiplier: 1.15 },
      { type: 'modify_capacity_factor', targetAssetType: 'wind', multiplier: 1.3 },
    ],
    triggerRound: 10,
  },
  {
    id: 'drought',
    type: 'drought',
    name: 'Severe Drought',
    description: 'Prolonged drought has reduced dam levels across the catchment. Hydro generators must conserve water, reducing available generation by 50%. Water value has increased significantly.',
    learningObjective: 'Learn how water scarcity affects hydro bidding strategies and opportunity cost.',
    effects: [
      { type: 'modify_asset_availability', targetAssetType: 'hydro', multiplier: 0.5 },
    ],
    triggerRound: 12,
  },
  {
    id: 'fuel_price_spike',
    type: 'fuel_price_spike',
    name: 'Gas Price Spike',
    description: 'International LNG demand has pushed domestic gas prices from $10/GJ to $18/GJ. Gas generator short-run marginal costs have increased by approximately 60%.',
    learningObjective: 'See how fuel price volatility flows through to electricity prices via gas generator marginal costs.',
    effects: [
      { type: 'modify_srmc', targetAssetType: 'gas_ccgt', multiplier: 1.6 },
      { type: 'modify_srmc', targetAssetType: 'gas_peaker', multiplier: 1.6 },
    ],
    triggerRound: 12,
  },
  {
    id: 'dunkelflaute',
    type: 'dunkelflaute',
    name: 'Dunkelflaute - Dark Doldrums',
    description: 'A slow-moving high pressure system has brought still, overcast conditions across southeastern Australia for several days. Wind generation is at just 10% of capacity, and solar is producing only 40% of normal output. This is a "dunkelflaute" - a period of simultaneously low wind and low solar.',
    learningObjective: 'Understand the reliability challenge of variable renewables and the critical role of dispatchable generation and storage during sustained low-VRE periods.',
    effects: [
      { type: 'modify_capacity_factor', targetAssetType: 'wind', multiplier: 0.3 },
      { type: 'modify_capacity_factor', targetAssetType: 'solar', multiplier: 0.4 },
    ],
    triggerRound: 13,
  },
  {
    id: 'carbon_price',
    type: 'carbon_price',
    name: 'Carbon Price Introduction',
    description: 'A carbon price of $50/tonne CO₂ has been introduced. This adds approximately $45/MWh to coal generation costs and $20/MWh to gas generation costs, fundamentally changing the merit order.',
    learningObjective: 'See how carbon pricing changes the competitive position of different fuel types and accelerates the clean energy transition.',
    effects: [
      { type: 'add_carbon_cost', targetAssetType: 'coal', absoluteChange: 45 },
      { type: 'add_carbon_cost', targetAssetType: 'gas_ccgt', absoluteChange: 20 },
      { type: 'add_carbon_cost', targetAssetType: 'gas_peaker', absoluteChange: 25 },
    ],
    triggerRound: 14,
  },
  {
    id: 'negative_prices',
    type: 'negative_prices',
    name: 'Renewable Oversupply',
    description: 'A perfect spring day with mild temperatures, strong sunshine, and moderate wind. Rooftop solar has reduced grid demand to near-record lows. Negative prices are likely during the middle of the day - generators may need to pay to stay on.',
    learningObjective: 'Understand negative pricing: when supply exceeds demand, inflexible generators and subsidised renewables may accept negative prices rather than shut down.',
    effects: [
      { type: 'modify_demand', targetTimePeriod: 'day_offpeak', multiplier: 0.7 },
      { type: 'modify_demand', targetTimePeriod: 'day_peak', multiplier: 0.65 },
      { type: 'modify_capacity_factor', targetAssetType: 'solar', multiplier: 1.3 },
      { type: 'modify_capacity_factor', targetAssetType: 'wind', multiplier: 1.2 },
    ],
    triggerRound: 11,
  },
  {
    id: 'plant_outage_random',
    type: 'plant_outage',
    name: 'Unplanned Generator Outage',
    description: 'A major coal-fired generator has suffered an unexpected boiler tube failure and will be offline for this dispatch day. This removes significant baseload capacity from the market.',
    learningObjective: 'See how unexpected outages can tighten supply and drive price spikes, especially during peak demand.',
    effects: [
      { type: 'force_outage', targetAssetType: 'coal' },
    ],
    triggerRound: 15,
  },
  {
    id: 'demand_response',
    type: 'demand_response',
    name: 'Industrial Demand Response',
    description: 'High price forecasts have triggered demand response from large industrial users. Aluminium smelters and other interruptible loads are reducing consumption during the peak period.',
    learningObjective: 'Understand demand-side participation in the market and how it moderates peak prices.',
    effects: [
      { type: 'modify_demand', targetTimePeriod: 'day_peak', multiplier: 0.85 },
      { type: 'modify_demand', targetTimePeriod: 'night_peak', multiplier: 0.9 },
    ],
    triggerRound: 14,
  },
];

export function getScenarioEventsForRound(roundNumber: number, activeEventIds: string[]): ScenarioEvent[] {
  return SCENARIO_EVENTS.filter(e => activeEventIds.includes(e.id));
}
