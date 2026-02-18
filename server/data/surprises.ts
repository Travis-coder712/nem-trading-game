/**
 * Surprise Events — Host-triggered mid-round game mechanic toggles.
 *
 * These are secret modifications the game master can apply before bidding opens.
 * Teams see the effects (changed demand, outages, etc.) but NOT the reason.
 * Each event has an `apply` function that modifies game state in-place and
 * returns a human-readable summary of what changed.
 */
import type {
  GameState, RoundConfig, AssetType, TimePeriod,
  SurpriseEventDefinition,
} from '../../shared/types.ts';
import type { AssetDefinition } from './assets.ts';

export interface SurpriseEventDef extends SurpriseEventDefinition {
  /** Apply this surprise event to the game state. Returns a short summary of what was changed. */
  apply: (
    game: GameState,
    roundConfig: RoundConfig,
    gameDefs: Map<string, AssetDefinition>,
  ) => string;
}

/** Utility: random number in range [min, max] */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Utility: round to nearest integer */
function r(n: number): number {
  return Math.round(n);
}

// ═══════════════════════════════════════════════════════
//  SURPRISE EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════

export const SURPRISE_EVENTS: SurpriseEventDef[] = [
  // ─── 1. Random Generator Trip ────────────────────
  {
    id: 'generator_trip',
    name: 'Generator Trip',
    icon: '🔧',
    description: 'A random thermal generator (coal or gas) across a random team suffers a forced outage, losing ~70% of its capacity for this round.',
    impactSummary: 'Tightens supply by 200-500 MW. Affected team loses revenue. Other teams benefit from higher clearing prices.',
    category: 'supply',
    apply(game, roundConfig, gameDefs) {
      // Find all thermal assets across all teams
      const candidates: { teamName: string; teamIdx: number; assetIdx: number; assetId: string; mw: number; type: string }[] = [];
      for (let ti = 0; ti < game.teams.length; ti++) {
        const team = game.teams[ti];
        for (let ai = 0; ai < team.assets.length; ai++) {
          const asset = team.assets[ai];
          const def = gameDefs.get(asset.assetDefinitionId);
          if (!def) continue;
          if (['coal', 'gas_ccgt', 'gas_peaker'].includes(def.type) && !asset.isForceOutage) {
            candidates.push({
              teamName: team.name,
              teamIdx: ti,
              assetIdx: ai,
              assetId: asset.assetDefinitionId,
              mw: asset.currentAvailableMW,
              type: def.type,
            });
          }
        }
      }

      if (candidates.length === 0) return 'No thermal assets available for outage.';

      // Pick a random thermal asset
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const asset = game.teams[pick.teamIdx].assets[pick.assetIdx];
      const oldMW = asset.currentAvailableMW;
      asset.currentAvailableMW = r(oldMW * 0.3);
      asset.isForceOutage = true;

      const lostMW = oldMW - asset.currentAvailableMW;
      return `${pick.teamName}'s ${pick.type.replace('_', ' ')} tripped: lost ${lostMW} MW (${oldMW} → ${asset.currentAvailableMW} MW).`;
    },
  },

  // ─── 2. Demand Surge — Hot Day ───────────────────
  {
    id: 'demand_surge_heat',
    name: 'Demand Surge — Hot Day',
    icon: '📈',
    description: 'An unexpected heatwave means air conditioning load is higher than forecast. Demand increases 15-25% across afternoon & evening periods.',
    impactSummary: 'Tighter supply-demand balance, higher clearing prices. Peakers more likely to run. Benefits teams with spare capacity.',
    category: 'demand',
    apply(_game, roundConfig) {
      const mult = rand(1.15, 1.25);
      const changes: string[] = [];

      for (const period of roundConfig.timePeriods) {
        if (period === 'day_peak' || period === 'night_peak') {
          const oldMW = roundConfig.baseDemandMW[period] || 0;
          const newMW = r(oldMW * mult);
          roundConfig.baseDemandMW[period] = newMW;
          changes.push(`${period === 'day_peak' ? 'Afternoon' : 'Evening'}: ${oldMW} → ${newMW} MW (+${r((mult - 1) * 100)}%)`);
        }
      }

      return changes.length > 0
        ? `Heatwave demand surge (×${mult.toFixed(2)}): ${changes.join(', ')}.`
        : 'No peak periods to modify.';
    },
  },

  // ─── 3. Demand Drop — Rooftop Solar ──────────────
  {
    id: 'demand_drop_solar',
    name: 'Demand Drop — Rooftop Solar',
    icon: '📉',
    description: 'Unexpectedly sunny day means rooftop solar is higher than forecast, reducing grid demand 15-25% during daytime periods.',
    impactSummary: 'Loosens supply, pushes clearing prices down during daytime. Bad for daytime dispatch, good for battery charging.',
    category: 'demand',
    apply(_game, roundConfig) {
      const mult = rand(0.75, 0.85);
      const changes: string[] = [];

      for (const period of roundConfig.timePeriods) {
        if (period === 'day_offpeak' || period === 'day_peak') {
          const oldMW = roundConfig.baseDemandMW[period] || 0;
          const newMW = r(oldMW * mult);
          roundConfig.baseDemandMW[period] = newMW;
          changes.push(`${period === 'day_offpeak' ? 'Morning' : 'Afternoon'}: ${oldMW} → ${newMW} MW (${r((mult - 1) * 100)}%)`);
        }
      }

      return changes.length > 0
        ? `Rooftop solar surge (×${mult.toFixed(2)}): ${changes.join(', ')}.`
        : 'No daytime periods to modify.';
    },
  },

  // ─── 4. Renewable Drought (Dunkelflaute) ─────────
  {
    id: 'renewable_drought',
    name: 'Renewable Drought',
    icon: '🌫️',
    description: 'Overcast, still day — wind drops to 30% of expected output, solar to 40%. Thermal and storage assets become more valuable.',
    impactSummary: 'Removes significant renewable capacity. Thermal assets more valuable. Prices likely to rise across all periods.',
    category: 'supply',
    apply(game, _roundConfig, gameDefs) {
      let windLost = 0;
      let solarLost = 0;

      for (const team of game.teams) {
        for (const asset of team.assets) {
          const def = gameDefs.get(asset.assetDefinitionId);
          if (!def) continue;

          if (def.type === 'wind') {
            const oldMW = asset.currentAvailableMW;
            asset.currentAvailableMW = r(oldMW * 0.3);
            windLost += oldMW - asset.currentAvailableMW;
          } else if (def.type === 'solar') {
            const oldMW = asset.currentAvailableMW;
            asset.currentAvailableMW = r(oldMW * 0.4);
            solarLost += oldMW - asset.currentAvailableMW;
          }
        }
      }

      const parts: string[] = [];
      if (windLost > 0) parts.push(`Wind -${windLost} MW (to 30%)`);
      if (solarLost > 0) parts.push(`Solar -${solarLost} MW (to 40%)`);
      return parts.length > 0
        ? `Dunkelflaute: ${parts.join(', ')}.`
        : 'No renewable assets in the fleet.';
    },
  },

  // ─── 5. Fuel Price Spike ─────────────────────────
  {
    id: 'fuel_price_spike',
    name: 'Fuel Price Spike',
    icon: '⛽',
    description: 'International gas prices spike overnight. Gas CCGT and Gas Peaker marginal costs increase by 50%.',
    impactSummary: 'Gas becomes more expensive to run. Coal becomes relatively cheaper. Gas generators need higher prices to cover costs.',
    category: 'cost',
    apply(_game, _roundConfig, gameDefs) {
      const changes: string[] = [];

      for (const [id, def] of gameDefs) {
        if (def.type === 'gas_ccgt' || def.type === 'gas_peaker') {
          const oldSRMC = def.srmcPerMWh;
          def.srmcPerMWh = r(oldSRMC * 1.5);
          changes.push(`${def.name}: $${oldSRMC} → $${def.srmcPerMWh}/MWh`);
        }
      }

      return changes.length > 0
        ? `Gas fuel spike (+50% SRMC): ${changes.join(', ')}.`
        : 'No gas assets in the fleet.';
    },
  },

  // ─── 6. Interconnector Outage ────────────────────
  {
    id: 'interconnector_outage',
    name: 'Interconnector Outage',
    icon: '🔌',
    description: 'An interconnector to a neighbouring state fails. Local generation must cover ALL demand — demand increases 10-20% across ALL periods.',
    impactSummary: 'Universal demand increase, tighter supply across every period. Broad price increase expected.',
    category: 'demand',
    apply(_game, roundConfig) {
      const mult = rand(1.10, 1.20);
      const changes: string[] = [];

      for (const period of roundConfig.timePeriods) {
        const oldMW = roundConfig.baseDemandMW[period] || 0;
        const newMW = r(oldMW * mult);
        roundConfig.baseDemandMW[period] = newMW;
        changes.push(`${oldMW} → ${newMW}`);
      }

      return `Interconnector outage (×${mult.toFixed(2)}): all periods demand up — ${changes.join(', ')} MW.`;
    },
  },
];

/** Look up a surprise event by ID */
export function getSurpriseEvent(id: string): SurpriseEventDef | undefined {
  return SURPRISE_EVENTS.find(e => e.id === id);
}

/** Get the client-safe definitions (without apply functions) for sending to the host UI */
export function getSurpriseEventDefinitions(): SurpriseEventDefinition[] {
  return SURPRISE_EVENTS.map(({ id, name, icon, description, impactSummary, category }) => ({
    id, name, icon, description, impactSummary, category,
  }));
}
