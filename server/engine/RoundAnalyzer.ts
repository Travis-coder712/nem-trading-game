import type {
  AssetCategoryBreakdown, AssetDefinition, AssetPerformanceSummary, AssetType, GameState,
  PeriodAnalysis, RoundAnalysis, RoundConfig, RoundDispatchResult,
  EconomicWithholdingWarning, TeamAnalysis, TeamBidSubmission, TeamRoundResult, TimePeriod,
  TimePeriodDispatchResult,
} from '../../shared/types.ts';
import { TIME_PERIOD_SHORT_LABELS, ASSET_TYPE_LABELS, getAssetCategory } from '../../shared/types.ts';
import type { AssetCategory } from '../../shared/types.ts';

/** Format a dollar amount with commas for display in narratives (e.g. $1,234) */
function fmtDollars(v: number): string {
  return `$${Math.round(v).toLocaleString('en-AU')}`;
}

/** Format a number with commas (e.g. 1,234) */
function fmtNum(v: number): string {
  return Math.round(v).toLocaleString('en-AU');
}

/**
 * Generates a comprehensive round analysis after dispatch completes.
 * Provides both an overall summary (for the host/presentation screen)
 * and per-team personalised feedback.
 */
export function analyzeRound(
  game: GameState,
  roundConfig: RoundConfig,
  roundResult: RoundDispatchResult,
  assetDefs: Map<string, AssetDefinition>,
): RoundAnalysis {
  const periodAnalyses = roundResult.periodResults.map(pr =>
    analyzePeriod(pr, game, assetDefs)
  );

  const teamAnalyses = buildTeamAnalyses(
    game, roundConfig, roundResult, assetDefs, periodAnalyses,
  );

  const overallSummary = buildOverallSummary(
    roundConfig, roundResult, periodAnalyses, game,
  );

  const collectiveInsight = buildCollectiveInsight(
    roundResult, periodAnalyses, game, assetDefs,
  );

  const keyTakeaways = buildKeyTakeaways(
    roundConfig, roundResult, periodAnalyses, game,
  );

  const assetCategoryBreakdown = buildAssetCategoryBreakdown(
    game, roundResult, assetDefs,
  );

  const economicWithholdingWarnings = detectEconomicWithholding(
    game, roundResult, assetDefs,
  );

  return {
    roundNumber: roundConfig.roundNumber,
    roundName: roundConfig.name,
    overallSummary,
    periodAnalyses,
    collectiveInsight,
    teamAnalyses,
    keyTakeaways,
    assetCategoryBreakdown: assetCategoryBreakdown.length > 0 ? assetCategoryBreakdown : undefined,
    economicWithholdingWarnings: economicWithholdingWarnings.length > 0 ? economicWithholdingWarnings : undefined,
  };
}

// ---- Period Analysis ----

function analyzePeriod(
  pr: TimePeriodDispatchResult,
  game: GameState,
  assetDefs: Map<string, AssetDefinition>,
): PeriodAnalysis {
  const periodLabel = TIME_PERIOD_SHORT_LABELS[pr.timePeriod] || pr.timePeriod;

  // Find the marginal (price-setting) band
  const marginalBand = pr.meritOrderStack.find(b => b.isMarginal);

  const priceSetterTeam = marginalBand?.teamName || 'Unknown';
  const priceSetterAsset = marginalBand?.assetName || 'Unknown';
  const priceSetterBidPrice = marginalBand?.bidPriceMWh || 0;

  // Build price explanation
  let priceExplanation: string;
  if (pr.aemoInterventionTriggered) {
    priceExplanation = `AEMO INTERVENTION: Demand exceeded supply in the ${periodLabel}! The price hit the ${fmtDollars(pr.clearingPriceMWh)}/MWh cap, but AEMO activated emergency generation within 1 hour, restoring supply at ~${fmtDollars(pr.aemoRestoredPriceMWh || 0)}/MWh. Effective blended price for the period: ${fmtDollars(pr.aemoEffectivePriceMWh || 0)}/MWh.`;
  } else if (pr.clearingPriceMWh <= 0) {
    priceExplanation = `Prices went to ${fmtDollars(pr.clearingPriceMWh)}/MWh in the ${periodLabel}. Supply overwhelmed demand — there was ${fmtNum(pr.excessCapacityMW)} MW of excess capacity. Generators with high costs lost money being dispatched at these prices.`;
  } else if (pr.reserveMarginPercent < 10) {
    priceExplanation = `Very tight supply in the ${periodLabel} with only ${pr.reserveMarginPercent.toFixed(0)}% reserve margin. ${priceSetterTeam}'s ${priceSetterAsset} set the clearing price at ${fmtDollars(pr.clearingPriceMWh)}/MWh. With supply this tight, high bids were rewarded.`;
  } else if (pr.reserveMarginPercent > 50) {
    priceExplanation = `Plenty of spare capacity in the ${periodLabel} (${pr.reserveMarginPercent.toFixed(0)}% reserve margin). ${priceSetterTeam}'s ${priceSetterAsset} set the price at ${fmtDollars(pr.clearingPriceMWh)}/MWh. With excess supply, high bidders were not dispatched.`;
  } else {
    priceExplanation = `${priceSetterTeam}'s ${priceSetterAsset} was the marginal generator in the ${periodLabel}, setting the clearing price at ${fmtDollars(pr.clearingPriceMWh)}/MWh with a bid of ${fmtDollars(priceSetterBidPrice)}/MWh. Reserve margin was ${pr.reserveMarginPercent.toFixed(0)}%.`;
  }

  // Supply/demand narrative
  const supplyDemandNarrative = buildSupplyDemandNarrative(pr, periodLabel);

  return {
    timePeriod: pr.timePeriod,
    clearingPriceMWh: pr.clearingPriceMWh,
    demandMW: pr.demandMW,
    totalDispatchedMW: pr.totalDispatchedMW,
    reserveMarginPercent: pr.reserveMarginPercent,
    priceSetterTeam,
    priceSetterAsset,
    priceSetterBidPrice,
    priceExplanation,
    supplyDemandNarrative,
  };
}

