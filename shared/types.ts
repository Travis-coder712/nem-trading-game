// ============================================================
// Shared Types for NEM Merit Order Training Game
// ============================================================

// ---- Enumerations ----

export type GameMode = 'beginner' | 'quick' | 'full' | 'experienced';

export type GamePhase =
  | 'lobby'
  | 'briefing'
  | 'bidding'
  | 'dispatching'
  | 'results'
  | 'final';

export type AssetType =
  | 'coal'
  | 'gas_ccgt'
  | 'gas_peaker'
  | 'hydro'
  | 'wind'
  | 'solar'
  | 'battery';

export type Season = 'summer' | 'autumn' | 'winter' | 'spring';

export type TimePeriod =
  | 'night_offpeak'   // 00:00-06:00
  | 'day_offpeak'     // 06:00-12:00
  | 'day_peak'        // 12:00-18:00
  | 'night_peak';     // 18:00-24:00

export type ScenarioEventType =
  | 'drought'
  | 'heatwave'
  | 'cold_snap'
  | 'plant_outage'
  | 'dunkelflaute'
  | 'fuel_price_spike'
  | 'demand_response'
  | 'carbon_price'
  | 'negative_prices'
  | 'balancing_penalty';

export type BiddingStrategyType =
  | 'price_taker'
  | 'srmc_bidder'
  | 'price_maker'
  | 'portfolio_optimizer'
  | 'strategic_withdrawal'
  | 'battery_arbitrageur';

// ---- Core Data Structures ----

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  coal: 'Coal',
  gas_ccgt: 'Gas CCGT',
  gas_peaker: 'Gas Peaker',
  hydro: 'Hydro',
  wind: 'Wind',
  solar: 'Solar',
  battery: 'Battery',
};

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  coal: '#4a5568',
  gas_ccgt: '#ed8936',
  gas_peaker: '#f56565',
  hydro: '#4299e1',
  wind: '#48bb78',
  solar: '#ecc94b',
  battery: '#9f7aea',
};

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  night_offpeak: 'Overnight (12am–6am)',
  day_offpeak: 'Morning (6am–12pm)',
  day_peak: 'Afternoon (12pm–6pm)',
  night_peak: 'Evening (6pm–12am)',
};

export const TIME_PERIOD_SHORT_LABELS: Record<TimePeriod, string> = {
  night_offpeak: 'Overnight',
  day_offpeak: 'Morning',
  day_peak: 'Afternoon',
  night_peak: 'Evening',
};

export const TIME_PERIOD_TIME_RANGES: Record<TimePeriod, string> = {
  night_offpeak: '12am–6am',
  day_offpeak: '6am–12pm',
  day_peak: '12pm–6pm',
  night_peak: '6pm–12am',
};

export const SEASON_LABELS: Record<Season, string> = {
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
  spring: 'Spring',
};

export const TIME_PERIOD_HOURS: Record<TimePeriod, number> = {
  night_offpeak: 6,
  day_offpeak: 6,
  day_peak: 6,
  night_peak: 6,
};

export const TEAM_COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#e53e3e',
  '#c05621', '#2f855a', '#2b6cb0', '#6b46c1', '#b83280',
];

export interface AssetDefinition {
  id: string;
  name: string;
  type: AssetType;
  nameplateMW: number;
  srmcPerMWh: number;
  minStableLoadMW: number;
  rampRateMWPerMin: number;
  startupCostDollars: number;
  mustRun: boolean;
  availableFromRound: number;
  maxStorageMWh?: number;
  roundTripEfficiency?: number;
  maxChargeMW?: number;
  capacityFactors?: Record<TimePeriod, number>;
  seasonalCapacityMultiplier?: Record<Season, number>;
}

export interface TeamAssetInstance {
  assetDefinitionId: string;
  teamId: string;
  currentAvailableMW: number;
  isForceOutage: boolean;
  currentStorageMWh?: number;
  maxStorageMWh?: number;
}

