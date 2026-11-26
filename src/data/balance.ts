/**
 * Suggested numeric anchors for the lead / balance harness.
 * Scale all economy with GLOBAL_RATE if ticks feel slow/fast.
 */
export const GLOBAL_RATE = 1.0;

export const PACE = {
  tentacleSec: [60, 120],
  chamberSec: [120, 180],
  firstAdaptationSec: [300, 480],
  pathwayForkSec: [300, 480],
  prestigeVisibleSec: [720, 900],
  firstDriftSec: [840, 1080],
} as const;

/** Soft caps — pressure decisions without hard walls */
export const SOFT_CAPS = {
  wastePenaltyStart: 8,
  wastePenaltyFull: 20,
  /** yield mult at full waste without loop */
  wasteYieldFloor: 0.35,
  budCrowdStart: 3,
  budCrowdYieldFloor: 0.7,
  membraneCurrentFeedPenaltyPer: 0.04,
  membraneCurrentFeedPenaltyMax: 0.25,
  /** Biomass band — overflow bleeds to genetic; hard wall was choking midgame at 100 */
  biomassSoft: 80,
  biomassHard: 140,
} as const;

/**
 * Canonical start bag (aligned with createColony).
 * Harsh pack values (B2/M0) soft-lock membrane/symbiont — do not ship those.
 */
export const START_RESOURCES = {
  nutrients: 6,
  energy: 4,
  biomass: 8,
  genetic: 0,
  minerals: 3,
  waste: 0,
} as const;

export const POST_DRIFT_RESOURCES = {
  nutrients: 3,
  energy: 4,
  biomass: 2,
  genetic: "fraction", // see prestige.keep.geneticFraction
  minerals: 1,
  waste: 0,
} as const;

/**
 * Autopilot pathway scripts for harness — structure build order hints.
 * Flag infinite loops if waste_loop + convert efficiency unbounded.
 */
export const AUTOPILOTS = {
  predatory: [
    "absorber",
    "tentacle",
    "chamber",
    "tentacle",
    "sensor",
    "venom",
    "lumophore",
    "membrane",
  ],
  photo: [
    "absorber",
    "tentacle",
    "chamber",
    "symbiont",
    "membrane",
    "symbiont",
    "lumophore",
    "bud",
  ],
  symbiotic: [
    "absorber",
    "tentacle",
    "chamber",
    "bacteria",
    "waste_symbiont",
    "chamber",
    "membrane",
  ],
  colonial: [
    "absorber",
    "tentacle",
    "chamber",
    "bud", // fork landmark ≤480s — do not gate behind membrane spam
    "vessel",
    "vessel",
    "nest",
    "symbiont",
    "membrane",
  ],
  metabolic: [
    "absorber",
    "tentacle",
    "chamber",
    "mineral_gland", // fork landmark — prefer gland before filter (needs minerals)
    "bacteria",
    "filter_plate",
    "vessel",
    "membrane",
  ],
} as const;

/** Dominance warnings for harness */
export const HARNESS_FLAGS = {
  infiniteWasteLoop:
    "If convert.efficiency * waste-loop mult >= 1 forever with no upkeep sink, flag.",
  photoNeverNights: "If shade_debt + always-light test wins all envs, retune night mults.",
  vesselTaxTooHarsh: "If solo vessel always negative EV vs no vessel, soften upkeep.",
  prestigeInvisible: "If genetic < 15 at 15 min under all autopilots, buff novelty/genetic ticks.",
  silentReefBroken:
    "If silent_reef fires with tentacles present, maxStructures not wired in modifierApplies.",
} as const;

/** Hard caps lead should enforce when folding synergy mults */
export const HARD_CAPS = {
  /** stacked waste-loop convert.rate mult */
  wasteLoopConvertRateMult: 2.0,
  /** stacked photo energy mult from synergies alone */
  photoEnergySynergyMult: 2.2,
  /** membranes before overveil anti-synergy */
  membraneOverveilAt: 4,
} as const;

/**
 * Sim contract notes (from origin/main review):
 * - modifierApplies today only checks minStructures / env / adjacentTags
 * - Content now uses maxStructures + forbidAdjacentTags — lead must extend sim
 * - minStructures: { x: 0 } NEVER means "zero of x"; use maxStructures: { x: 0 }
 */
export const SIM_CONTRACT = {
  needsMaxStructures: true,
  needsForbidAdjacentTags: true,
  needsRivalryTable: true,
  channelPrefixExamples: [
    "produce.nutrients",
    "tag.photo.produce.energy",
    "synergy:waste-loop",
    "convert.rate",
  ],
} as const;