function buildSupplyDemandNarrative(
  pr: TimePeriodDispatchResult,
  periodLabel: string,
): string {
  const dispatched = pr.meritOrderStack.length;
  const undispatched = pr.undispatchedBands.length;
  const totalBands = dispatched + undispatched;

  if (pr.excessCapacityMW > pr.demandMW * 0.5) {
    return `The ${periodLabel} had significant oversupply — ${pr.excessCapacityMW} MW of offered capacity went undispatched. ${undispatched} bid bands out of ${totalBands} were not needed. Teams with high bids were left out of the money.`;
  }
  if (pr.reserveMarginPercent < 5) {
    return `Supply barely covered demand in the ${periodLabel}. Almost every MW of offered capacity was dispatched. This is when scarcity pricing kicks in — even small changes in bids can dramatically affect the clearing price.`;
  }
  return `${dispatched} bid bands were dispatched to meet ${Math.round(pr.demandMW)} MW of demand in the ${periodLabel}. ${undispatched > 0 ? `${undispatched} bands were not needed.` : 'All offered capacity was dispatched.'}`;
}

// ---- Team Analysis ----

function buildTeamAnalyses(
  game: GameState,
  roundConfig: RoundConfig,
  roundResult: RoundDispatchResult,
  assetDefs: Map<string, AssetDefinition>,
  periodAnalyses: PeriodAnalysis[],
): TeamAnalysis[] {
  const rankedTeams = [...game.teams].sort(
    (a, b) => b.cumulativeProfitDollars - a.cumulativeProfitDollars
  );

  return rankedTeams.map((team, rankIndex) => {
    const teamResult = roundResult.teamResults.find(r => r.teamId === team.id);
    if (!teamResult) {
      return {
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        rank: rankIndex + 1,
        roundProfit: 0,
        cumulativeProfit: team.cumulativeProfitDollars,
        strengths: [],
        improvements: ['No round data available'],
        nextRoundAdvice: 'Make sure to submit bids in the next round.',
        assetPerformance: [],
        competitivePosition: '',
      };
    }

    const submission = game.currentBids.get(team.id);
    const assetPerformance = buildAssetPerformance(
      team.id, teamResult, roundResult, submission, assetDefs, roundConfig,
    );

    const strengths = identifyStrengths(
      teamResult, roundResult, periodAnalyses, team, assetPerformance,
    );
    const improvements = identifyImprovements(
      teamResult, roundResult, periodAnalyses, team, assetPerformance, assetDefs,
    );
    const nextRoundAdvice = buildNextRoundAdvice(
      roundConfig, teamResult, assetPerformance, rankedTeams, rankIndex,
    );
    const competitivePosition = buildCompetitivePosition(
      team, teamResult, rankedTeams, rankIndex, roundResult,
    );

    return {
      teamId: team.id,
      teamName: team.name,
      color: team.color,
      rank: rankIndex + 1,
      roundProfit: teamResult.totalProfitDollars,
      cumulativeProfit: team.cumulativeProfitDollars,
      strengths,
      improvements,
      nextRoundAdvice,
      assetPerformance,
      competitivePosition,
    };
  });
}