export interface BidBand {
  pricePerMWh: number;
  quantityMW: number;
}

export interface AssetBid {
  assetInstanceId: string;
  assetDefinitionId: string;
  teamId: string;
  timePeriod: TimePeriod;
  bands: BidBand[];
  totalOfferedMW: number;
  isBatteryCharging?: boolean;
  submittedAt: number;
}

export interface TeamBidSubmission {
  teamId: string;
  roundNumber: number;
  bids: AssetBid[];
  isComplete: boolean;
}

// ---- Dispatch Results ----

export interface DispatchedBand {
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

export interface TimePeriodDispatchResult {
  timePeriod: TimePeriod;
  demandMW: number;
  clearingPriceMWh: number;
  totalDispatchedMW: number;
  meritOrderStack: DispatchedBand[];
  undispatchedBands: DispatchedBand[];
  excessCapacityMW: number;
  reserveMarginPercent: number;
}

export interface RoundDispatchResult {
  roundNumber: number;
  periodResults: TimePeriodDispatchResult[];
  teamResults: TeamRoundResult[];
}

export interface TeamRoundResult {
  teamId: string;
  teamName: string;
  periodBreakdown: TeamPeriodResult[];
  totalRevenueDollars: number;
  totalCostDollars: number;
  totalProfitDollars: number;
  totalEnergyGeneratedMWh: number;
  averagePriceMWh: number;
}

export interface TeamPeriodResult {
  timePeriod: TimePeriod;
  assets: AssetPeriodResult[];
  periodRevenue: number;
  periodCost: number;
  periodProfit: number;
}

export interface AssetPeriodResult {
  assetDefinitionId: string;
  assetName: string;
  assetType: AssetType;
  dispatchedMW: number;
  durationHours: number;
  energyMWh: number;
  revenueFromDispatch: number;
  variableCost: number;
  startupCost: number;
  profit: number;
}

// ---- Game State ----

export interface Team {
  id: string;
  name: string;
  color: string;
  socketId: string | null;
  isConnected: boolean;
  assets: TeamAssetInstance[];
  cumulativeProfitDollars: number;
  roundResults: TeamRoundResult[];
  rank: number;
}

export interface ScenarioEvent {
  id: string;
  type: ScenarioEventType;
  name: string;
  description: string;
  learningObjective: string;
  effects: ScenarioEffect[];
  triggerRound: number;
  targetTeamIds?: string[];
}

export interface ScenarioEffect {
  type: 'modify_demand' | 'modify_asset_availability'
      | 'modify_srmc' | 'modify_capacity_factor'
      | 'force_outage' | 'add_carbon_cost';
  targetAssetType?: AssetType;
  targetTimePeriod?: TimePeriod;
  multiplier?: number;
  absoluteChange?: number;
  durationRounds?: number;
}

export interface EducationalSlide {
  heading: string;
  body: string;
  imageUrl?: string;
}

// ---- Surprise Events (host-triggered mid-game mechanics) ----

export interface SurpriseEventDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;        // what happens (for host)
  impactSummary: string;      // predicted market impact
  category: 'supply' | 'demand' | 'cost';
}

/** Dramatic incident report shown to teams — vague, no event names, mimics real-world uncertainty */
export interface SurpriseIncident {
  icon: string;
  headline: string;         // dramatic 1-liner: "BREAKING: Grid demand surging beyond forecast"
  description: string;      // 2-3 sentences of dramatic, vague context
  category: 'supply' | 'demand' | 'cost';
}

export interface WalkthroughSuggestedBid {
  assetType: AssetType;
  period: TimePeriod;
  suggestedPrice: number;
  suggestedQuantityPercent: number; // percentage of available MW
  explanation: string;
}

export interface WalkthroughConfig {
  introText: string;
  suggestedBids: WalkthroughSuggestedBid[];
  afterSubmitExplanation: string;
}

