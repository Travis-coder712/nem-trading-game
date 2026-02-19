import type { AssetDefinition, AssetType, AssetConfigOverrides, Season, TimePeriod } from '../../shared/types.ts';

// Wind capacity factors by season and time period
export const WIND_CAPACITY_FACTORS: Record<Season, Record<TimePeriod, number>> = {
  summer: { night_offpeak: 0.25, day_offpeak: 0.20, day_peak: 0.15, night_peak: 0.30 },
  autumn: { night_offpeak: 0.35, day_offpeak: 0.30, day_peak: 0.25, night_peak: 0.40 },
  winter: { night_offpeak: 0.40, day_offpeak: 0.35, day_peak: 0.30, night_peak: 0.45 },
  spring: { night_offpeak: 0.35, day_offpeak: 0.30, day_peak: 0.25, night_peak: 0.35 },
};

// Solar capacity factors by season and time period
export const SOLAR_CAPACITY_FACTORS: Record<Season, Record<TimePeriod, number>> = {
  summer: { night_offpeak: 0, day_offpeak: 0.60, day_peak: 0.75, night_peak: 0.10 },
  autumn: { night_offpeak: 0, day_offpeak: 0.45, day_peak: 0.55, night_peak: 0.05 },
  winter: { night_offpeak: 0, day_offpeak: 0.30, day_peak: 0.40, night_peak: 0 },
  spring: { night_offpeak: 0, day_offpeak: 0.50, day_peak: 0.65, night_peak: 0.08 },
};

// SRMC variants for different teams to create natural merit order diversity
const COAL_SRMC_VARIANTS = [28, 30, 32, 34, 36, 38, 40, 42, 35, 33, 31, 37, 39, 29, 41];
const GAS_CCGT_SRMC_VARIANTS = [68, 72, 75, 78, 82, 70, 74, 80, 76, 73, 71, 77, 79, 69, 81];
const GAS_PEAKER_SRMC_VARIANTS = [130, 140, 145, 150, 155, 135, 142, 148, 152, 138, 132, 146, 158, 136, 144];

/**
 * Generate an SRMC value with optional variation across teams.
 * When applyVariation is true, spreads values +/-20% around the base using the team index.
 */
function getSrmcWithVariation(baseSrmc: number, teamIndex: number, teamCount: number, applyVariation: boolean): number {
  if (!applyVariation || teamCount <= 1) return baseSrmc;
  // Spread evenly from -20% to +20% of base across teams
  const spread = 0.20;
  const position = teamCount > 1 ? teamIndex / (teamCount - 1) : 0.5; // 0 to 1
  const multiplier = 1 - spread + (position * 2 * spread); // 0.80 to 1.20
  return Math.round(baseSrmc * multiplier);
}

/**
 * Create asset definitions for a team, optionally applying custom overrides.
 * @param teamIndex - zero-based team index
 * @param overrides - optional per-asset-type overrides for name, SRMC, nameplate MW
 * @param applyVariation - when true with overrides, spread SRMC across teams for diversity
 * @param teamCount - total teams in game (used for variation spread calculation)
 */
