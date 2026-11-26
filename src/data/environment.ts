/**
 * Environment cycles & soft events — bias builds, never wipe progress.
 * Env values normalised 0–1 unless noted. Soft floors protect resources/structures.
 */
import type { EnvCycleDef, EnvEventDef } from "./types.ts";

export const BASELINE_ENV = {
  light: 0.55,
  temperature: 0.5,
  ambientNutrients: 0.5,
  current: 0.4,
  predatorPressure: 0.2,
  disturbance: 0.1,
} as const;

/** Primary diurnal / tidal loop (~6 min sim cycle for early game feel) */
export const DAY_TIDE_CYCLE: EnvCycleDef = {
  id: "day_tide",
  name: "Day–Tide Cycle",
  description:
    "Light and current swing together. Photo builds feast at crest; hunters prefer the murk between.",
  loop: true,
  phases: [
    {
      id: "dawn_slack",
      name: "Dawn Slack",
      duration: 45,
      env: {
        light: 0.35,
        temperature: 0.42,
        ambientNutrients: 0.55,
        current: 0.25,
        predatorPressure: 0.25,
        disturbance: 0.08,
      },
      modifiers: [
        {
          id: "dawn-absorb",
          mult: { "tag.feed.produce.nutrients": 1.1, "tag.photo.produce.energy": 0.85 },
          tags: ["env:dawn"],
        },
      ],
      flavor: "Pale shafts, still water — absorbers wake before guests do.",
    },
    {
      id: "bright_flood",
      name: "Bright Flood",
      duration: 75,
      env: {
        light: 0.85,
        temperature: 0.58,
        ambientNutrients: 0.45,
        current: 0.65,
        predatorPressure: 0.15,
        disturbance: 0.12,
      },
      modifiers: [
        {
          id: "bright-photo",
          mult: {
            "tag.photo.produce.energy": 1.35,
            "synergy:colonial-bloom": 1.15,
            "tag.predation.produce.nutrients": 0.85,
          },
          tags: ["env:bright"],
        },
      ],
      flavor: "Full glow. Symbionts blaze; hunters squint.",
    },
    {
      id: "warm_ebb",
      name: "Warm Ebb",
      duration: 60,
      env: {
        light: 0.5,
        temperature: 0.72,
        ambientNutrients: 0.4,
        current: 0.35,
        predatorPressure: 0.3,
        disturbance: 0.15,
      },
      modifiers: [
        {
          id: "warm-gut",
          mult: {
            "tag.digest.convert.rate": 1.2,
            "synergy:thermal-gut": 1.15,
            "tag.membrane.upkeep.energy": 1.1,
          },
          tags: ["env:warm"],
        },
      ],
      flavor: "Heat thickens metabolism — guts race, veils sweat energy.",
    },
    {
      id: "dusk_hunt",
      name: "Dusk Hunt",
      duration: 55,
      env: {
        light: 0.25,
        temperature: 0.48,
        ambientNutrients: 0.5,
        current: 0.55,
        predatorPressure: 0.55,
        disturbance: 0.2,
      },
      modifiers: [
        {
          id: "dusk-hunt",
          mult: {
            "tag.predation.produce.nutrients": 1.35,
            "synergy:sensor-hunt": 1.2,
            "synergy:night-ambush": 1.15,
            "tag.photo.produce.energy": 0.6,
          },
          tags: ["env:dusk"],
        },
      ],
      flavor: "Shadows and shear — sensors earn their keep.",
    },
    {
      id: "night_drift",
      name: "Night Drift",
      duration: 70,
      env: {
        light: 0.12,
        temperature: 0.38,
        ambientNutrients: 0.6,
        current: 0.3,
        predatorPressure: 0.35,
        disturbance: 0.1,
      },
      modifiers: [
        {
          id: "night-drift",
          mult: {
            "tag.photo.produce.energy": 0.4,
            "tag.waste.convert.rate": 1.15,
            "tag.feed.produce.nutrients": 1.15,
            "tag.sensor.upkeep.energy": 0.9,
          },
          tags: ["env:night"],
        },
      ],
      flavor: "Dark broth. Detritus and absorbers carry the colony till dawn.",
    },
  ],
};