function buildAssetPerformance(
  teamId: string,
  teamResult: TeamRoundResult,
  roundResult: RoundDispatchResult,
  submission: TeamBidSubmission | undefined,
  assetDefs: Map<string, AssetDefinition>,
  roundConfig: RoundConfig,
): AssetPerformanceSummary[] {
  // Aggregate across all periods for each asset
  const assetMap = new Map<string, AssetPerformanceSummary>();

  // Track battery-specific aggregates for arbitrage revenue reporting
  const batteryAggregates = new Map<string, {
    totalDischargeRevenue: number;
    totalChargeCost: number;
    periodsCharged: number;
    periodsDischarged: number;
    periodsIdle: number;
  }>();

  for (const periodResult of teamResult.periodBreakdown) {
    for (const asset of periodResult.assets) {
      const existing = assetMap.get(asset.assetDefinitionId);
      if (existing) {
        existing.totalDispatchedMW += asset.dispatchedMW;
        existing.totalRevenue += asset.revenueFromDispatch;
        existing.totalCost += asset.variableCost + asset.startupCost;
        existing.profit += asset.profit;
        if (asset.dispatchedMW > 0) existing.wasDispatched = true;
      } else {
        // Calculate average bid price from submission
        let avgBidPrice = 0;
        if (submission) {
          const assetBids = submission.bids.filter(b => b.assetDefinitionId === asset.assetDefinitionId);
          const totalMW = assetBids.reduce((s, b) => s + b.bands.reduce((s2, band) => s2 + band.quantityMW, 0), 0);
          const weightedPrice = assetBids.reduce((s, b) =>
            s + b.bands.reduce((s2, band) => s2 + band.pricePerMWh * band.quantityMW, 0), 0);
          avgBidPrice = totalMW > 0 ? Math.round(weightedPrice / totalMW) : 0;
        }

        assetMap.set(asset.assetDefinitionId, {
          assetName: asset.assetName,
          assetType: asset.assetType,
          averageBidPrice: avgBidPrice,
          totalDispatchedMW: asset.dispatchedMW,
          totalRevenue: asset.revenueFromDispatch,
          totalCost: asset.variableCost + asset.startupCost,
          profit: asset.profit,
          wasDispatched: asset.dispatchedMW > 0,
          assessment: '',
        });
      }

      // Track battery-specific data for arbitrage revenue reporting
      if (asset.assetType === 'battery' && asset.batteryMode) {
        const batAgg = batteryAggregates.get(asset.assetDefinitionId) || {
          totalDischargeRevenue: 0,
          totalChargeCost: 0,
          periodsCharged: 0,
          periodsDischarged: 0,
          periodsIdle: 0,
        };
        if (asset.batteryMode === 'discharge') {
          batAgg.totalDischargeRevenue += asset.revenueFromDispatch;
          batAgg.periodsDischarged++;
        } else if (asset.batteryMode === 'charge') {
          batAgg.totalChargeCost += asset.chargeCostDollars || 0;
          batAgg.periodsCharged++;
        } else {
          batAgg.periodsIdle++;
        }
        batteryAggregates.set(asset.assetDefinitionId, batAgg);
      }
    }
  }

  // Generate assessments
  for (const [assetId, perf] of assetMap) {
    const def = assetDefs.get(assetId);
    if (!def) continue;

    // Battery-specific assessments using "arbitrage revenue" terminology
    if (def.type === 'battery') {
      const batAgg = batteryAggregates.get(assetId);
      if (batAgg) {
        const dischRev = Math.round(batAgg.totalDischargeRevenue);
        const chgCost = Math.round(batAgg.totalChargeCost);
        const netArbitrage = Math.round(perf.profit);
        const totalPeriods = batAgg.periodsCharged + batAgg.periodsDischarged + batAgg.periodsIdle;

        if (batAgg.periodsDischarged === 0 && batAgg.periodsCharged === 0) {
          perf.assessment = `Battery sat idle all round — no arbitrage revenue earned. Look for price spreads between periods to profit from charge/discharge cycles.`;
        } else if (batAgg.periodsDischarged === 0 && batAgg.periodsCharged > 0) {
          perf.assessment = `Charged ${batAgg.periodsCharged} period${batAgg.periodsCharged > 1 ? 's' : ''} (cost ${fmtDollars(chgCost)}) but never discharged. You need to sell stored energy at peak prices to earn arbitrage revenue.`;
        } else if (batAgg.periodsCharged === 0 && batAgg.periodsDischarged > 0) {
          perf.assessment = `Arbitrage revenue: ${fmtDollars(dischRev)} from discharging ${batAgg.periodsDischarged} period${batAgg.periodsDischarged > 1 ? 's' : ''} (no charging cost). Net profit: ${fmtDollars(netArbitrage)}.`;
        } else if (netArbitrage > 0) {
          perf.assessment = `Arbitrage revenue: ${fmtDollars(dischRev)} from discharge, minus ${fmtDollars(chgCost)} charging cost. Net arbitrage profit: ${fmtDollars(netArbitrage)}. Charged ${batAgg.periodsCharged}/${totalPeriods} periods, discharged ${batAgg.periodsDischarged}/${totalPeriods}.`;
        } else {
          perf.assessment = `Arbitrage loss: earned ${fmtDollars(dischRev)} from discharge but paid ${fmtDollars(chgCost)} to charge. Net: -${fmtDollars(Math.abs(netArbitrage))}. Try charging when prices are lower and discharging when they spike.`;
        }
      } else {
        perf.assessment = `Battery was not actively used this round. Set charge/discharge modes to earn arbitrage revenue from price spreads.`;
      }
      continue;
    }

    if (!perf.wasDispatched) {
      perf.assessment = `Not dispatched this round. Your bids may have been too high, or this asset type wasn't needed.`;
    } else if (perf.profit < 0) {
      perf.assessment = `Dispatched but lost money (${fmtDollars(perf.profit)}). The clearing price was below your costs. Consider bidding above marginal cost (${fmtDollars(def.srmcPerMWh)}/MWh) to avoid losses.`;
    } else if (perf.averageBidPrice <= 0 && perf.profit > 0) {
      perf.assessment = `Smart — bid low to guarantee dispatch and earned ${fmtDollars(perf.profit)} at the market clearing price. The classic "price taker" approach.`;
    } else if (perf.averageBidPrice > def.srmcPerMWh * 3) {
      perf.assessment = perf.wasDispatched
        ? `Aggressive bidding at ~${fmtDollars(perf.averageBidPrice)}/MWh (${(perf.averageBidPrice / def.srmcPerMWh).toFixed(1)}x marginal cost) — and it worked! Profit: ${fmtDollars(perf.profit)}.`
        : `Bid very aggressively at ~${fmtDollars(perf.averageBidPrice)}/MWh. Some capacity may not have been dispatched.`;
    } else {
      perf.assessment = `Dispatched earning ${fmtDollars(perf.profit)} profit. Bid at ~${fmtDollars(perf.averageBidPrice)}/MWh vs marginal cost of ${fmtDollars(def.srmcPerMWh)}/MWh.`;
    }
  }

  return Array.from(assetMap.values());
}