export interface PeriodDescription {
  label: string;           // e.g. "Overnight"
  timeRange: string;       // e.g. "12am–6am"
  demandLevel: string;     // e.g. "Low", "Moderate", "High", "Very High"
  typicalDispatch: string; // what assets normally run
  priceContext: string;    // price expectations
  icon: string;            // emoji icon
}

/**
 * Generate context-aware period descriptions based on available assets and season.
 * This helps teams understand what to expect in each period.
 */
export function getPeriodDescriptions(
  period: TimePeriod,
  season: Season,
  availableAssetTypes: AssetType[],
): PeriodDescription {
  const hasGas = availableAssetTypes.includes('gas_ccgt') || availableAssetTypes.includes('gas_peaker');
  const hasRenewables = availableAssetTypes.includes('wind') || availableAssetTypes.includes('solar');
  const hasSolar = availableAssetTypes.includes('solar');
  const hasWind = availableAssetTypes.includes('wind');
  const hasHydro = availableAssetTypes.includes('hydro');
  const hasBattery = availableAssetTypes.includes('battery');

  switch (period) {
    case 'night_offpeak':
      return {
        label: 'Overnight',
        timeRange: '12am–6am',
        icon: '🌙',
        demandLevel: 'Low',
        typicalDispatch: hasRenewables
          ? `Baseload coal runs at minimum stable load. ${hasWind ? 'Wind often strong overnight. ' : ''}No solar. ${hasBattery ? 'Batteries may charge at low prices. ' : ''}${hasGas ? 'Gas typically off unless needed.' : ''}`
          : hasGas
          ? 'Coal provides baseload. Gas CCGT may supplement if needed. Peakers rarely economic overnight.'
          : 'Coal provides all baseload generation. Lowest demand period of the day.',
        priceContext: season === 'summer'
          ? 'Usually low prices, but hot nights with AC can push demand and prices up unexpectedly.'
          : 'Typically the lowest prices of the day. Demand is at its minimum.',
      };

    case 'day_offpeak':
      return {
        label: 'Morning',
        timeRange: '6am–12pm',
        icon: '🌅',
        demandLevel: 'Moderate',
        typicalDispatch: hasSolar
          ? `Coal at steady output. Solar ramps up through the morning${hasWind ? ', wind may contribute' : ''}. ${hasGas ? 'Gas CCGT may run mid-merit. ' : ''}${hasBattery ? 'Batteries may charge during solar surplus.' : ''}`
          : hasGas
          ? 'Coal at steady output. Gas CCGT fills the gap as business demand rises. Peakers on standby.'
          : 'Coal ramps up to meet rising demand as businesses open and industry starts.',
        priceContext: hasSolar
          ? 'Moderate prices early, but can drop as solar ramps up towards midday, potentially pushing out thermal.'
          : 'Moderate prices. Demand rises as industry and commercial activity begin.',
      };

    case 'day_peak':
      return {
        label: 'Afternoon',
        timeRange: '12pm–6pm',
        icon: '☀️',
        demandLevel: season === 'summer' ? 'Very High' : hasSolar ? 'Moderate (solar surplus possible)' : 'High',
        typicalDispatch: hasSolar
          ? `Solar at peak output${hasWind ? ', wind variable' : ''}. Coal running but may be squeezed by cheap renewables. ${hasGas ? 'Gas competes for remaining demand. ' : ''}${hasBattery ? 'Batteries may charge during solar peak if prices low.' : ''}`
          : hasGas
          ? 'All coal dispatched. Gas CCGT fills mid-merit. Peakers may be needed if demand is high enough.'
          : 'All available coal needed. This is when supply gets tight with only coal in the fleet.',
        priceContext: hasSolar && season !== 'summer'
          ? 'Can see LOW or even negative prices when solar floods the market! The "solar duck curve" in action.'
          : season === 'summer'
          ? 'Highest prices of the day. Air conditioning demand peaks. Scarcity pricing possible if supply is tight.'
          : 'Typically higher prices as demand is elevated. More capacity needed means higher-cost generators set the price.',
      };

    case 'night_peak':
      return {
        label: 'Evening',
        timeRange: '6pm–12am',
        icon: '🌆',
        demandLevel: season === 'winter' ? 'Very High' : 'High',
        typicalDispatch: hasSolar
          ? `Solar drops to zero ("solar cliff"). ${hasWind ? 'Wind may pick up. ' : ''}All thermal needed to fill the gap. ${hasGas ? 'Gas peakers likely dispatched. ' : ''}${hasBattery ? 'Batteries discharge — this is prime arbitrage time!' : ''}${hasHydro ? ' Hydro valuable for evening peak.' : ''}`
          : hasGas
          ? 'Full coal output plus gas generation. Peakers economic during demand spike. Residential demand peaks.'
          : 'Coal plants at maximum output. Evening residential demand creates the second peak of the day.',
        priceContext: hasSolar
          ? 'Often the HIGHEST prices — solar is gone, everyone needs power. The "evening ramp" is the system stress point.'
          : season === 'winter'
          ? 'Highest prices in winter. Heating demand peaks in the evening. Capacity may be scarce.'
          : 'Higher prices as residential demand overlaps with remaining commercial load.',
      };
  }
}

