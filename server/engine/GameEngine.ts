import { v4 as uuidv4 } from 'uuid';
import type {
  AssetBid, AssetConfigOverrides, AssetDefinition, AssetInfo, AssetType, BalancingResult, FleetAssetTypeInfo, FleetInfo, GameConfig,
  GameMode, GamePhase, GameState, LeaderboardEntry, RoundAnalysis, RoundConfig,
  RoundDispatchResult, ScenarioEffect, ScenarioEvent, Season, SurpriseIncident,
  Team, TeamAssetInstance, TeamBidSubmission, TeamPublicInfo,
  TimePeriod, TimePeriodDispatchResult, GameStateSnapshot,
} from '../../shared/types.ts';
import { TEAM_COLORS, TIME_PERIOD_HOURS } from '../../shared/types.ts';
import { dispatchTimePeriod } from './MeritOrderDispatch.ts';
import { calculateTeamResults } from './ProfitCalculator.ts';
import { analyzeRound } from './RoundAnalyzer.ts';
import {
  createAssetDefinitionsForTeam, getAvailableAssets,
  getWindCapacityFactor, getSolarCapacityFactor,
} from '../data/assets.ts';
import { generateDemandForRound } from '../data/demand-profiles.ts';
import { getScenarioEventsForRound, SCENARIO_EVENTS } from '../data/scenarios.ts';
import { getSurpriseEvent } from '../data/surprises.ts';
import { fullGameRounds } from '../data/rounds/full-game.ts';
import { quickGameRounds } from '../data/rounds/quick-game.ts';
import { experiencedReplayRounds } from '../data/rounds/experienced-replay.ts';
import { beginnerRounds } from '../data/rounds/beginner.ts';
import { progressiveLearningRounds } from '../data/rounds/progressive-learning.ts';

/**
 * Generate a dramatic, vague incident report for teams.
 * Teams see the symptoms but NOT the cause — mimics real-world market uncertainty.
 */
function generateIncidentReport(eventId: string): SurpriseIncident | null {
  const INCIDENT_REPORTS: Record<string, SurpriseIncident> = {
    generator_trip: {
      icon: '🚨',
      headline: 'BREAKING: Unplanned generator outage reported',
      description: 'AEMO has received notification of an unplanned generating unit trip in the NEM. The affected unit has been derated significantly. Market participants should be aware that available supply has tightened — capacity margins are narrower than forecast. Expect supply-demand balance to be tighter than briefed.',
      category: 'supply',
    },
    demand_surge_heat: {
      icon: '🌡️',
      headline: 'ALERT: Temperature forecast revised sharply upward',
      description: 'The Bureau of Meteorology has revised today\'s temperature forecast significantly higher than earlier predictions. Air conditioning load is surging across the network. Grid demand during peak periods is now tracking well above the original forecast. Traders should factor higher-than-expected demand into their bidding.',
      category: 'demand',
    },
    demand_drop_solar: {
      icon: '☀️',
      headline: 'UPDATE: Rooftop solar output exceeding forecast',
      description: 'Clear skies and optimal conditions mean rooftop PV generation across the network is substantially higher than forecast. Grid-level demand during daytime periods has dropped below original projections. Behind-the-meter solar is eating into grid demand — expect lower clearing prices during daylight hours.',
      category: 'demand',
    },
    renewable_drought: {
      icon: '🌫️',
      headline: 'WARNING: Renewable output collapsing across the network',
      description: 'A persistent high-pressure system has brought overcast skies and calm conditions across the NEM. Wind farm output has plummeted to a fraction of forecast capacity, and solar generation is well below expectations. Dispatchable generators will need to fill the gap. This is shaping up to be a tight day.',
      category: 'supply',
    },
    fuel_price_spike: {
      icon: '📊',
      headline: 'MARKET ALERT: International gas prices spike overnight',
      description: 'Asian spot LNG prices surged overnight following supply disruptions in the global market. Domestic gas generators are now facing substantially higher fuel costs than anticipated when they filed their initial bids. Gas-fired generators\' true cost of production has increased materially — check your marginal cost assumptions.',
      category: 'cost',
    },
    interconnector_outage: {
      icon: '⚡',
      headline: 'CRITICAL: Interconnector failure — region now islanded',
      description: 'AEMO has declared a major interconnector outage, severing the link to a neighbouring region. All demand must now be met by local generation — there is no import capacity available. Total system demand is effectively higher than forecast as previously imported energy must be replaced. All generators should prepare for elevated dispatch requirements.',
      category: 'demand',
    },
  };

  return INCIDENT_REPORTS[eventId] || null;
}