export function createAssetDefinitionsForTeam(
  teamIndex: number,
  overrides?: AssetConfigOverrides,
  applyVariation: boolean = true,
  teamCount: number = 15,
): AssetDefinition[] {
  const coalOverride = overrides?.coal;
  const ccgtOverride = overrides?.gas_ccgt;
  const peakerOverride = overrides?.gas_peaker;
  const windOverride = overrides?.wind;
  const solarOverride = overrides?.solar;
  const hydroOverride = overrides?.hydro;
  const batteryOverride = overrides?.battery;

  return [
    {
      id: `coal_${teamIndex}`,
      name: coalOverride?.name
        ? `${coalOverride.name} ${teamIndex + 1}`
        : getCoalPlantName(teamIndex),
      type: 'coal',
      nameplateMW: coalOverride?.nameplateMW ?? 800,
      srmcPerMWh: coalOverride?.srmcPerMWh != null
        ? getSrmcWithVariation(coalOverride.srmcPerMWh, teamIndex, teamCount, applyVariation)
        : COAL_SRMC_VARIANTS[teamIndex % COAL_SRMC_VARIANTS.length],
      minStableLoadMW: 250,
      rampRateMWPerMin: 5,
      startupCostDollars: 50000,
      mustRun: false,
      availableFromRound: 1,
    },
    {
      id: `gas_ccgt_${teamIndex}`,
      name: ccgtOverride?.name
        ? `${ccgtOverride.name} ${teamIndex + 1}`
        : getGasCCGTName(teamIndex),
      type: 'gas_ccgt',
      nameplateMW: ccgtOverride?.nameplateMW ?? 350,
      srmcPerMWh: ccgtOverride?.srmcPerMWh != null
        ? getSrmcWithVariation(ccgtOverride.srmcPerMWh, teamIndex, teamCount, applyVariation)
        : GAS_CCGT_SRMC_VARIANTS[teamIndex % GAS_CCGT_SRMC_VARIANTS.length],
      minStableLoadMW: 100,
      rampRateMWPerMin: 10,
      startupCostDollars: 20000,
      mustRun: false,
      availableFromRound: 5,
    },
    {
      id: `gas_peaker_${teamIndex}`,
      name: peakerOverride?.name
        ? `${peakerOverride.name} ${teamIndex + 1}`
        : getGasPeakerName(teamIndex),
      type: 'gas_peaker',
      nameplateMW: peakerOverride?.nameplateMW ?? 150,
      srmcPerMWh: peakerOverride?.srmcPerMWh != null
        ? getSrmcWithVariation(peakerOverride.srmcPerMWh, teamIndex, teamCount, applyVariation)
        : GAS_PEAKER_SRMC_VARIANTS[teamIndex % GAS_PEAKER_SRMC_VARIANTS.length],
      minStableLoadMW: 30,
      rampRateMWPerMin: 25,
      startupCostDollars: 5000,
      mustRun: false,
      availableFromRound: 5,
    },
    {
      id: `wind_${teamIndex}`,
      name: windOverride?.name
        ? `${windOverride.name} ${teamIndex + 1}`
        : getWindFarmName(teamIndex),
      type: 'wind',
      nameplateMW: windOverride?.nameplateMW ?? 300,
      srmcPerMWh: 0,
      minStableLoadMW: 0,
      rampRateMWPerMin: 50,
      startupCostDollars: 0,
      mustRun: false,
      availableFromRound: 6,
      capacityFactors: WIND_CAPACITY_FACTORS.autumn.night_offpeak !== undefined
        ? WIND_CAPACITY_FACTORS.autumn as unknown as Record<TimePeriod, number>
        : undefined,
    },
    {
      id: `solar_${teamIndex}`,
      name: solarOverride?.name
        ? `${solarOverride.name} ${teamIndex + 1}`
        : getSolarFarmName(teamIndex),
      type: 'solar',
      nameplateMW: solarOverride?.nameplateMW ?? 200,
      srmcPerMWh: 0,
      minStableLoadMW: 0,
      rampRateMWPerMin: 100,
      startupCostDollars: 0,
      mustRun: false,
      availableFromRound: 6,
    },
    {
      id: `hydro_${teamIndex}`,
      name: hydroOverride?.name
        ? `${hydroOverride.name} ${teamIndex + 1}`
        : getHydroName(teamIndex),
      type: 'hydro',
      nameplateMW: hydroOverride?.nameplateMW ?? 250,
      srmcPerMWh: hydroOverride?.srmcPerMWh != null
        ? getSrmcWithVariation(hydroOverride.srmcPerMWh, teamIndex, teamCount, applyVariation)
        : 8,
      minStableLoadMW: 20,
      rampRateMWPerMin: 30,
      startupCostDollars: 2000,
      mustRun: false,
      availableFromRound: 7,
      maxStorageMWh: 1000,
    },
    {
      id: `battery_${teamIndex}`,
      name: batteryOverride?.name
        ? `${batteryOverride.name} ${teamIndex + 1}`
        : getBatteryName(teamIndex),
      type: 'battery',
      nameplateMW: batteryOverride?.nameplateMW ?? 500,
      srmcPerMWh: 0,
      minStableLoadMW: 0,
      rampRateMWPerMin: 500,
      startupCostDollars: 0,
      mustRun: false,
      availableFromRound: 8,
      maxStorageMWh: Math.round((batteryOverride?.nameplateMW ?? 500) * 4), // 4 hours of storage
      roundTripEfficiency: 0.92,
      maxChargeMW: batteryOverride?.nameplateMW ?? 500,
    },
  ];
}