export interface RoundConfig {
  roundNumber: number;
  name: string;
  description: string;
  learningObjectives: string[];
  season: Season;
  timePeriods: TimePeriod[];
  periodDurations: Record<string, number>;
  baseDemandMW: Record<string, number>;
  demandVariability: number;
  newAssetsUnlocked: AssetType[];
  activeScenarioEvents: string[];
  biddingTimeLimitSeconds: number;
  maxBidBandsPerAsset: number;
  educationalContent: {
    title: string;
    slides: EducationalSlide[];
  };
  walkthrough?: WalkthroughConfig;
  /** Optional seasonal context shown during briefing to explain how this season affects demand, supply, and bidding */
  seasonalGuidance?: {
    headline: string;     // e.g. "Summer: High demand, strong solar, evening crunch"
    demandContext: string; // How demand differs this season
    supplyContext: string; // How supply differs this season
    biddingAdvice: string; // What teams should consider changing in their bidding
  };
}

// ---- Asset Configuration Presets ----

export interface AssetConfigOverride {
  name: string;
  nameplateMW: number;
  srmcPerMWh?: number; // undefined for wind/solar/battery (always $0)
}

export type AssetConfigOverrides = Partial<Record<AssetType, AssetConfigOverride>>;

export interface AssetConfigPreset {
  id: string;
  name: string;
  createdAt: string;
  applyVariation: boolean; // whether to spread SRMC across teams
  assets: AssetConfigOverrides;
}

export interface GameConfig {
  mode: GameMode;
  teamCount: number;
  rounds: RoundConfig[];
  priceCapMWh: number;
  priceFloorMWh: number;
  balancingEnabled: boolean;
  balancingThresholdPercent: number;
  defaultBiddingTimeSeconds: number;
  /** When true, warns teams if they bid too much capacity at $0 (risk of $0 clearing price) */
  biddingGuardrailEnabled: boolean;
  /** Optional custom asset configuration overrides */
  assetConfig?: AssetConfigOverrides;
  /** Whether to apply SRMC variation across teams when using custom config */
  assetVariation?: boolean;
}

export interface GameState {
  id: string;
  config: GameConfig;
  phase: GamePhase;
  currentRound: number;
  teams: Team[];
  roundResults: RoundDispatchResult[];
  activeScenarioEvents: ScenarioEvent[];
  /** Host-triggered surprise events applied this round (IDs only) */
  activeSurpriseEvents: string[];
  /** Original demand before surprise events were applied (null if no surprises) */
  preSurpriseDemandMW: Record<string, number> | null;
  /** Dramatic incident reports for teams (vague, no event names — mimics real-world uncertainty) */
  surpriseIncidents: SurpriseIncident[];
  currentBids: Map<string, TeamBidSubmission>;
  biddingTimeRemaining: number;
  startedAt: number;
  updatedAt: number;
}

