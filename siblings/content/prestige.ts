/**
 * Spore Drift — prestige reset keeping genetic relics / pathway unlocks.
 * Visible ~12–15 min active play (see visibleWhen).
 */
import type { PrestigeTrackDef, RelicDef } from "./types";

export const RELICS: RelicDef[] = [
  {
    id: "echo_chloroplast",
    name: "Echo Chloroplast",
    description:
      "Ghost pigments remember light. Soft photo bonus after drift; night penalties slightly kinder.",
    earn: { requiresAdaptations: ["chloroplast_bloom"], requiresFlags: ["synergy:photo-shield"] },
    modifiers: [
      {
        id: "relic-echo-chloro",
        mult: { "tag.photo.produce.energy": 1.12, "tag.photo.night.penalty": 0.85 },
        tags: ["relic", "pathway:photo"],
      },
    ],
    unlockAdaptations: ["light_armor"],
    permanent: true,
  },
  {
    id: "fang_memory",
    name: "Fang Memory",
    description:
      "Strike patterns persist in spore DNA. First tentacles after drift start with sensor-hunt affinity.",
    earn: { requiresAdaptations: ["grasp_reflex", "ambush_venom"] },
    modifiers: [
      {
        id: "relic-fang",
        mult: { "tag.predation.produce.nutrients": 1.1, "tag.sensor.cost.energy": 0.85 },
        tags: ["relic", "pathway:predatory", "synergy:sensor-hunt"],
      },
    ],
    unlockStructures: ["sensor"],
    permanent: true,
  },
  {
    id: "loop_cyst",
    name: "Loop Cyst",
    description:
      "A dormant waste consortium. Chambers after drift auto-seed a virtual bacteria adjacency once.",
    earn: {
      requiresAdaptations: ["mutual_gut"],
      requiresFlags: ["synergy:waste-loop"],
      requiresStructuresBuilt: { bacteria: 3, waste_symbiont: 1 },
    },
    modifiers: [
      {
        id: "relic-loop",
        mult: { "synergy:waste-loop": 1.15, "tag.digest.produce.waste": 0.9 },
        tags: ["relic", "pathway:symbiotic"],
      },
    ],
    unlockStructures: ["waste_symbiont"],
    permanent: true,
  },
  {
    id: "colony_spore",
    name: "Colony Spore",
    description:
      "Bud templates remember vessel grids. Second bud is cheaper; crowding tax delayed by one bud.",
    earn: {
      requiresAdaptations: ["budding_rhythm"],
      requiresFlags: ["synergy:colonial-bloom"],
      requiresStructuresBuilt: { bud: 2, vessel: 2 },
    },
    modifiers: [
      {
        id: "relic-colony",
        mult: { "tag.bud.cost.biomass": 0.9, "synergy:vessel-grid": 1.1 },
        tags: ["relic", "pathway:colonial"],
      },
    ],
    unlockStructures: ["vessel"],
    permanent: true,
  },
  {
    id: "thrift_shell",
    name: "Thrift Shell",
    description:
      "Mineral accounting etched into the spore wall. Early membrane/venom cost less minerals once.",
    earn: { requiresAdaptations: ["mineral_thrift", "tight_cycles"] },
    modifiers: [
      {
        id: "relic-thrift",
        mult: {
          "tag.membrane.cost.minerals": 0.8,
          "tag.venom.cost.minerals": 0.8,
          "first.build.mineral_discount": 1,
        },
        tags: ["relic", "pathway:metabolic"],
      },
    ],
    permanent: true,
  },
  {
    id: "hybrid_knot",
    name: "Hybrid Knot",
    description:
      "Reef-hunter compromise survives drift. Pure-path peaks stay muted; generalist floors rise.",
    earn: {
      requiresAdaptations: ["reef_hunter"],
      requiresFlags: ["pathway:hybrid_committed"],
    },
    modifiers: [
      {
        id: "relic-hybrid",
        mult: {
          "pathway.pure.bonus": 0.85,
          "pathway.hybrid.floor": 1.15,
          "synergy:night-ambush": 1.1,
        },
        tags: ["relic", "pathway:hybrid"],
      },
    ],
    unlockAdaptations: ["commune_ferment"],
    permanent: true,
  },
  {
    id: "vault_echo",
    name: "Vault Echo",
    description:
      "Spore Vault residue. Prestige genetic fraction kept rises; vault unlocks one drift earlier.",
    earn: {
      requiresStructuresBuilt: { spore_vault: 1 },
      requiresPrestige: 0,
      requiresFlags: ["seen_prestige_ui"],
    },
    modifiers: [
      {
        id: "relic-vault",
        add: { "prestige.geneticFraction": 0.05 },
        mult: { "tag.prestige.produce.genetic": 1.2 },
        tags: ["relic", "prestige"],
      },
    ],
    unlockStructures: ["spore_vault"],
    permanent: true,
  },
  {
    id: "ferment_seed",
    name: "Ferment Seed",
    description:
      "Commune ferment lineage. Daughters after drift begin with waste-loop awareness.",
    earn: {
      requiresAdaptations: ["commune_ferment"],
      requiresFlags: ["synergy:ferment-commune"],
    },
    modifiers: [
      {
        id: "relic-ferment",
        mult: { "synergy:ferment-commune": 1.2, "tag.bud.inherit.bacteria": 1 },
        tags: ["relic", "pathway:hybrid", "synergy:ferment-commune"],
      },
    ],
    permanent: true,
  },
];

export const SPORE_DRIFT: PrestigeTrackDef = {
  id: "sporeDrift",
  name: "Spore Drift",
  description:
    "Release the colony as drifting spores. Biomass and most resources reset; relics and pathway unlocks endure. Genetic keeps a fraction.",
  visibleWhen: {
    minTime: 720, // 12 min — soft show
    minGenetic: 15,
    minBiomassPeak: 40,
    requiresFlags: ["seen_midgame"],
  },
  driftCost: {
    minBiomass: 50,
    minGenetic: 20,
  },
  keep: {
    relics: true,
    pathwayUnlocks: true,
    geneticFraction: 0.25,
  },
  relics: RELICS,
  unlockTiers: [
    {
      prestige: 1,
      name: "First Drift",
      unlockFlags: ["prestige_1", "seen_prestige_ui"],
      unlockAdaptations: ["heat_tolerant"],
    },
    {
      prestige: 2,
      name: "Mapped Currents",
      unlockFlags: ["prestige_2", "env_foresight"],
      unlockStructures: ["mineral_gland"],
      unlockAdaptations: ["vessel_instinct"],
    },
    {
      prestige: 3,
      name: "Ancestral Reef",
      unlockFlags: ["prestige_3", "hybrid_paths_open"],
      unlockAdaptations: ["reef_hunter", "commune_ferment"],
    },
    {
      prestige: 5,
      name: "Deep Archive",
      unlockFlags: ["prestige_5", "spore_vault_early"],
      unlockStructures: ["spore_vault"],
    },
  ],
};

/** Suggested autopilot: when to offer drift in harness */
export const PRESTIGE_BALANCE = {
  visibleTargetMinutes: [12, 15],
  firstDriftTargetMinutes: [14, 18],
  geneticFractionBase: 0.25,
  geneticFractionPerVaultRelic: 0.05,
  maxGeneticFraction: 0.45,
} as const;