/** Secondary nutrient pulse layered on day_tide (slower) */
export const NUTRIENT_BLOOM_CYCLE: EnvCycleDef = {
  id: "nutrient_bloom",
  name: "Nutrient Bloom Pulse",
  description:
    "Ambient feedstock swells then crashes. Reward storage and waste readiness over greedy tentacles.",
  loop: true,
  phases: [
    {
      id: "lean_water",
      name: "Lean Water",
      duration: 120,
      env: { ambientNutrients: 0.3 },
      modifiers: [
        {
          id: "lean",
          mult: {
            "tag.feed.produce.nutrients": 0.75,
            "synergy:waste-loop": 1.2,
            "tag.waste.convert.efficiency": 1.15,
          },
          tags: ["env:lean"],
        },
      ],
      flavor: "Thin soup — recyclers outshine harvesters.",
    },
    {
      id: "rich_plume",
      name: "Rich Plume",
      duration: 90,
      env: { ambientNutrients: 0.85, current: 0.7 },
      modifiers: [
        {
          id: "rich",
          mult: {
            "tag.feed.produce.nutrients": 1.45,
            "tag.digest.produce.waste": 1.25,
            "resource.waste.penalty": 1.15,
          },
          tags: ["env:rich"],
        },
      ],
      flavor: "A feast arrives — chambers choke without a waste sink.",
    },
    {
      id: "aftermath_haze",
      name: "Aftermath Haze",
      duration: 60,
      env: { ambientNutrients: 0.45, disturbance: 0.25 },
      modifiers: [
        {
          id: "aftermath",
          mult: {
            "tag.bacteria.convert.rate": 1.3,
            "tag.membrane.upkeep.biomass": 1.1,
          },
          tags: ["env:aftermath"],
        },
      ],
      flavor: "Leftovers and grit — bacteria bloom in the mess.",
    },
  ],
};

export const ENV_CYCLES: EnvCycleDef[] = [DAY_TIDE_CYCLE, NUTRIENT_BLOOM_CYCLE];

/**
 * Rare soft events — temporarily bias pathways.
 * softOnly: true → no structure deletion, resources clamped to floors.
 */
