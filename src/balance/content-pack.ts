/**
 * Reference content pack for balance harness.
 * Aligned with polyps-content unlock gates / pace anchors where possible.
 * Lead should prefer importing real data/ once wired; keep ids stable.
 */

import type { AdaptationDef, StructureDef } from "./types.ts";

export const STRUCTURES: StructureDef[] = [
  {
    id: "absorber",
    name: "Absorber",
    description: "Starter surface that sips ambient nutrients.",
    tags: ["core", "feed", "starter"],
    cost: { biomass: 0 },
    produce: { nutrients: 0.35 },
    envAffinity: { ambientNutrients: 0.8, current: 0.3 },
    maxCount: 6,
    visual: { archetype: "core", hue: 168, pulse: 0.4 },
  },
  {
    id: "tentacle",
    name: "Tentacle",
    description: "Active feeding arm. Burns energy for nutrients.",
    tags: ["feed", "predation", "limb"],
    cost: { biomass: 4, energy: 2 },
    upkeep: { energy: -0.15 },
    produce: { nutrients: 0.9 },
    envAffinity: { ambientNutrients: 0.5, current: 0.6, predatorPressure: -0.2 },
    unlock: { requiresStructures: { absorber: 1 } },
    maxCount: 12,
    visual: { archetype: "tentacle", hue: 185, pulse: 0.7 },
  },
  {
    id: "chamber",
    name: "Digestive Chamber",
    description: "Converts nutrients into energy and waste.",
    tags: ["digest", "metabolic", "core"],
    cost: { biomass: 6, energy: 3, nutrients: 4 },
    upkeep: { energy: -0.1 },
    convert: [
      { from: "nutrients", to: "energy", rate: 1.0, efficiency: 0.75 },
    ],
    produce: { waste: 0.18 },
    envAffinity: { temperature: 0.4 },
    unlock: { requiresStructures: { tentacle: 1 } },
    maxCount: 8,
    visual: { archetype: "chamber", hue: 32, pulse: 0.55 },
  },
  {
    id: "symbiont",
    name: "Photosymbiont",
    description: "Light-fed partner that yields energy.",
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
    description: "Eats waste, returns nutrients.",
    tags: ["symbiont", "waste", "recycle", "metabolic"],
    cost: { biomass: 5, energy: 2, minerals: 1 },
    convert: [{ from: "waste", to: "nutrients", rate: 0.45, efficiency: 0.85 }],
    produce: { energy: 0.08 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 8,
    visual: { archetype: "symbiont", hue: 48, pulse: 0.5 },
  },
  {
    id: "membrane",
    name: "Membrane Veil",
    description: "Defensive sheath; sinks biomass, softens stress.",
    tags: ["defense", "membrane", "shell"],
    cost: { biomass: 10, minerals: 2, energy: 3 },
    upkeep: { energy: -0.08, biomass: -0.02 },
    envAffinity: { predatorPressure: 0.9, disturbance: 0.9, current: -0.25 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 2 },
    maxCount: 8,
    visual: { archetype: "membrane", hue: 210, pulse: 0.25 },
  },
  {
    id: "sensor",
    name: "Chemosensor",
    description: "Improves predation foresight under current/pressure.",
    tags: ["sensor", "predation", "info"],
    cost: { biomass: 4, energy: 5, minerals: 1 },
    upkeep: { energy: -0.2 },
    produce: { genetic: 0.02 },
    envAffinity: { current: 0.8, predatorPressure: 0.5 },
    unlock: { requiresStructures: { tentacle: 2 }, requiresGenetic: 4 },
    maxCount: 6,
    visual: { archetype: "sensor", hue: 280, pulse: 1.1 },
  },
  {
    id: "venom",
    name: "Venom Sac",
    description: "Predation spikes. Costs minerals, sheds waste.",
    tags: ["predation", "venom", "burst"],
    cost: { biomass: 7, minerals: 4, energy: 4 },
    upkeep: { minerals: -0.04, energy: -0.15 },
    produce: { nutrients: 0.3, waste: 0.2 },
    unlock: {
      requiresStructures: { tentacle: 2, sensor: 1 },
      requiresGenetic: 6,
    },
    maxCount: 4,
    visual: { archetype: "venom", hue: 125, pulse: 1.3 },
  },
  {
    id: "vessel",
    name: "Transport Vessel",
    description: "Transport corridor. Amplifies adjacent specialised clusters.",
    tags: ["vessel", "transport", "colonial"],
    cost: { biomass: 6, energy: 3 },
    upkeep: { energy: -0.12 },
    adjacencyBonus: {
      requireTags: ["vessel", "transport"],
      modifiers: [
        {
          id: "vessel-grid-node",
          mult: { energy: 1.05, nutrients: 1.05 },
          tags: ["transport"],
        },
      ],
    },
    unlock: { requiresStructures: { chamber: 2 }, requiresGenetic: 5 },
    maxCount: 14,
    visual: { archetype: "vessel", hue: 195, pulse: 0.6 },
  },
  {
    id: "bud",
    name: "Reproductive Bud",
    description: "Colonial reproduction node.",
    tags: ["bud", "colonial", "reproduce"],
    cost: { biomass: 15, genetic: 3, energy: 6 },
    upkeep: { nutrients: -0.15, energy: -0.1 },
    produce: { genetic: 0.04 },
    unlock: {
      requiresStructures: { chamber: 1, membrane: 1 },
      requiresGenetic: 8,
    },
    maxCount: 5,
    visual: { archetype: "bud", hue: 310, pulse: 0.9 },
  },
  {
    id: "bacteria",
    name: "Gut Bacteria",
    description: "Waste → energy; closes metabolism.",
    tags: ["bacteria", "waste", "metabolic", "digest"],
    cost: { biomass: 3, energy: 2, nutrients: 4 },
    upkeep: { energy: -0.05 },
    convert: [{ from: "waste", to: "energy", rate: 0.3, efficiency: 0.6 }],
    produce: { minerals: 0.03 },
    unlock: { requiresStructures: { chamber: 1 }, requiresGenetic: 3 },
    maxCount: 10,
    visual: { archetype: "bacteria", hue: 55, pulse: 0.75 },
  },
  {
    id: "mineral_gland",
    name: "Mineral Gland",
    description: "Condenses scarce minerals from current-borne grit.",
    tags: ["minerals", "metabolic", "feed"],
    cost: { biomass: 8, energy: 5, waste: 2 },
    upkeep: { energy: -0.18 },
    produce: { minerals: 0.12 },
    unlock: { requiresStructures: { vessel: 1 }, requiresGenetic: 7 },
    maxCount: 4,
    visual: { archetype: "chamber", hue: 220, pulse: 0.45 },
  },
];

export const ADAPTATIONS: AdaptationDef[] = [
  {
    id: "grasp_reflex",
    name: "Grasp Reflex",
    description: "Tentacles snatch faster in current.",
    pathway: "predatory",
    costGenetic: 4,
    modifiers: [
      {
        id: "grasp-feed",
        mult: { nutrients: 1.35 },
        tags: ["feed", "predation"],
      },
    ],
    unlockStructures: ["sensor"],
  },
  {
    id: "ambush_venom",
    name: "Ambush Venom",
    description: "Venom bursts scale with predator pressure.",
    pathway: "predatory",
    costGenetic: 8,
    modifiers: [
      {
        id: "ambush-burst",
        mult: { nutrients: 1.55 },
        tags: ["venom", "predation"],
        when: { env: { predatorPressure: { min: 0.3 } } },
      },
    ],
    unlockStructures: ["venom"],
  },
  {
    id: "chloroplast_bloom",
    name: "Chloroplast Bloom",
    description: "Symbionts flood energy in high light.",
    pathway: "photo",
    costGenetic: 4,
    modifiers: [
      {
        id: "chloro-day",
        mult: { energy: 1.5 },
        tags: ["photo"],
        when: { env: { light: { min: 0.5 } } },
      },
    ],
    unlockStructures: ["symbiont"],
  },
  {
    id: "light_armor",
    name: "Light Armor",
    description: "Membranes preserve photo yield through disturbance.",
    pathway: "photo",
    costGenetic: 7,
    modifiers: [
      {
        id: "light-armor",
        mult: { energy: 1.15, nutrients: 0.85 },
        tags: ["photo", "membrane"],
      },
    ],
  },
  {
    id: "mutual_gut",
    name: "Mutual Gut",
    description: "Waste converters run hotter beside chambers.",
    pathway: "symbiotic",
    costGenetic: 4,
    modifiers: [
      {
        id: "mutual-gut",
        mult: { waste: 0.9, energy: 1.2 },
        tags: ["waste", "digest"],
      },
    ],
    unlockStructures: ["waste_symbiont", "bacteria"],
  },
  {
    id: "toxin_bargain",
    name: "Toxin Bargain",
    description: "High waste becomes fuel instead of throttle.",
    pathway: "symbiotic",
    costGenetic: 8,
    modifiers: [
      {
        id: "toxin-bargain",
        mult: { nutrients: 1.15 },
        tags: ["waste"],
      },
    ],
  },
  {
    id: "budding_rhythm",
    name: "Budding Rhythm",
    description: "Buds cheaper under stable temperature.",
    pathway: "colonial",
    costGenetic: 5,
    modifiers: [
      {
        id: "bud-rhythm",
        mult: { genetic: 1.2, biomass: 1.1 },
        tags: ["colonial", "bud"],
        when: { env: { temperature: { min: 0.35, max: 0.7 } } },
      },
    ],
    unlockStructures: ["bud"],
  },
  {
    id: "colony_pulse",
    name: "Colony Pulse",
    description: "Buds inherit chamber+symbiont synergy.",
    pathway: "colonial",
    costGenetic: 9,
    modifiers: [
      {
        id: "colony_pulse",
        mult: { genetic: 1.35, energy: 1.15 },
        tags: ["colonial", "photo"],
        when: {
          minStructures: { chamber: 1, symbiont: 1 },
          env: { light: { min: 0.4 } },
        },
      },
    ],
  },
  {
    id: "metabolic_trim",
    name: "Metabolic Trim",
    description: "Lower metabolic friction.",
    pathway: "metabolic",
    costGenetic: 5,
    modifiers: [
      {
        id: "metabolic_trim",
        mult: { energy: 1.1 },
        add: { energy: 0.05 },
        tags: ["metabolic"],
      },
    ],
  },
  {
    id: "spore_drift_key",
    name: "Spore Drift Key",
    description: "Unlocks prestige Spore Drift once genetic depth is reached.",
    pathway: "hybrid",
    costGenetic: 14,
    modifiers: [{ id: "spore_key", add: { genetic: 0.02 } }],
    permanentRelic: true,
  },
];

export const STRUCTURE_BY_ID = Object.fromEntries(
  STRUCTURES.map((s) => [s.id, s]),
) as Record<string, StructureDef>;

export const ADAPTATION_BY_ID = Object.fromEntries(
  ADAPTATIONS.map((a) => [a.id, a]),
) as Record<string, AdaptationDef>;

/** Aligned toward content/balance.ts but with minerals>0 so membrane/symbiont aren't instantly soft-locked */
export const START_RESOURCES = {
  nutrients: 8,
  energy: 8,
  biomass: 10,
  genetic: 0,
  minerals: 3,
  waste: 0,
};

/** Prestige threshold: genetic stockpile this run */
export const PRESTIGE_GENETIC_THRESHOLD = 18;