function identifyStrengths(
  teamResult: TeamRoundResult,
  roundResult: RoundDispatchResult,
  periodAnalyses: PeriodAnalysis[],
  team: { id: string; name: string },
  assetPerformance: AssetPerformanceSummary[],
): string[] {
  const strengths: string[] = [];
  const avgProfit = roundResult.teamResults.reduce((s, r) => s + r.totalProfitDollars, 0) / roundResult.teamResults.length;

  if (teamResult.totalProfitDollars > avgProfit * 1.2) {
    strengths.push(`Above-average profitability — earned ${Math.round(((teamResult.totalProfitDollars / avgProfit) - 1) * 100)}% more than the average team.`);
  }

  // Check if they set the price in any period
  const priceSettingPeriods = periodAnalyses.filter(p => p.priceSetterTeam === team.name);
  if (priceSettingPeriods.length > 0) {
    const periodNames = priceSettingPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(', ');
    strengths.push(`Set the market clearing price in ${periodNames} — your bids influenced what everyone earned.`);
  }

  // Check for good dispatch rate
  const totalAvailMW = assetPerformance.reduce((s, a) => s + (a.wasDispatched ? a.totalDispatchedMW : 0), 0);
  if (totalAvailMW > 0 && teamResult.totalRevenueDollars > 0) {
    strengths.push(`Generated ${fmtNum(teamResult.totalEnergyGeneratedMWh)} MWh of energy earning ${fmtDollars(teamResult.totalRevenueDollars)} in revenue.`);
  }

  // Profitable assets
  const profitableAssets = assetPerformance.filter(a => a.profit > 0);
  if (profitableAssets.length > 0) {
    const best = profitableAssets.sort((a, b) => b.profit - a.profit)[0];
    if (best.assetType === 'battery') {
      strengths.push(`${best.assetName} was your best performer, earning ${fmtDollars(best.profit)} in arbitrage revenue.`);
    } else {
      strengths.push(`${best.assetName} was your best performer, earning ${fmtDollars(best.profit)} profit.`);
    }
  }

  if (strengths.length === 0) {
    strengths.push('Participated in the round and gained experience with the bidding process.');
  }

  return strengths;
}

