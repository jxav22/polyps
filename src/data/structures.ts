/**
 * Structure content pack — every build creates a decision or interaction.
 * Tune numbers via balance harness; targets assume ~1 tick economy unit / sec baseline.
 *
 * Pace anchors (lead can scale globally):
 * - absorber alone → tentacle unlock ~90–120s
 * - chamber unlock ~2–3 min
 * - pathway fork structures ~5–8 min
 * - spore-tier / bud stacks ~12–15 min
 */
import type { StructureDef } from "../sim/interfaces.ts";

export const STRUCTURES: StructureDef[] = [
  // ─── Starter / early ─────────────────────────────────────────────
  {
    id: "absorber",
    name: "Absorber",
    description:
      "Passive surface that drinks ambient nutrients. Slow alone — the seed every colony starts from.",
    tags: ["core", "feed", "starter"],
    cost: { biomass: 0, energy: 0 },
    upkeep: {},
    produce: { nutrients: 0.35, energy: 0.22 },
    envAffinity: { ambientNutrients: 0.8, current: 0.3, light: 0.35 },
    unlock: {},
    maxCount: 6,
    visual: { archetype: "core", hue: 168, pulse: 0.4 },
  },
  {
    id: "tentacle",
    name: "Tentacle",
    description:
      "Active feeding arm. Pulls nutrients hard but burns energy — idle tentacles starve the colony.",
    tags: ["feed", "predation", "limb"],
    cost: { biomass: 4, energy: 1 },
    upkeep: { energy: -0.05 },
    produce: { nutrients: 0.9 },
    adjacencyBonus: {
      requireTags: ["sensor"],
      modifiers: [
        {
          id: "tentacle-sensor-aim",
          mult: { "produce.nutrients": 1.25 },
          tags: ["synergy:sensor-hunt"],
        },
      ],
    },
    envAffinity: { ambientNutrients: 0.5, current: 0.6, predatorPressure: -0.2 },
    unlock: { requiresStructures: { absorber: 1 } },
    maxCount: 6,
    visual: { archetype: "tentacle", hue: 185, pulse: 0.7 },
  },
  {
    id: "chamber",
    name: "Digestive Chamber",
    description:
      "Converts nutrients into energy and waste. Without a waste sink, toxicity throttles everything.",
    tags: ["digest", "metabolic", "core"],
    cost: { biomass: 6, energy: 1, nutrients: 4 },
    upkeep: { energy: -0.08 },
    convert: [
      { from: "nutrients", to: "energy", rate: 0.8, efficiency: 0.7 },
      // waste is emitted as byproduct of digestion (sim applies waste = rate * (1-efficiency) or separate)
    ],
    produce: { waste: 0.18, biomass: 0.05 },
    adjacencyBonus: {
      requireTags: ["bacteria", "waste"],
      modifiers: [
        {
          id: "chamber-waste-handoff",
          mult: { "convert.efficiency": 1.15 },
          add: { "produce.waste": -0.05 },
          tags: ["synergy:waste-loop"],
        },
      ],
    },
    envAffinity: { temperature: 0.4 },
    unlock: { requiresStructures: { tentacle: 1 } },
    maxCount: 8,
    visual: { archetype: "chamber", hue: 32, pulse: 0.55 },
  },

  // ─── Symbiosis / photo ───────────────────────────────────────────
  {
    id: "symbiont",
    name: "Photosymbiont",
    description:
      "Light-fed guest cells. Strong in bright phases; starve in murk. Pair with membrane against disturbance.",
    tags: ["photo", "symbiont", "energy"],
    cost: { biomass: 6, minerals: 1, energy: 3 },
    upkeep: { nutrients: -0.05 },
    produce: { energy: 0.7 },
    envAffinity: { light: 1.2, temperature: 0.3, disturbance: -0.5 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 2 },
    maxCount: 10,
    visual: { archetype: "symbiont", hue: 95, pulse: 0.85 },
  },
  {
    id: "waste_symbiont",
    name: "Detrital Symbiont",
    description:
      "Eats waste, returns nutrients. Closes the chamber loop — but produces almost no energy alone.",
    tags: ["symbiont", "waste", "recycle", "metabolic"],
    cost: { biomass: 5, energy: 2, minerals: 1 },
    upkeep: {},
    convert: [{ from: "waste", to: "nutrients", rate: 0.45, efficiency: 0.85 }],
    produce: { energy: 0.08 },
    adjacencyBonus: {
      requireTags: ["digest"],
      modifiers: [
        {
          id: "detrital-chamber-loop",
          mult: { "convert.rate": 1.3 },
          tags: ["synergy:waste-loop"],
        },
      ],
    },
    envAffinity: { ambientNutrients: -0.1, temperature: 0.2 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 8,
    visual: { archetype: "symbiont", hue: 48, pulse: 0.5 },
  },

  // ─── Defense / structure ─────────────────────────────────────────
  {
    id: "membrane",
    name: "Membrane Veil",
    description:
      "Biomass sink that softens predator pressure and disturbance. Blocks some nutrient current if overbuilt.",
    tags: ["defense", "membrane", "shell"],
    cost: { biomass: 8, minerals: 1, energy: 2 },
    upkeep: { energy: -0.08, biomass: -0.02 },
    produce: {},
    adjacencyBonus: {
      requireTags: ["photo", "symbiont"],
      modifiers: [
        {
          id: "photo-shield",
          mult: { "env.disturbance": 0.7, "produce.energy": 1.1 },
          tags: ["synergy:photo-shield"],
          when: { env: { light: { min: 0.35 } } },
        },
      ],
    },
    envAffinity: { predatorPressure: 0.9, disturbance: 0.9, current: -0.25 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 2 },
    maxCount: 8,
    visual: { archetype: "membrane", hue: 210, pulse: 0.25 },
  },

  // ─── Sensing / predation ─────────────────────────────────────────
  {
    id: "sensor",
    name: "Chemosensor",
    description:
      "Reads current and prey shadows. Useless alone; lethal when wired to tentacles or venom.",
    tags: ["sensor", "predation", "info"],
    cost: { biomass: 4, energy: 5, minerals: 1 },
    upkeep: { energy: -0.2 },
    produce: { genetic: 0.02 },
    adjacencyBonus: {
      requireTags: ["predation", "limb"],
      modifiers: [
        {
          id: "sensor-hunt-feed",
          mult: { "produce.nutrients": 1.4 },
          tags: ["synergy:sensor-hunt"],
          when: { env: { current: { min: 0.4 } } },
        },
      ],
    },
    envAffinity: { current: 0.8, predatorPressure: 0.5 },
    unlock: { requiresStructures: { tentacle: 2 }, requiresGenetic: 3 },
    maxCount: 6,
    visual: { archetype: "sensor", hue: 280, pulse: 1.1 },
  },
  {
    id: "venom",
    name: "Venom Sac",
    description:
      "Mineral-hungry predation spike. Huge nutrient bursts under pressure; dumps waste and risks overheat.",
    tags: ["predation", "venom", "burst"],
    cost: { biomass: 7, minerals: 3, energy: 4 },
    upkeep: { minerals: -0.04, energy: -0.15 },
    produce: { nutrients: 0.5, waste: 0.2 },
    adjacencyBonus: {
      requireTags: ["sensor"],
      modifiers: [
        {
          id: "sensor-venom-strike",
          mult: { "produce.nutrients": 1.6 },
          add: { "produce.waste": 0.1 },
          tags: ["synergy:sensor-hunt"],
          when: { env: { predatorPressure: { min: 0.35 } } },
        },
      ],
    },
    envAffinity: { predatorPressure: 0.7, temperature: -0.3 },
    unlock: { requiresStructures: { tentacle: 2, sensor: 1 }, requiresGenetic: 6 },
    maxCount: 4,
    visual: { archetype: "venom", hue: 125, pulse: 1.3 },
  },

  // ─── Logistics / colonial ────────────────────────────────────────
  {
    id: "vessel",
    name: "Transport Vessel",
    description:
      "Moves resources between neighbors. Alone: mild upkeep tax. In a grid: specialised clusters thrive.",
    tags: ["vessel", "transport", "colonial"],
    cost: { biomass: 5, energy: 2 },
    upkeep: { energy: -0.1 },
    produce: {},
    adjacencyBonus: {
      requireTags: ["vessel", "transport"],
      modifiers: [
        {
          id: "vessel-grid-node",
          mult: { "adjacency.transport": 1.35, "upkeep.energy": 0.85 },
          tags: ["synergy:vessel-grid"],
        },
      ],
    },
    envAffinity: { current: 0.4 },
    // balance-verified: chamber:1 genetic:3 so colonial/metabolic logistics by ~8 min
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 14,
    visual: { archetype: "vessel", hue: 195, pulse: 0.6 },
  },
  {
    id: "bud",
    name: "Reproductive Bud",
    description:
      "Spends biomass and genetic to spawn a daughter site that inherits chamber/symbiont traits. Crowding without vessels collapses yields.",
    tags: ["bud", "colonial", "reproduce"],
    // balance-verified: membrane gate removed — stockpile genetic was blocking fork
    cost: { biomass: 10, genetic: 1, energy: 4 },
    upkeep: { nutrients: -0.12, energy: -0.08 },
    produce: { genetic: 0.05 },
    adjacencyBonus: {
      requireTags: ["digest", "photo"],
      modifiers: [
        {
          id: "colonial-bloom-seed",
          mult: { "produce.energy": 1.2, "produce.genetic": 1.25 },
          tags: ["synergy:colonial-bloom"],
          when: { env: { light: { min: 0.55 } } },
        },
      ],
    },
    envAffinity: { light: 0.4, ambientNutrients: 0.3 },
    // Fork by ≤480s: chamber only (membrane/vessel optional for bloom quality, not unlock)
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 5,
    visual: { archetype: "bud", hue: 310, pulse: 0.9 },
  },

  // ─── Metabolic specialists ───────────────────────────────────────
  {
    id: "bacteria",
    name: "Gut Bacteria",
    description:
      "Specialised waste processors. Thrive on chamber effluent; starve if the colony runs clean.",
    tags: ["bacteria", "waste", "metabolic", "digest"],
    cost: { biomass: 3, energy: 1, nutrients: 3 },
    upkeep: { energy: -0.05 },
    convert: [{ from: "waste", to: "energy", rate: 0.4, efficiency: 0.6 }],
    produce: { minerals: 0.03 },
    adjacencyBonus: {
      requireTags: ["digest"],
      modifiers: [
        {
          id: "bacteria-chamber-ferment",
          mult: { "convert.rate": 1.4, "produce.minerals": 1.5 },
          tags: ["synergy:waste-loop"],
        },
      ],
    },
    envAffinity: { temperature: 0.5, light: -0.2 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 2 },
    maxCount: 10,
    visual: { archetype: "bacteria", hue: 55, pulse: 0.75 },
  },
  {
    id: "mineral_gland",
    name: "Mineral Gland",
    description:
      "Condenses scarce minerals from current-borne grit. Competes with absorbers for flow — place on vessel edges.",
    tags: ["minerals", "metabolic", "feed"],
    // balance-verified: chamber-gated; match filter_plate genetic so gland is a real metabolic fork
    cost: { biomass: 5, energy: 2, waste: 1 },
    upkeep: { energy: -0.1 },
    produce: { minerals: 0.16 },
    adjacencyBonus: {
      requireTags: ["vessel", "transport"],
      modifiers: [
        {
          id: "gland-vessel-feed",
          mult: { "produce.minerals": 1.45 },
          tags: ["synergy:vessel-grid", "synergy:mineral-spine"],
        },
      ],
    },
    envAffinity: { current: 0.9, ambientNutrients: 0.2 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 4,
    visual: { archetype: "chamber", hue: 220, pulse: 0.45 },
  },
  {
    id: "spore_vault",
    name: "Spore Vault",
    description:
      "Banks genetic novelty toward Spore Drift. Expensive upkeep; unlocks prestige visibility earlier.",
    tags: ["prestige", "genetic", "colonial"],
    cost: { biomass: 20, minerals: 3, genetic: 5, energy: 10 },
    upkeep: { energy: -0.25, nutrients: -0.1 },
    produce: { genetic: 0.08 },
    envAffinity: { disturbance: 0.3 },
    unlock: {
      requiresStructures: { bud: 1, chamber: 2 },
      requiresGenetic: 12,
      requiresFlags: ["seen_midgame"],
    },
    maxCount: 2,
    visual: { archetype: "bud", hue: 265, pulse: 0.35 },
  },

  // ─── Compositional specialists ───────────────────────────────────
  {
    id: "filter_plate",
    name: "Filter Plate",
    description:
      "Sieves current for nutrients without tentacle energy tax. Weak in still water; pairs with vessels on the rim.",
    tags: ["feed", "filter", "metabolic"],
    cost: { biomass: 4, minerals: 1, energy: 2 },
    upkeep: { energy: -0.05 },
    produce: { nutrients: 0.4 },
    adjacencyBonus: {
      requireTags: ["vessel", "transport"],
      modifiers: [
        {
          id: "filter-vessel-rim",
          mult: { "produce.nutrients": 1.5 },
          tags: ["synergy:vessel-grid", "synergy:filter-rim"],
          when: { env: { current: { min: 0.4 } } },
        },
      ],
    },
    envAffinity: { current: 1.0, ambientNutrients: 0.4 },
    // Metabolic fork companion to gland — chamber gate only; vessel boosts via adjacency
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 6,
    visual: { archetype: "membrane", hue: 175, pulse: 0.5 },
  },
  {
    id: "nest",
    name: "Brood Nest",
    description:
      "Cuts bud biomass cost when adjacent, but raises predator attention. Colonial logistics piece — not a safe core.",
    tags: ["colonial", "bud", "nest"],
    cost: { biomass: 12, energy: 5, nutrients: 8 },
    upkeep: { energy: -0.12, nutrients: -0.08 },
    produce: {},
    adjacencyBonus: {
      requireTags: ["bud", "reproduce"],
      modifiers: [
        {
          id: "nest-brood",
          mult: { "tag.bud.cost.biomass": 0.7, "env.predatorPressure": 1.25 },
          tags: ["synergy:brood-nest", "synergy:colonial-bloom"],
        },
      ],
    },
    envAffinity: { predatorPressure: -0.3, light: 0.2 },
    unlock: { requiresStructures: { bud: 1 }, requiresGenetic: 9 },
    maxCount: 3,
    visual: { archetype: "bud", hue: 300, pulse: 0.65 },
  },
  {
    id: "lumophore",
    name: "Lumophore",
    description:
      "Bioluminescent lure: fake light for symbionts in murk, or bait that boosts sensor hunt. Splits focus — choose lure mode via adjacency.",
    tags: ["photo", "sensor", "lure", "hybrid"],
    cost: { biomass: 6, energy: 6, minerals: 1, genetic: 1 },
    upkeep: { energy: -0.22 },
    produce: { energy: 0.15 },
    adjacencyBonus: {
      requireTags: ["symbiont", "photo"],
      modifiers: [
        {
          id: "lumo-photo-fake",
          mult: { "tag.photo.produce.energy": 1.25 },
          add: { "local.light": 0.2 },
          tags: ["synergy:false-dawn"],
          when: { env: { light: { max: 0.4 } } },
        },
      ],
    },
    envAffinity: { light: -0.2, predatorPressure: 0.3 },
    unlock: { requiresStructures: { sensor: 1, symbiont: 1 }, requiresGenetic: 10 },
    maxCount: 3,
    visual: { archetype: "sensor", hue: 55, pulse: 1.4 },
  },
];

export const STRUCTURES_BY_ID: Record<string, StructureDef> = Object.fromEntries(
  STRUCTURES.map((s) => [s.id, s]),
);

/** Alias for sim imports (patches-for-lead) */
export const STRUCTURE_DEFS = STRUCTURES;
export const STRUCTURE_MAP = STRUCTURES_BY_ID;