export function getAvailableAssets(allAssets: AssetDefinition[], roundNumber: number, gameMode: string): AssetDefinition[] {
  if (gameMode === 'experienced') {
    return allAssets; // All assets available in experienced mode
  }

  if (gameMode === 'beginner') {
    // Beginner mode: only coal and gas CCGT
    return allAssets.filter(a => a.type === 'coal' || a.type === 'gas_ccgt');
  }

  const quickModeRoundMap: Record<number, number> = {
    1: 1, 2: 3, 3: 5, 4: 6, 5: 7, 6: 9, 7: 11, 8: 15,
  };

  // Progressive Learning: 10 rounds that gradually unlock assets
  // Round 1-3: coal only, Round 4: +gas, Round 5: +wind/solar/hydro, Round 6+: +battery (all)
  const progressiveModeRoundMap: Record<number, number> = {
    1: 1, 2: 1, 3: 1, 4: 5, 5: 7, 6: 8, 7: 8, 8: 8, 9: 8, 10: 8,
  };

  const effectiveRound = gameMode === 'quick'
    ? (quickModeRoundMap[roundNumber] || roundNumber)
    : gameMode === 'progressive'
    ? (progressiveModeRoundMap[roundNumber] || roundNumber)
    : roundNumber;

  return allAssets.filter(a => a.availableFromRound <= effectiveRound);
}

// Australian-themed names for assets
function getCoalPlantName(i: number): string {
  const names = [
    'Mount Arthur', 'Hunter Valley', 'Wollongong', 'Gladstone',
    'Tarong', 'Stanwell', 'Callide', 'Bayswater',
    'Eraring', 'Vales Point', 'Liddell', 'Mt Piper',
    'Kogan Creek', 'Millmerran', 'Collie',
  ];
  return `${names[i % names.length]} Coal`;
}

function getGasCCGTName(i: number): string {
  const names = [
    'Tallawarra', 'Pelican Point', 'Darling Downs', 'Swanbank',
    'Mortlake', 'Newport', 'Torrens Island', 'Osborne',
    'Roma', 'Braemar', 'Condamine', 'Uranquinty',
    'Bairnsdale', 'Laverton', 'Oakey',
  ];
  return `${names[i % names.length]} CCGT`;
}

function getGasPeakerName(i: number): string {
  const names = [
    'Colongra', 'Valley Power', 'Angaston', 'Hallett',
    'Quarantine', 'Jeeralang', 'Yabulu', 'Mt Stuart',
    'Mackay', 'Wivenhoe', 'Snapper Point', 'Port Lincoln',
    'Mintaro', 'Lonsdale', 'Dry Creek',
  ];
  return `${names[i % names.length]} Peaker`;
}

function getWindFarmName(i: number): string {
  const names = [
    'Stockyard Hill', 'Coopers Gap', 'Sapphire', 'Moorabool',
    'MacIntyre', 'Bald Hills', 'Ararat', 'Mt Mercer',
    'Hornsdale', 'Snowtown', 'Willogoleche', 'Lincoln Gap',
    'Dundonnell', 'Bulgana', 'Silverton',
  ];
  return `${names[i % names.length]} Wind`;
}

function getSolarFarmName(i: number): string {
  const names = [
    'Darlington Point', 'Bungala', 'Western Downs', 'Limondale',
    'Sunraysia', 'Finley', 'Coleambally', 'Moree',
    'Parkes', 'Griffith', 'Beryl', 'Nevertire',
    'Gannawarra', 'Numurkah', 'Broken Hill',
  ];
  return `${names[i % names.length]} Solar`;
}

function getHydroName(i: number): string {
  const names = [
    'Tumut 3', 'Murray 1', 'Gordon', 'Poatina',
    'Wivenhoe', 'Shoalhaven', 'Trevallyn', 'Reece',
    'Mackintosh', 'Meadowbank', 'John Butters', 'Tribute',
    'Fisher', 'Guthega', 'Blowering',
  ];
  return `${names[i % names.length]} Hydro`;
}

function getBatteryName(i: number): string {
  const names = [
    'Hornsdale Reserve', 'Victorian Big Battery', 'Bouldercombe', 'Wandoan',
    'Waratah Super', 'Torrens Island', 'Broken Hill', 'Dalrymple',
    'Ballarat', 'Lake Bonney', 'Riverina', 'Capital',
    'Orana', 'Darlington Point', 'Hazelwood',
  ];
  return `${names[i % names.length]} Battery`;
}

export function getWindCapacityFactor(season: Season, period: TimePeriod): number {
  return WIND_CAPACITY_FACTORS[season]?.[period] ?? 0.25;
}

export function getSolarCapacityFactor(season: Season, period: TimePeriod): number {
  return SOLAR_CAPACITY_FACTORS[season]?.[period] ?? 0;
}