export class GameEngine {
  private games = new Map<string, GameState>();
  private assetDefs = new Map<string, Map<string, AssetDefinition>>(); // gameId -> (assetId -> def)
  private biddingTimers = new Map<string, NodeJS.Timeout>();
  private roundAnalyses = new Map<string, RoundAnalysis[]>(); // gameId -> analyses per round

  createGame(
    mode: GameMode,
    teamCount: number,
    balancingEnabled: boolean,
    biddingGuardrailEnabled: boolean = true,
    assetConfig?: AssetConfigOverrides,
    assetVariation?: boolean,
  ): GameState {
    const gameId = uuidv4().slice(0, 8);
    const rounds = this.getRoundsForMode(mode);

    const config: GameConfig = {
      mode,
      teamCount: Math.min(15, Math.max(2, teamCount)),
      rounds,
      priceCapMWh: 20000,
      priceFloorMWh: -1000,
      balancingEnabled,
      balancingThresholdPercent: 40,
      defaultBiddingTimeSeconds: 240,
      biddingGuardrailEnabled,
      assetConfig,
      assetVariation: assetVariation ?? true,
    };

    const state: GameState = {
      id: gameId,
      config,
      phase: 'lobby',
      currentRound: 0,
      teams: [],
      roundResults: [],
      activeScenarioEvents: [],
      activeSurpriseEvents: [],
      preSurpriseDemandMW: null,
      surpriseIncidents: [],
      currentBids: new Map(),
      biddingTimeRemaining: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.games.set(gameId, state);
    this.assetDefs.set(gameId, new Map());
    this.roundAnalyses.set(gameId, []);

    return state;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  getFirstGame(): GameState | undefined {
    for (const game of this.games.values()) {
      return game;
    }
    return undefined;
  }

  addTeam(gameId: string, teamName: string, socketId: string): Team | { error: string } | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    if (game.teams.length >= game.config.teamCount) return null;
    if (game.phase !== 'lobby') return null;

    // Check for duplicate team names (case-insensitive)
    const nameLower = teamName.trim().toLowerCase();
    if (game.teams.some(t => t.name.trim().toLowerCase() === nameLower)) {
      return { error: 'Team name already taken. Please choose a different name.' };
    }

    const teamIndex = game.teams.length;
    const team: Team = {
      id: uuidv4().slice(0, 8),
      name: teamName,
      color: TEAM_COLORS[teamIndex % TEAM_COLORS.length],
      socketId,
      isConnected: true,
      assets: [],
      cumulativeProfitDollars: 0,
      roundResults: [],
      rank: teamIndex + 1,
    };

    // Create asset definitions for this team (with optional custom overrides)
    const teamAssets = createAssetDefinitionsForTeam(
      teamIndex,
      game.config.assetConfig,
      game.config.assetVariation ?? true,
      game.config.teamCount,
    );
    const gameDefs = this.assetDefs.get(gameId)!;
    for (const asset of teamAssets) {
      gameDefs.set(asset.id, asset);
    }

    game.teams.push(team);
    game.updatedAt = Date.now();

    return team;
  }

  reconnectTeam(gameId: string, teamId: string, socketId: string): Team | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return null;

    team.socketId = socketId;
    team.isConnected = true;
    game.updatedAt = Date.now();

    return team;
  }

  disconnectTeam(gameId: string, socketId: string): string | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const team = game.teams.find(t => t.socketId === socketId);
    if (!team) return null;

    team.isConnected = false;
    team.socketId = null;
    game.updatedAt = Date.now();