function identifyImprovements(
  teamResult: TeamRoundResult,
  roundResult: RoundDispatchResult,
  periodAnalyses: PeriodAnalysis[],
  team: { id: string; name: string },
  assetPerformance: AssetPerformanceSummary[],
  assetDefs: Map<string, AssetDefinition>,
): string[] {
  const improvements: string[] = [];
  const avgProfit = roundResult.teamResults.reduce((s, r) => s + r.totalProfitDollars, 0) / roundResult.teamResults.length;

  if (teamResult.totalProfitDollars < avgProfit * 0.8) {
    improvements.push(`Below-average profitability this round. Consider reviewing your bidding strategy.`);
  }

  // Check for loss-making assets
  const lossMakers = assetPerformance.filter(a => a.profit < 0);
  for (const asset of lossMakers) {
    if (asset.assetType === 'battery') {
      improvements.push(`${asset.assetName} had a negative arbitrage result (-${fmtDollars(Math.abs(asset.profit))}). Charging cost more than discharge revenue — try charging during lower-priced periods.`);
    } else {
      improvements.push(`${asset.assetName} lost ${fmtDollars(Math.abs(asset.profit))}. Consider bidding at or above marginal cost to avoid dispatching at a loss.`);
    }
  }

  // Check if they bid too high and weren't dispatched
  const undispatchedAssets = assetPerformance.filter(a => !a.wasDispatched && a.averageBidPrice > 0);
  for (const asset of undispatchedAssets) {
    if (asset.averageBidPrice > 0) {
      improvements.push(`${asset.assetName} wasn't dispatched (bid ~$${asset.averageBidPrice}/MWh). Consider lowering bids in periods where you need to be dispatched.`);
    }
  }

  // Check for bidding everything at $0
  const allZeroBids = assetPerformance.every(a => a.averageBidPrice <= 0);
  if (allZeroBids && periodAnalyses.some(p => p.clearingPriceMWh > 50)) {
    improvements.push(`You bid all assets at $0. While this guarantees dispatch, you missed the opportunity to set higher clearing prices in tight periods.`);
  }

  if (improvements.length === 0) {
    improvements.push('Solid performance. Look for opportunities to capture more value in high-demand periods.');
  }

  return improvements;
}

function buildNextRoundAdvice(
  roundConfig: RoundConfig,
  teamResult: TeamRoundResult,
  assetPerformance: AssetPerformanceSummary[],
  rankedTeams: any[],
  rankIndex: number,
): string {
  const parts: string[] = [];

  // Position-based advice
  if (rankIndex === 0) {
    parts.push('You\'re in the lead! Other teams will be trying to outbid you.');
  } else if (rankIndex <= 2) {
    parts.push(`You're in ${rankIndex + 1}${rankIndex === 1 ? 'nd' : 'rd'} place.`);
  } else {
    const leader = rankedTeams[0];
    const gap = leader.cumulativeProfitDollars - rankedTeams[rankIndex].cumulativeProfitDollars;
    parts.push(`You're ${fmtDollars(gap)} behind the leader. Consider more aggressive strategies to close the gap.`);
  }

  // Asset-specific advice
  const lossMakers = assetPerformance.filter(a => a.profit < 0);
  if (lossMakers.length > 0) {
    const batteryLosses = lossMakers.filter(a => a.assetType === 'battery');
    const otherLosses = lossMakers.filter(a => a.assetType !== 'battery');
    if (batteryLosses.length > 0) {
      parts.push(`Your battery had negative arbitrage — try charging in cheaper periods and discharging at peak.`);
    }
    if (otherLosses.length > 0) {
      parts.push(`Watch your ${otherLosses.map(a => a.assetName).join(' and ')} — they lost money. Bid above marginal cost or withdraw capacity in low-demand periods.`);
    }
  }

  return parts.join(' ');
}

function buildCompetitivePosition(
  team: { id: string; name: string; cumulativeProfitDollars: number },
  teamResult: TeamRoundResult,
  rankedTeams: any[],
  rankIndex: number,
  roundResult: RoundDispatchResult,
): string {
  const bestTeamResult = roundResult.teamResults.sort((a, b) => b.totalProfitDollars - a.totalProfitDollars)[0];

  if (bestTeamResult.teamId === team.id) {
    return `Best performance this round! You outperformed all other teams.`;
  }

  const diff = bestTeamResult.totalProfitDollars - teamResult.totalProfitDollars;
  return `The round winner (${bestTeamResult.teamName}) earned ${fmtDollars(diff)} more than you this round. Study the merit order to see where their bids differed from yours.`;
}

// ---- Overall Summary ----

