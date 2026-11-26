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
} as const;

/** Starting resources after new game / post-drift */
export const START_RESOURCES = {
  nutrients: 2,
  energy: 3,
  biomass: 2,
  genetic: 0,
  minerals: 0,
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
  predatory: ["absorber", "tentacle", "chamber", "tentacle", "sensor", "venom", "membrane"],
  photo: ["absorber", "tentacle", "chamber", "symbiont", "membrane", "symbiont", "bud"],
  symbiotic: ["absorber", "tentacle", "chamber", "bacteria", "waste_symbiont", "chamber", "membrane"],
  colonial: ["absorber", "tentacle", "chamber", "symbiont", "vessel", "vessel", "bud", "membrane"],
  metabolic: ["absorber", "tentacle", "chamber", "bacteria", "vessel", "mineral_gland", "membrane"],
} as const;

/** Dominance warnings for harness */
export const HARNESS_FLAGS = {
  infiniteWasteLoop:
    "If convert.efficiency * waste-loop mult >= 1 forever with no upkeep sink, flag.",
  photoNeverNights: "If shade_debt + always-light test wins all envs, retune night mults.",
  vesselTaxTooHarsh: "If solo vessel always negative EV vs no vessel, soften upkeep.",
  prestigeInvisible: "If genetic < 15 at 15 min under all autopilots, buff novelty/genetic ticks.",
} as const;