    return team.id;
  }

  startRound(gameId: string): RoundConfig | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.currentRound++;
    if (game.currentRound > game.config.rounds.length) return null;

    const roundConfig = game.config.rounds[game.currentRound - 1];
    game.phase = 'briefing';
    game.currentBids = new Map();
    game.biddingTimeRemaining = roundConfig.biddingTimeLimitSeconds;
    game.activeSurpriseEvents = [];  // Reset surprise events for the new round
    game.preSurpriseDemandMW = null;
    game.surpriseIncidents = [];

    // Assign assets for this round
    this.assignAssetsForRound(game, roundConfig);

    // Apply scenario events
    this.applyScenarioEvents(game, roundConfig);

    // Compute actual fleet capacity per period (accounting for capacity factors)
    const fleetCapPerPeriod = this.computeFleetCapacityPerPeriod(game, roundConfig);

    // Generate demand (fill in the baseDemandMW values)
    const scenarioMultiplier = this.getScenarioDemandMultipliers(game);
    const demand = generateDemandForRound(
      game.teams.length,
      roundConfig.season,
      roundConfig.timePeriods,
      roundConfig.demandVariability,
      game.currentRound,
      scenarioMultiplier,
      fleetCapPerPeriod,
    );
    roundConfig.baseDemandMW = demand;

    game.updatedAt = Date.now();
    return roundConfig;
  }

  startBidding(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    game.phase = 'bidding';
    game.updatedAt = Date.now();
    return true;
  }

  submitBids(gameId: string, submission: TeamBidSubmission): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'bidding') return false;

    game.currentBids.set(submission.teamId, submission);
    game.updatedAt = Date.now();

    return true;
  }

  getBidStatus(gameId: string): Record<string, boolean> {
    const game = this.games.get(gameId);
    if (!game) return {};

    const status: Record<string, boolean> = {};
    for (const team of game.teams) {
      status[team.id] = game.currentBids.has(team.id);
    }
    return status;
  }

  allBidsSubmitted(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    return game.teams.every(t => game.currentBids.has(t.id));
  }

  tickTimer(gameId: string): number {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'bidding') return 0;

    game.biddingTimeRemaining = Math.max(0, game.biddingTimeRemaining - 1);
    return game.biddingTimeRemaining;
  }

  runDispatch(gameId: string): RoundDispatchResult | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.phase = 'dispatching';
    const roundConfig = game.config.rounds[game.currentRound - 1];
    if (!roundConfig) return null;

    const gameDefs = this.assetDefs.get(gameId)!;
    const teamNames = new Map(game.teams.map(t => [t.id, t.name]));

    // Generate default bids for teams that didn't submit
    this.generateDefaultBids(game, roundConfig, gameDefs);

    // Run dispatch for each time period
    const periodResults: TimePeriodDispatchResult[] = [];

    for (const period of roundConfig.timePeriods) {
      // Collect all bids for this period
      const periodBids: AssetBid[] = [];
      for (const submission of game.currentBids.values()) {
        const bidsForPeriod = submission.bids.filter(b => b.timePeriod === period);
        periodBids.push(...bidsForPeriod);
      }

      const demandMW = roundConfig.baseDemandMW[period] || 0;

      const result = dispatchTimePeriod(
        periodBids,
        demandMW,
        period as TimePeriod,
        game.config.priceCapMWh,
        game.config.priceFloorMWh,
        gameDefs,
        teamNames,
      );

      periodResults.push(result);
    }

    // Calculate team profits
    const teamResults = game.teams.map(team =>
      calculateTeamResults(
        team.id,
        team.name,
        periodResults,
        roundConfig.periodDurations,
        gameDefs,
      )
    );

    // Update cumulative profits
    for (const result of teamResults) {
      const team = game.teams.find(t => t.id === result.teamId);
      if (team) {
        team.cumulativeProfitDollars += result.totalProfitDollars;
        team.roundResults.push(result);
      }
    }

    // Update rankings
    const sorted = [...game.teams].sort(
      (a, b) => b.cumulativeProfitDollars - a.cumulativeProfitDollars
    );
    sorted.forEach((team, index) => {
      team.rank = index + 1;
    });

    const roundResult: RoundDispatchResult = {
      roundNumber: game.currentRound,
      periodResults,
      teamResults,
    };

    game.roundResults.push(roundResult);
    game.phase = 'results';
    game.updatedAt = Date.now();

    // Generate round analysis
    const gameDefs2 = this.assetDefs.get(gameId)!;
    const analysis = analyzeRound(game, roundConfig, roundResult, gameDefs2);
    const analyses = this.roundAnalyses.get(gameId) || [];
    analyses.push(analysis);
    this.roundAnalyses.set(gameId, analyses);

    return roundResult;
  }

  applyBalancing(gameId: string): BalancingResult[] {
    const game = this.games.get(gameId);
    if (!game || !game.config.balancingEnabled) return [];

    const avgProfit = game.teams.reduce(
      (sum, t) => sum + t.cumulativeProfitDollars, 0
    ) / game.teams.length;

    if (avgProfit <= 0) return [];

    const threshold = avgProfit * (1 + game.config.balancingThresholdPercent / 100);
    const results: BalancingResult[] = [];
    const gameDefs = this.assetDefs.get(gameId)!;

    for (const team of game.teams) {
      if (team.cumulativeProfitDollars > threshold) {
        // Find largest non-renewable asset to affect
        const targetAsset = team.assets
          .filter(a => {
            const def = gameDefs.get(a.assetDefinitionId);
            return def && !['wind', 'solar'].includes(def.type) && !a.isForceOutage;
          })
          .sort((a, b) => b.currentAvailableMW - a.currentAvailableMW)[0];

        if (targetAsset) {
          const reductionPercent = 30 + Math.random() * 30;
          targetAsset.currentAvailableMW *= (1 - reductionPercent / 100);
          targetAsset.currentAvailableMW = Math.round(targetAsset.currentAvailableMW);
          targetAsset.isForceOutage = true;

          const def = gameDefs.get(targetAsset.assetDefinitionId);
          results.push({
            teamId: team.id,
            teamName: team.name,
            assetId: targetAsset.assetDefinitionId,
            assetName: def?.name || 'Unknown',
            reductionPercent: Math.round(reductionPercent),
            description: `Unexpected maintenance at ${def?.name || 'your plant'} - capacity reduced by ${Math.round(reductionPercent)}% for next round.`,
          });
        }
      }
    }

    game.updatedAt = Date.now();
    return results;
  }

  advanceToNextPhase(gameId: string): GamePhase | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    if (game.currentRound >= game.config.rounds.length && game.phase === 'results') {
      game.phase = 'final';
    }

    game.updatedAt = Date.now();
    return game.phase;
  }

  isGameFinished(gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;
    return game.currentRound >= game.config.rounds.length && game.phase === 'results';
  }

  getLeaderboard(gameId: string): LeaderboardEntry[] {
    const game = this.games.get(gameId);
    if (!game) return [];

    const sorted = [...game.teams].sort(
      (a, b) => b.cumulativeProfitDollars - a.cumulativeProfitDollars
    );

    return sorted.map((team, index) => {
      const lastRoundProfit = team.roundResults.length > 0
        ? team.roundResults[team.roundResults.length - 1].totalProfitDollars
        : 0;

      const prevRank = team.rank;
      const newRank = index + 1;

      return {
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        rank: newRank,
        cumulativeProfitDollars: Math.round(team.cumulativeProfitDollars * 100) / 100,
        lastRoundProfitDollars: Math.round(lastRoundProfit * 100) / 100,
        trend: newRank < prevRank ? 'up' : newRank > prevRank ? 'down' : 'same',
      };
    });
  }

  getSnapshot(gameId: string, forTeamId?: string): GameStateSnapshot | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const roundConfig = game.currentRound > 0
      ? game.config.rounds[game.currentRound - 1]
      : null;

    // Next round config for Round Summary "preview" slide
    const nextRoundConfig = game.currentRound < game.config.rounds.length
      ? game.config.rounds[game.currentRound]   // currentRound is 1-indexed, so [currentRound] = next
      : null;

    const teams: TeamPublicInfo[] = game.teams.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      isConnected: t.isConnected,
      rank: t.rank,
      cumulativeProfitDollars: Math.round(t.cumulativeProfitDollars * 100) / 100,
    }));

    const myTeam = forTeamId ? game.teams.find(t => t.id === forTeamId) : undefined;

    // Build asset definitions for the requesting team
    let myAssetDefs: AssetInfo[] | undefined;
    if (myTeam) {
      const gameDefs = this.assetDefs.get(gameId);
      if (gameDefs) {
        myAssetDefs = myTeam.assets.map(a => {
          const def = gameDefs.get(a.assetDefinitionId);
          return def ? {
            id: def.id,
            name: def.name,
            type: def.type,
            nameplateMW: def.nameplateMW,
            srmcPerMWh: def.srmcPerMWh,
          } : {
            id: a.assetDefinitionId,
            name: a.assetDefinitionId,
            type: 'coal' as AssetType,
            nameplateMW: a.currentAvailableMW,
            srmcPerMWh: 0,
          };
        });
      }
    }

    return {
      gameId: game.id,
      phase: game.phase,
      currentRound: game.currentRound,
      totalRounds: game.config.rounds.length,
      expectedTeamCount: game.config.teamCount,
      roundConfig,
      teams,
      myTeam: myTeam ? { ...myTeam } : undefined,
      myAssetDefs,
      leaderboard: this.getLeaderboard(gameId),
      biddingTimeRemaining: game.biddingTimeRemaining,
      bidStatus: this.getBidStatus(gameId),
      lastRoundResults: game.roundResults.length > 0
        ? game.roundResults[game.roundResults.length - 1]
        : undefined,
      lastRoundAnalysis: this.getLastRoundAnalysis(gameId),
      fleetInfo: this.getFleetInfo(gameId),
      activeScenarioEventDetails: game.activeScenarioEvents.length > 0
        ? game.activeScenarioEvents
        : undefined,
      biddingGuardrailEnabled: game.config.biddingGuardrailEnabled,
      nextRoundConfig,
      // Only include surprise events in host snapshot (no forTeamId)
      activeSurpriseEvents: !forTeamId && game.activeSurpriseEvents.length > 0
        ? game.activeSurpriseEvents
        : undefined,
      // Surprise incident reports and pre-surprise demand (for BOTH host and team)
      preSurpriseDemandMW: game.preSurpriseDemandMW || undefined,
      surpriseIncidents: game.surpriseIncidents.length > 0
        ? game.surpriseIncidents
        : undefined,
      // Historical clearing prices from all completed rounds
      historicalClearingPrices: game.roundResults.map((rr, idx) => ({
        roundNumber: rr.roundNumber,
        roundName: game.config.rounds[idx]?.name || `Round ${rr.roundNumber}`,
        prices: Object.fromEntries(
          rr.periodResults.map(pr => [pr.timePeriod, pr.clearingPriceMWh])
        ),
      })),
    };
  }

  getAssetDefs(gameId: string): Map<string, AssetDefinition> {
    return this.assetDefs.get(gameId) || new Map();
  }

  getLastRoundAnalysis(gameId: string): RoundAnalysis | undefined {
    const analyses = this.roundAnalyses.get(gameId);
    if (!analyses || analyses.length === 0) return undefined;
    return analyses[analyses.length - 1];
  }

  /**
   * Compute total fleet generation capacity per period, demand, and demand as % of fleet.
   * Takes into account renewable capacity factors for the current round's season.
   */
  getFleetInfo(gameId: string): FleetInfo | undefined {
    const game = this.games.get(gameId);
    if (!game || game.currentRound === 0) return undefined;

    const roundConfig = game.config.rounds[game.currentRound - 1];
    if (!roundConfig) return undefined;

    const gameDefs = this.assetDefs.get(gameId)!;
    const totalFleetMW: Record<string, number> = {};
    const demandMW: Record<string, number> = {};
    const demandAsPercentOfFleet: Record<string, number> = {};

    for (const period of roundConfig.timePeriods) {
      let periodFleetMW = 0;

      for (const team of game.teams) {
        for (const asset of team.assets) {
          const def = gameDefs.get(asset.assetDefinitionId);
          if (!def) continue;

          let availableMW = asset.currentAvailableMW;

          // Apply capacity factors for renewables
          if (def.type === 'wind') {
            availableMW = Math.round(availableMW * getWindCapacityFactor(roundConfig.season, period as TimePeriod));
          } else if (def.type === 'solar') {
            availableMW = Math.round(availableMW * getSolarCapacityFactor(roundConfig.season, period as TimePeriod));
          }

          periodFleetMW += availableMW;
        }
      }

      totalFleetMW[period] = periodFleetMW;
      demandMW[period] = roundConfig.baseDemandMW[period] || 0;
      demandAsPercentOfFleet[period] = periodFleetMW > 0
        ? Math.round((demandMW[period] / periodFleetMW) * 1000) / 10
        : 0;
    }

    // Build per-asset-type fleet breakdown
    const typeMap = new Map<AssetType, {
      nameplateMW: number;
      availableMW: Record<string, number>;
      teamCount: number;
      srmcMin: number;
      srmcMax: number;
    }>();

    for (const team of game.teams) {
      for (const asset of team.assets) {
        const def = gameDefs.get(asset.assetDefinitionId);
        if (!def) continue;

        let entry = typeMap.get(def.type);
        if (!entry) {
          entry = { nameplateMW: 0, availableMW: {}, teamCount: 0, srmcMin: Infinity, srmcMax: -Infinity };
          typeMap.set(def.type, entry);
        }

        entry.nameplateMW += def.nameplateMW;
        entry.teamCount += 1;
        if (def.srmcPerMWh > 0) {
          entry.srmcMin = Math.min(entry.srmcMin, def.srmcPerMWh);
          entry.srmcMax = Math.max(entry.srmcMax, def.srmcPerMWh);
        } else {
          entry.srmcMin = Math.min(entry.srmcMin, 0);
          entry.srmcMax = Math.max(entry.srmcMax, 0);
        }

        // Compute per-period available MW
        for (const period of roundConfig.timePeriods) {
          let avail = asset.currentAvailableMW;
          if (def.type === 'wind') {
            avail = Math.round(avail * getWindCapacityFactor(roundConfig.season, period as TimePeriod));
          } else if (def.type === 'solar') {
            avail = Math.round(avail * getSolarCapacityFactor(roundConfig.season, period as TimePeriod));
          }
          entry.availableMW[period] = (entry.availableMW[period] || 0) + avail;
        }
      }
    }

    const fleetByAssetType: Record<string, FleetAssetTypeInfo> = {};
    for (const [type, entry] of typeMap) {
      fleetByAssetType[type] = {
        nameplateMW: entry.nameplateMW,
        availableMW: entry.availableMW,
        teamCount: entry.teamCount,
        srmcRange: [
          entry.srmcMin === Infinity ? 0 : entry.srmcMin,
          entry.srmcMax === -Infinity ? 0 : entry.srmcMax,
        ],
        isNew: roundConfig.newAssetsUnlocked.includes(type),
      };
    }

    return { totalFleetMW, demandMW, demandAsPercentOfFleet, fleetByAssetType };
  }

  /**
   * Allow the host to override demand values for the current round.
   * `demand` is a Record<period, MW> with the new demand values.
   */
  setDemand(gameId: string, demand: Record<string, number>): boolean {
    const game = this.games.get(gameId);
    if (!game || game.currentRound === 0) return false;

    const roundConfig = game.config.rounds[game.currentRound - 1];
    if (!roundConfig) return false;

    for (const [period, mw] of Object.entries(demand)) {
      if (roundConfig.timePeriods.includes(period as TimePeriod)) {
        roundConfig.baseDemandMW[period] = Math.max(0, Math.round(mw));
      }
    }

    game.updatedAt = Date.now();
    return true;
  }

  /**
   * Apply host-triggered surprise events before bidding opens.
   * Modifies demand, asset availability, and/or SRMC in-place.
   * Returns a summary for the host and the updated demand values.
   */
  applySurprises(
    gameId: string,
    eventIds: string[],
  ): { applied: string[]; summaries: string[]; updatedDemand: Record<string, number> } | null {
    const game = this.games.get(gameId);
    if (!game || game.currentRound === 0) return null;

    // Only allow during briefing phase (before bidding opens)
    if (game.phase !== 'briefing') return null;

    const roundConfig = game.config.rounds[game.currentRound - 1];
    if (!roundConfig) return null;

    const gameDefs = this.assetDefs.get(gameId);
    if (!gameDefs) return null;

    // Store pre-surprise demand for comparison
    game.preSurpriseDemandMW = { ...roundConfig.baseDemandMW };

    const applied: string[] = [];
    const summaries: string[] = [];

    for (const eventId of eventIds) {
      const event = getSurpriseEvent(eventId);
      if (!event) continue;

      const summary = event.apply(game, roundConfig, gameDefs);
      applied.push(eventId);
      summaries.push(summary);
    }

    // Store which surprises are active (for host snapshot only)
    game.activeSurpriseEvents = applied;

    // Generate dramatic incident reports for teams (vague — no event names)
    game.surpriseIncidents = applied.map(id => generateIncidentReport(id)).filter(Boolean) as SurpriseIncident[];

    game.updatedAt = Date.now();

    return {
      applied,
      summaries,
      updatedDemand: { ...roundConfig.baseDemandMW },
    };
  }

  resetGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    game.phase = 'lobby';
    game.currentRound = 0;
    game.roundResults = [];
    game.activeScenarioEvents = [];
    game.activeSurpriseEvents = [];
    game.preSurpriseDemandMW = null;
    game.surpriseIncidents = [];
    game.currentBids = new Map();
    game.biddingTimeRemaining = 0;

    for (const team of game.teams) {
      team.cumulativeProfitDollars = 0;
      team.roundResults = [];
      team.assets = [];
      team.rank = game.teams.indexOf(team) + 1;
    }

    game.updatedAt = Date.now();
  }

  // ---- Private helpers ----

  private getRoundsForMode(mode: GameMode): RoundConfig[] {
    switch (mode) {
      case 'beginner': return beginnerRounds;
      case 'quick': return quickGameRounds;
      case 'full': return fullGameRounds;
      case 'experienced': return experiencedReplayRounds;
      case 'progressive': return progressiveLearningRounds;
    }
  }

  /**
   * Compute total fleet generation capacity per period for all teams,
   * taking into account renewable capacity factors for the season.
   * Used so demand generation can target a % of actual fleet capacity.
   */
  private computeFleetCapacityPerPeriod(
    game: GameState,
    roundConfig: RoundConfig,
  ): Record<string, number> {
    const gameDefs = this.assetDefs.get(game.id)!;
    const result: Record<string, number> = {};

    for (const period of roundConfig.timePeriods) {
      let totalMW = 0;

      for (const team of game.teams) {
        for (const asset of team.assets) {
          const def = gameDefs.get(asset.assetDefinitionId);
          if (!def) continue;

          let mw = asset.currentAvailableMW;

          if (def.type === 'wind') {
            mw = Math.round(mw * getWindCapacityFactor(roundConfig.season, period as TimePeriod));
          } else if (def.type === 'solar') {
            mw = Math.round(mw * getSolarCapacityFactor(roundConfig.season, period as TimePeriod));
          }

          totalMW += mw;
        }
      }

      result[period] = totalMW;
    }

    return result;
  }

  private assignAssetsForRound(game: GameState, roundConfig: RoundConfig): void {
    const gameDefs = this.assetDefs.get(game.id)!;

    for (let i = 0; i < game.teams.length; i++) {
      const team = game.teams[i];
      const allTeamAssets = createAssetDefinitionsForTeam(
        i,
        game.config.assetConfig,
        game.config.assetVariation ?? true,
        game.config.teamCount,
      );
      const available = getAvailableAssets(allTeamAssets, game.currentRound, game.config.mode);

      // Store asset defs
      for (const asset of allTeamAssets) {
        gameDefs.set(asset.id, asset);
      }

      // Create team asset instances
      team.assets = available.map(assetDef => {
        // Check if this asset already has an instance (preserve outage state)
        const existing = team.assets.find(a => a.assetDefinitionId === assetDef.id);

        if (existing && !existing.isForceOutage) {
          return {
            ...existing,
            currentAvailableMW: assetDef.nameplateMW,
          };
        }

        if (existing && existing.isForceOutage) {
          // Restore after one round of outage
          return {
            assetDefinitionId: assetDef.id,
            teamId: team.id,
            currentAvailableMW: assetDef.nameplateMW,
            isForceOutage: false,
            currentStorageMWh: assetDef.maxStorageMWh ? assetDef.maxStorageMWh * 0.5 : undefined,
            maxStorageMWh: assetDef.maxStorageMWh,
          };
        }

        return {
          assetDefinitionId: assetDef.id,
          teamId: team.id,
          currentAvailableMW: assetDef.nameplateMW,
          isForceOutage: false,
          currentStorageMWh: assetDef.maxStorageMWh ? assetDef.maxStorageMWh * 0.5 : undefined,
          maxStorageMWh: assetDef.maxStorageMWh,
        };
      });
    }
  }

  private applyScenarioEvents(game: GameState, roundConfig: RoundConfig): void {
    const events = getScenarioEventsForRound(game.currentRound, roundConfig.activeScenarioEvents);
    game.activeScenarioEvents = events;
    const gameDefs = this.assetDefs.get(game.id)!;

    for (const event of events) {
      for (const effect of event.effects) {
        this.applyEffect(game, effect, gameDefs, event.targetTeamIds);
      }
    }
  }

  private applyEffect(
    game: GameState,
    effect: ScenarioEffect,
    gameDefs: Map<string, AssetDefinition>,
    targetTeamIds?: string[]
  ): void {
    const teams = targetTeamIds
      ? game.teams.filter(t => targetTeamIds.includes(t.id))
      : game.teams;

    switch (effect.type) {
      case 'modify_asset_availability':
        for (const team of teams) {
          for (const asset of team.assets) {
            const def = gameDefs.get(asset.assetDefinitionId);
            if (def && (!effect.targetAssetType || def.type === effect.targetAssetType)) {
              asset.currentAvailableMW = Math.round(
                asset.currentAvailableMW * (effect.multiplier || 1)
              );
            }
          }
        }
        break;

      case 'modify_srmc':
        // Modify the asset definitions temporarily
        for (const [id, def] of gameDefs) {
          if (!effect.targetAssetType || def.type === effect.targetAssetType) {
            if (effect.multiplier) {
              def.srmcPerMWh = Math.round(def.srmcPerMWh * effect.multiplier * 100) / 100;
            }
            if (effect.absoluteChange) {
              def.srmcPerMWh += effect.absoluteChange;
            }
          }
        }
        break;

      case 'add_carbon_cost':
        for (const [id, def] of gameDefs) {
          if (!effect.targetAssetType || def.type === effect.targetAssetType) {
            def.srmcPerMWh += effect.absoluteChange || 0;
          }
        }
        break;

      case 'force_outage':
        // Apply to random teams (or specific ones)
        const teamsForOutage = targetTeamIds ? teams : [teams[Math.floor(Math.random() * teams.length)]];
        for (const team of teamsForOutage) {
          const targetAsset = team.assets.find(a => {
            const def = gameDefs.get(a.assetDefinitionId);
            return def && (!effect.targetAssetType || def.type === effect.targetAssetType) && !a.isForceOutage;
          });
          if (targetAsset) {
            targetAsset.currentAvailableMW = Math.round(targetAsset.currentAvailableMW * 0.3);
            targetAsset.isForceOutage = true;
          }
        }
        break;

      // modify_demand and modify_capacity_factor are handled during demand generation
    }
  }

  private getScenarioDemandMultipliers(game: GameState): Record<string, number> {
    const multipliers: Record<string, number> = {};
    for (const event of game.activeScenarioEvents) {
      for (const effect of event.effects) {
        if (effect.type === 'modify_demand' && effect.targetTimePeriod && effect.multiplier) {
          multipliers[effect.targetTimePeriod] = (multipliers[effect.targetTimePeriod] || 1) * effect.multiplier;
        }
      }
    }
    return multipliers;
  }

  private generateDefaultBids(
    game: GameState,
    roundConfig: RoundConfig,
    gameDefs: Map<string, AssetDefinition>,
  ): void {
    for (const team of game.teams) {
      if (game.currentBids.has(team.id)) continue;

      // Auto-generate SRMC bids for teams that didn't submit
      const bids: AssetBid[] = [];

      for (const period of roundConfig.timePeriods) {
        for (const asset of team.assets) {
          const def = gameDefs.get(asset.assetDefinitionId);
          if (!def) continue;

          let availableMW = asset.currentAvailableMW;

          // Apply capacity factors for renewables
          if (def.type === 'wind') {
            availableMW = Math.round(availableMW * getWindCapacityFactor(roundConfig.season, period as TimePeriod));
          } else if (def.type === 'solar') {
            availableMW = Math.round(availableMW * getSolarCapacityFactor(roundConfig.season, period as TimePeriod));
          }

          if (availableMW <= 0) continue;

          // Default: bid everything at SRMC (or $0 for renewables)
          const bidPrice = def.type === 'wind' || def.type === 'solar' ? 0 : def.srmcPerMWh;

          bids.push({
            assetInstanceId: `${asset.assetDefinitionId}_${team.id}`,
            assetDefinitionId: asset.assetDefinitionId,
            teamId: team.id,
            timePeriod: period as TimePeriod,
            bands: [{ pricePerMWh: bidPrice, quantityMW: availableMW }],
            totalOfferedMW: availableMW,
            submittedAt: Date.now(),
          });
        }
      }

      game.currentBids.set(team.id, {
        teamId: team.id,
        roundNumber: game.currentRound,
        bids,
        isComplete: false, // Mark as auto-generated
      });
    }
  }
}