function buildOverallSummary(
  roundConfig: RoundConfig,
  roundResult: RoundDispatchResult,
  periodAnalyses: PeriodAnalysis[],
  game: GameState,
): string {
  const parts: string[] = [];

  // Round context
  parts.push(`Round ${roundConfig.roundNumber} "${roundConfig.name}" played out in ${roundConfig.season}.`);

  // Price range
  const prices = periodAnalyses.map(p => p.clearingPriceMWh);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    parts.push(`The clearing price was ${fmtDollars(minPrice)}/MWh across all periods.`);
  } else {
    const cheapPeriod = periodAnalyses.find(p => p.clearingPriceMWh === minPrice)!;
    const expPeriod = periodAnalyses.find(p => p.clearingPriceMWh === maxPrice)!;
    parts.push(`Prices ranged from ${fmtDollars(minPrice)}/MWh (${TIME_PERIOD_SHORT_LABELS[cheapPeriod.timePeriod]}) to ${fmtDollars(maxPrice)}/MWh (${TIME_PERIOD_SHORT_LABELS[expPeriod.timePeriod]}).`);
  }

  // Winner
  const sortedResults = [...roundResult.teamResults].sort((a, b) => b.totalProfitDollars - a.totalProfitDollars);
  const winner = sortedResults[0];
  const loser = sortedResults[sortedResults.length - 1];

  parts.push(`${winner.teamName} topped the round with ${fmtDollars(winner.totalProfitDollars)} profit.`);
  if (loser.totalProfitDollars < 0) {
    parts.push(`${loser.teamName} lost money (${fmtDollars(loser.totalProfitDollars)}).`);
  }

  // Any price-setting drama
  const tightPeriods = periodAnalyses.filter(p => p.reserveMarginPercent < 15);
  if (tightPeriods.length > 0) {
    parts.push(`Supply was tight in ${tightPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')}, driving prices up.`);
  }

  // Check for AEMO intervention (demand exceeded supply)
  const aemoTriggerPeriods = roundResult.periodResults.filter(p => p.aemoInterventionTriggered);
  if (aemoTriggerPeriods.length > 0) {
    const periodNames = aemoTriggerPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ');
    parts.push(`🚨 AEMO INTERVENTION: Demand exceeded supply in ${periodNames}! The price cap hit $20,000/MWh but AEMO activated emergency generation after 1 hour, restoring supply. Generators earned the blended effective price rather than the full price cap.`);
  }

  // Check for oversupply negative price trigger (3x supply > demand)
  const negTriggerPeriods = roundResult.periodResults.filter(p => p.oversupplyNegativePriceTriggered);
  if (negTriggerPeriods.length > 0) {
    parts.push(`⚡ OVERSUPPLY ALERT: Supply exceeded 3× demand in ${negTriggerPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')}, crashing the price to -$1,000/MWh! Dispatched generators paid dearly. This mirrors real NEM events where renewable oversupply drives deeply negative prices.`);
  } else {
    const oversupplyPeriods = periodAnalyses.filter(p => p.reserveMarginPercent > 60);
    if (oversupplyPeriods.length > 0) {
      parts.push(`Oversupply in ${oversupplyPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')} kept prices low.`);
    }
  }

  return parts.join(' ');
}

function buildCollectiveInsight(
  roundResult: RoundDispatchResult,
  periodAnalyses: PeriodAnalysis[],
  game: GameState,
  assetDefs: Map<string, AssetDefinition>,
): string {
  const parts: string[] = [];

  const totalProfit = roundResult.teamResults.reduce((s, r) => s + r.totalProfitDollars, 0);
  const avgProfit = totalProfit / roundResult.teamResults.length;

  // Check for the "race to the bottom" — everyone bidding $0
  const allLowPrices = periodAnalyses.every(p => p.clearingPriceMWh < 10);
  if (allLowPrices) {
    parts.push(`Collectively, teams competed prices down to very low levels. While this mimics a perfectly competitive market, it means nobody covered their costs well. In the real NEM, generators need margins above marginal cost to recover fixed costs and stay financially viable.`);
  }

  // Check for high collective profit
  if (avgProfit > 0 && !allLowPrices) {
    const highPricePeriods = periodAnalyses.filter(p => p.clearingPriceMWh > 100);
    if (highPricePeriods.length > 0) {
      parts.push(`Total market value created was ${fmtDollars(totalProfit)}. High prices in ${highPricePeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')} drove profits. In the real NEM, these high-price events are controversial — generators need them to be profitable, but consumers pay more.`);
    }
  }

  // Check for oversupply negative price trigger
  const negTriggerPeriods = roundResult.periodResults.filter(p => p.oversupplyNegativePriceTriggered);
  if (negTriggerPeriods.length > 0) {
    parts.push(`The oversupply crash in ${negTriggerPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')} is a key NEM lesson: when too many generators (including batteries) flood a low-demand period, prices can go deeply negative. In the real NEM, this happens routinely in spring midday when solar and wind output exceeds grid demand. The winning strategy during oversupply is to withdraw thermal capacity and charge batteries — getting paid to absorb excess power.`);
  }

  // Nash equilibrium insight
  if (parts.length === 0) {
    parts.push(`The collective outcome reflects the tension at the heart of the NEM: each team tries to maximise its own profit, but collectively, aggressive bidding can either drive prices too low (everyone loses) or exploit scarcity (some win big, consumers pay more). The market design challenge is balancing these incentives.`);
  }

  return parts.join(' ');
}