export const ENV_EVENTS: EnvEventDef[] = [
  {
    id: "predator_front",
    name: "Predator Front",
    description:
      "Pressure spikes. Membranes and venom shine; exposed buds and photo clusters yield less.",
    meanInterval: 180,
    unlockAfter: 240,
    duration: 40,
    env: { predatorPressure: 0.85, disturbance: 0.35 },
    modifiers: [
      {
        id: "predator-front",
        mult: {
          "tag.defense": 1.3,
          "tag.venom.produce.nutrients": 1.4,
          "tag.bud.produce.genetic": 0.7,
          "tag.photo.produce.energy": 0.8,
          "synergy:red-tide": 1.2,
          "synergy:bait-hunt": 1.15,
          "synergy:brood-nest": 0.75,
          "synergy:silent-reef": 1.1,
          "synergy:novelty-engine": 1.2,
        },
        tags: ["event:predator"],
      },
    ],
    softOnly: true,
    biasesPathways: ["predatory", "metabolic"],
  },
  {
    id: "light_storm",
    name: "Light Storm",
    description:
      "Erratic brilliance. Unshielded symbionts overproduce then crash; photo-shield and guest-guard hold steady.",
    meanInterval: 210,
    unlockAfter: 300,
    duration: 35,
    env: { light: 0.95, disturbance: 0.55, temperature: 0.65 },
    modifiers: [
      {
        id: "light-storm",
        mult: {
          "tag.photo.produce.energy": 1.5,
          "synergy:photo-shield": 1.35,
          "synergy:guest-guard": 1.3,
          "synergy:bloom-shield": 1.2,
          "tag.photo.upkeep.nutrients": 1.4,
          "resource.waste.penalty": 1.1,
          "synergy:false-dawn": 0.7,
        },
        tags: ["event:light-storm"],
      },
    ],
    softOnly: true,
    biasesPathways: ["photo", "symbiotic"],
  },
  {
    id: "anoxic_pocket",
    name: "Anoxic Pocket",
    description:
      "Oxygen-poor swirl. Digestion struggles; vessel grids, anoxic-grid, and fringe ferment keep clusters alive.",
    meanInterval: 240,
    unlockAfter: 360,
    duration: 45,
    env: { temperature: 0.35, current: 0.15, ambientNutrients: 0.35 },
    modifiers: [
      {
        id: "anoxic",
        mult: {
          "tag.digest.convert.rate": 0.65,
          "tag.waste.convert.rate": 0.7,
          "synergy:vessel-grid": 1.25,
          "synergy:anoxic-grid": 1.4,
          "synergy:fringe-ferment": 1.2,
          "tag.vessel.upkeep.energy": 0.85,
          "synergy:filter-rim": 0.6,
        },
        tags: ["event:anoxic"],
      },
    ],
    softOnly: true,
    biasesPathways: ["colonial", "metabolic"],
  },
  {
    id: "detritus_rain",
    name: "Detritus Rain",
    description:
      "Waste and nutrients fall together. Recyclers and red-tide surge; silent reef stays steady; pure hunters overfeed.",
    meanInterval: 200,
    unlockAfter: 200,
    duration: 50,
    env: { ambientNutrients: 0.7, disturbance: 0.3 },
    modifiers: [
      {
        id: "detritus-rain",
        add: { "produce.waste": 0.2 },
        mult: {
          "synergy:waste-loop": 1.4,
          "synergy:red-tide": 1.25,
          "synergy:armored-loop": 1.2,
          "synergy:lean-armor": 0.85,
          "tag.symbiont.convert.rate": 1.3,
          "tag.predation.produce.nutrients": 1.2,
        },
        tags: ["event:detritus"],
      },
    ],
    softOnly: true,
    biasesPathways: ["symbiotic", "metabolic"],
  },
  {
    id: "spawn_current",
    name: "Spawn Current",
    description:
      "Gentle shear ideal for budding and spawn ferry. Colonial bloom without vessels still self-competes.",
    meanInterval: 260,
    unlockAfter: 420,
    duration: 55,
    env: { current: 0.75, light: 0.6, predatorPressure: 0.2 },
    modifiers: [
      {
        id: "spawn-current",
        mult: {
          "tag.bud.cost.biomass": 0.8,
          "synergy:colonial-bloom": 1.3,
          "synergy:spawn-ferry": 1.4,
          "synergy:core-fringe": 1.15,
          "tag.bud.produce.genetic": 1.25,
        },
        tags: ["event:spawn"],
      },
    ],
    softOnly: true,
    biasesPathways: ["colonial", "photo"],
  },
  {
    id: "mineral_upwelling",
    name: "Mineral Upwelling",
    description:
      "Grit-rich current. Mineral spine and filter rim shine; photo affinity dips in the turbidity.",
    meanInterval: 280,
    unlockAfter: 480,
    duration: 40,
    env: { current: 0.8, ambientNutrients: 0.4, light: 0.4 },
    modifiers: [
      {
        id: "mineral-upwelling",
        mult: {
          "tag.minerals.produce.minerals": 1.6,
          "synergy:mineral-spine": 1.35,
          "synergy:filter-rim": 1.25,
          "synergy:overveil": 0.7,
          "tag.photo.produce.energy": 0.75,
        },
        tags: ["event:minerals"],
      },
    ],
    softOnly: true,
    biasesPathways: ["metabolic", "predatory"],
  },
];

/** Resource floors during events — lead enforces in tick */
export const SOFT_FLOORS = {
  nutrients: 0,
  energy: 0,
  biomass: 1,
  genetic: 0,
  minerals: 0,
  waste: 0,
  /** Structures never deleted by env */
  structuresInvulnerable: true,
} as const;