// ---- Socket Events ----

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  color: string;
  rank: number;
  cumulativeProfitDollars: number;
  lastRoundProfitDollars: number;
  trend: 'up' | 'down' | 'same';
}

export interface TeamPublicInfo {
  id: string;
  name: string;
  color: string;
  isConnected: boolean;
  rank: number;
  cumulativeProfitDollars: number;
}

export interface FleetAssetTypeInfo {
  nameplateMW: number;                         // total nameplate across all teams
  availableMW: Record<string, number>;         // available MW per period (after capacity factors)
  teamCount: number;                           // how many teams have this asset
  srmcRange: [number, number];                 // [min, max] SRMC across teams
  isNew: boolean;                              // true if newly unlocked this round
}

export interface FleetInfo {
  totalFleetMW: Record<string, number>;       // per period: total generation MW from all teams
  demandMW: Record<string, number>;           // per period: demand MW set for this round
  demandAsPercentOfFleet: Record<string, number>; // per period: demand / fleet * 100
  /** Per-asset-type fleet composition for all teams combined */
  fleetByAssetType?: Record<string, FleetAssetTypeInfo>;
}

export interface AssetInfo {
  id: string;
  name: string;
  type: AssetType;
  nameplateMW: number;
  srmcPerMWh: number;
}

export interface GameStateSnapshot {
  gameId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  expectedTeamCount: number;
  roundConfig: RoundConfig | null;
  teams: TeamPublicInfo[];
  myTeam?: Team;
  myAssetDefs?: AssetInfo[];        // asset definitions for the team's current assets
  leaderboard: LeaderboardEntry[];
  biddingTimeRemaining: number;
  bidStatus: Record<string, boolean>;
  lastRoundResults?: RoundDispatchResult;
  lastRoundAnalysis?: RoundAnalysis;
  fleetInfo?: FleetInfo;
  /** Full scenario event objects for the current round (resolved from string IDs) */
  activeScenarioEventDetails?: ScenarioEvent[];
  /** Whether the bidding guardrail (warn on too much $0 capacity) is active */
  biddingGuardrailEnabled?: boolean;
  /** Config for the next round (used by Round Summary to preview what's coming) */
  nextRoundConfig?: RoundConfig | null;
  /** Active surprise events — only included in HOST snapshots, not team snapshots */
  activeSurpriseEvents?: string[];
  /** Pre-surprise demand values for comparison (set when surprises modify demand) */
  preSurpriseDemandMW?: Record<string, number>;
  /** Dramatic incident reports for teams (vague descriptions, not event names) */
  surpriseIncidents?: SurpriseIncident[];
}

export interface BiddingStrategy {
  id: BiddingStrategyType;
  name: string;
  description: string;
  shortDescription: string;
  generateBids: (
    assets: TeamAssetInstance[],
    assetDefs: Map<string, AssetDefinition>,
    roundConfig: RoundConfig,
  ) => AssetBid[];
}

export interface BalancingResult {
  teamId: string;
  teamName: string;
  assetId: string;
  assetName: string;
  reductionPercent: number;
  description: string;
}

// ---- Round Analysis ----

/**
 * Overall round analysis shown to all players after dispatch.
 * Explains what happened, who set the price, and what strategies worked.
 */
export interface RoundAnalysis {
  roundNumber: number;
  roundName: string;

  /** High-level narrative of how the round played out */
  overallSummary: string;

  /** Per-period analysis of who set the price and why */
  periodAnalyses: PeriodAnalysis[];

  /** What the collectively optimal outcome would have been */
  collectiveInsight: string;