function buildKeyTakeaways(
  roundConfig: RoundConfig,
  roundResult: RoundDispatchResult,
  periodAnalyses: PeriodAnalysis[],
  game: GameState,
): string[] {
  const takeaways: string[] = [];

  // Price variation takeaway
  const prices = periodAnalyses.map(p => p.clearingPriceMWh);
  const priceSpread = Math.max(...prices) - Math.min(...prices);
  if (priceSpread > 50) {
    takeaways.push(`Prices varied by ${fmtDollars(priceSpread)}/MWh across periods — bidding the same in every period leaves money on the table.`);
  }

  // Reserve margin takeaway
  const tightestPeriod = periodAnalyses.sort((a, b) => a.reserveMarginPercent - b.reserveMarginPercent)[0];
  if (tightestPeriod.reserveMarginPercent < 15) {
    takeaways.push(`${TIME_PERIOD_SHORT_LABELS[tightestPeriod.timePeriod]} had only ${tightestPeriod.reserveMarginPercent.toFixed(0)}% reserve margin — tight markets reward strategic bidding.`);
  }

  // Who set the price
  const priceSetters = new Set(periodAnalyses.map(p => p.priceSetterTeam));
  if (priceSetters.size === 1) {
    const setter = periodAnalyses[0].priceSetterTeam;
    takeaways.push(`${setter} set the price in every period — they had significant market influence this round.`);
  } else {
    takeaways.push(`Different teams set the price in different periods. The marginal generator changes as demand shifts through the day.`);
  }

  // New assets takeaway — only say "unlocked" for rounds after the first
  if (roundConfig.newAssetsUnlocked.length > 0) {
    const newNames = roundConfig.newAssetsUnlocked.map(t => ASSET_TYPE_LABELS[t]).join(', ');
    if (roundConfig.roundNumber <= 1) {
      takeaways.push(`Your fleet includes ${newNames} — learn their cost structures and how they compete in the merit order.`);
    } else {
      takeaways.push(`New asset types unlocked: ${newNames}. These change the competitive dynamics — learn their cost structures.`);
    }
  }

  // AEMO intervention takeaway
  const aemoPeriods = roundResult.periodResults.filter(p => p.aemoInterventionTriggered);
  if (aemoPeriods.length > 0) {
    const periodNames = aemoPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ');
    takeaways.push(`AEMO activated emergency generation in ${periodNames} after demand exceeded supply. The price cap ($20,000/MWh) applied for 1 hour before AEMO restored supply. In the real NEM, AEMO uses the Reliability and Emergency Reserve Trader (RERT) to procure emergency reserves during supply shortfalls.`);
  }

  // Negative price takeaway
  const negTriggerPeriods = roundResult.periodResults.filter(p => p.oversupplyNegativePriceTriggered);
  if (negTriggerPeriods.length > 0) {
    takeaways.push(`Oversupply crashed prices to -$1,000/MWh in ${negTriggerPeriods.map(p => TIME_PERIOD_SHORT_LABELS[p.timePeriod]).join(' and ')}. In the real NEM, this happens when renewables flood the market. Batteries charging during negative prices get PAID — the smart strategy is to withdraw thermal capacity and absorb cheap power.`);
  } else if (Math.min(...prices) < 0) {
    takeaways.push(`Negative prices this round! Dispatched generators lost money in some periods. Batteries can profit by charging during negative prices — getting paid to take power off the grid.`);
  }

  // Profit distribution
  const profits = roundResult.teamResults.map(r => r.totalProfitDollars);
  const profitRange = Math.max(...profits) - Math.min(...profits);
  if (profitRange > Math.max(...profits) * 0.8 && Math.max(...profits) > 0) {
    takeaways.push(`Big spread between top and bottom teams (${fmtDollars(profitRange)}). Strategy made a significant difference this round.`);
  }

  return takeaways.slice(0, 4); // Cap at 4 takeaways
}

// ---- Asset Category Breakdown ----

const CATEGORY_META: Record<AssetCategory, { label: string; icon: string }> = {
  renewables: { label: 'Renewables', icon: '☀️💨' },
  battery:    { label: 'Batteries', icon: '🔋' },
  hydro:      { label: 'Hydro', icon: '💧' },
  fossil:     { label: 'Thermal', icon: '🏭' },
};

function buildAssetCategoryBreakdown(
  game: GameState,
  roundResult: RoundDispatchResult,
  assetDefs: Map<string, AssetDefinition>,
): AssetCategoryBreakdown[] {
  const categories: Record<AssetCategory, {
    revenue: number; cost: number; profit: number; energyMWh: number;
    teams: Map<string, { revenue: number; cost: number; profit: number; energyMWh: number }>;
  }> = {
    renewables: { revenue: 0, cost: 0, profit: 0, energyMWh: 0, teams: new Map() },
    battery:    { revenue: 0, cost: 0, profit: 0, energyMWh: 0, teams: new Map() },
    hydro:      { revenue: 0, cost: 0, profit: 0, energyMWh: 0, teams: new Map() },
    fossil:     { revenue: 0, cost: 0, profit: 0, energyMWh: 0, teams: new Map() },
  };

  for (const teamResult of roundResult.teamResults) {
    for (const period of teamResult.periodBreakdown) {
      for (const asset of period.assets) {
        const def = assetDefs.get(asset.assetDefinitionId);
        if (!def) continue;

        const cat = getAssetCategory(def.type);
        const entry = categories[cat];

        entry.revenue += asset.revenueFromDispatch;
        entry.cost += asset.variableCost + asset.startupCost + (asset.chargeCostDollars ?? 0);
        entry.profit += asset.profit;
        entry.energyMWh += asset.energyMWh;

        if (!entry.teams.has(teamResult.teamId)) {
          entry.teams.set(teamResult.teamId, { revenue: 0, cost: 0, profit: 0, energyMWh: 0 });
        }
        const teamEntry = entry.teams.get(teamResult.teamId)!;
        teamEntry.revenue += asset.revenueFromDispatch;
        teamEntry.cost += asset.variableCost + asset.startupCost + (asset.chargeCostDollars ?? 0);
        teamEntry.profit += asset.profit;
        teamEntry.energyMWh += asset.energyMWh;
      }
    }
  }

  return (['renewables', 'battery', 'hydro', 'fossil'] as AssetCategory[])
    .filter(cat => categories[cat].energyMWh > 0 || categories[cat].profit !== 0)
    .map(cat => {
      const data = categories[cat];
      const meta = CATEGORY_META[cat];

      return {
        category: cat,
        categoryLabel: meta.label,
        categoryIcon: meta.icon,
        totalRevenue: Math.round(data.revenue),
        totalCost: Math.round(data.cost),
        totalProfit: Math.round(data.profit),
        totalEnergyMWh: Math.round(data.energyMWh),
        teamBreakdowns: game.teams.map(t => {
          const td = data.teams.get(t.id) || { revenue: 0, cost: 0, profit: 0, energyMWh: 0 };
          return {
            teamId: t.id,
            teamName: t.name,
            color: t.color,
            revenue: Math.round(td.revenue),
            cost: Math.round(td.cost),
            profit: Math.round(td.profit),
            energyMWh: Math.round(td.energyMWh),
          };
        }).filter(td => td.energyMWh > 0 || td.profit !== 0),
      };
    });
}

// ---- Economic Withholding Detection (AER monitoring) ----

function detectEconomicWithholding(
  game: GameState,
  roundResult: RoundDispatchResult,
  assetDefs: Map<string, AssetDefinition>,
): EconomicWithholdingWarning[] {
  const warnings: EconomicWithholdingWarning[] = [];

  for (const periodResult of roundResult.periodResults) {
    // Only check periods where the price cap was hit (supply shortage)
    if (!periodResult.aemoInterventionTriggered) continue;

    const period = periodResult.timePeriod;

    for (const team of game.teams) {
      const submission = game.currentBids.get(team.id);
      const teamBids = submission?.bids || [];
      const periodBids = teamBids.filter(b => b.timePeriod === period);

      let totalAvailableMW = 0;
      let totalBidMW = 0;
      const withheldAssets: Array<{ assetName: string; assetType: AssetType; capacityMW: number }> = [];

      for (const asset of team.assets) {
        const def = assetDefs.get(asset.assetDefinitionId);
        if (!def) continue;
        // Skip batteries — they have legitimate reasons to idle or charge
        if (def.type === 'battery') continue;

        const availMW = asset.currentAvailableMW;
        if (availMW <= 0) continue;

        totalAvailableMW += availMW;

        // Find what was actually bid for this asset in this period
        const assetBid = periodBids.find(b => b.assetDefinitionId === asset.assetDefinitionId);
        const bidMW = assetBid
          ? assetBid.bands.reduce((sum, band) => sum + band.quantityMW, 0)
          : 0;
        totalBidMW += bidMW;

        const withheld = availMW - bidMW;
        if (withheld > availMW * 0.2) { // Withheld >20% of this asset's capacity
          withheldAssets.push({
            assetName: def.name,
            assetType: def.type,
            capacityMW: Math.round(withheld),
          });
        }
      }

      const withheldMW = totalAvailableMW - totalBidMW;

      // Flag if >25% of capacity was withheld during a supply shortage
      if (totalAvailableMW > 0 && withheldMW > totalAvailableMW * 0.25 && withheldAssets.length > 0) {
        const assetNames = withheldAssets.map(a => `${a.assetName} (${a.capacityMW} MW)`).join(', ');
        warnings.push({
          teamId: team.id,
          teamName: team.name,
          timePeriod: period as TimePeriod,
          withheldCapacityMW: Math.round(withheldMW),
          withheldAssets,
          explanation: `${team.name} withheld ${fmtNum(withheldMW)} MW of available capacity during a supply shortage in the ${TIME_PERIOD_SHORT_LABELS[period as TimePeriod]}. Withheld: ${assetNames}. The AER monitors for economic withholding — repricing or withholding capacity to exercise market power during scarcity.`,
        });
      }
    }
  }

  return warnings;
}