  /** Per-team analysis with personalised feedback */
  teamAnalyses: TeamAnalysis[];

  /** Key takeaways for the round */
  keyTakeaways: string[];
}

export interface PeriodAnalysis {
  timePeriod: TimePeriod;
  clearingPriceMWh: number;
  demandMW: number;
  totalDispatchedMW: number;
  reserveMarginPercent: number;

  /** Who set the price — team name and asset */
  priceSetterTeam: string;
  priceSetterAsset: string;
  priceSetterBidPrice: number;

  /** Plain-English explanation of why prices were what they were */
  priceExplanation: string;

  /** Supply/demand narrative */
  supplyDemandNarrative: string;
}

export interface TeamAnalysis {
  teamId: string;
  teamName: string;
  color: string;
  rank: number;
  roundProfit: number;
  cumulativeProfit: number;

  /** What this team did well */
  strengths: string[];

  /** What this team could improve */
  improvements: string[];

  /** Specific advice for the next round */
  nextRoundAdvice: string;

  /** How each asset performed for this team */
  assetPerformance: AssetPerformanceSummary[];

  /** Comparison to other teams' strategies */
  competitivePosition: string;
}

export interface AssetPerformanceSummary {
  assetName: string;
  assetType: AssetType;
  averageBidPrice: number;
  totalDispatchedMW: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  wasDispatched: boolean;
  /** Brief assessment */
  assessment: string;
}

// ---- Server to Client Events ----
export interface ServerToClientEvents {
  'game:state_update': (state: GameStateSnapshot) => void;
  'game:phase_changed': (phase: GamePhase) => void;
  'game:round_started': (data: { roundConfig: RoundConfig; teamAssets: TeamAssetInstance[] }) => void;
  'game:round_results': (results: RoundDispatchResult) => void;
  'game:finished': (leaderboard: LeaderboardEntry[]) => void;
  'team:joined': (team: TeamPublicInfo) => void;
  'team:bid_acknowledged': (data: { teamId: string; isComplete: boolean }) => void;
  'team:reconnected': (data: { teamId: string; teamName: string; gameId: string }) => void;
  'team:assets_updated': (data: { teamId: string; assets: TeamAssetInstance[] }) => void;
  'bidding:time_remaining': (seconds: number) => void;
  'bidding:all_submitted': () => void;
  'scenario:event_triggered': (event: ScenarioEvent) => void;
  'scenario:balancing_applied': (data: BalancingResult) => void;
  'host:bid_status': (data: Record<string, boolean>) => void;
  'host:team_screen_data': (data: GameStateSnapshot) => void;
  'host:surprises_applied': (data: { appliedIds: string[]; updatedDemand: Record<string, number> }) => void;
  'error': (message: string) => void;
}

// ---- Client to Server Events ----
export interface ClientToServerEvents {
  'host:create_game': (config: { mode: GameMode; teamCount: number; balancingEnabled: boolean; biddingGuardrailEnabled: boolean; assetConfig?: AssetConfigOverrides; assetVariation?: boolean }) => void;
  'host:start_round': () => void;
  'host:start_bidding': () => void;
  'host:end_bidding': () => void;
  'host:show_results': () => void;
  'host:next_round': () => void;
  'host:trigger_event': (eventId: string) => void;
  'host:apply_surprises': (eventIds: string[]) => void;
  'host:pause_game': () => void;
  'host:resume_game': () => void;
  'host:reset_game': () => void;
  'host:adjust_timer': (seconds: number) => void;
  'host:set_demand': (demand: Record<string, number>) => void;
  'host:view_team_screen': (data: { teamId: string }) => void;
  'team:join': (data: { teamName: string; gameId: string }) => void;
  'team:reconnect': (data: { teamId: string; gameId: string }) => void;
  'team:submit_bids': (submission: TeamBidSubmission) => void;
  'team:request_state': () => void;
}
