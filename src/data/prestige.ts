/**
 * Spore Drift — prestige reset keeping genetic relics / pathway unlocks.
 * Visibility uses lifetime genetic + flags (stockpile heuristic fails — adaptations spend G).
 */
import type { PrestigeSignalDef, PrestigeTrackDef, RelicDef } from "./types";

/**
 * Flag setters for lead/sim. Wire once in tick or command layer.
 * Order is intentional: midgame → ready → visible → drifted.
 */
export const PRESTIGE_SIGNALS: PrestigeSignalDef[] = [
  {
    id: "signal_midgame",
    flag: "seen_midgame",
    description: "Player reached pathway-fork depth — vault and prestige UI may open.",
    when: {
      minTime: 300,
      anyAdaptation: [
        "grasp_reflex",
        "chloroplast_bloom",
        "mutual_gut",
        "budding_rhythm",
        "tight_cycles",
      ],
      // OR: built a fork structure even without adapting yet
      minStructures: { chamber: 1 },
      minGeneticLifetime: 4,
    },
  },
  {
    id: "signal_pathway_committed",
    flag: "pathway_committed",
    description: "Second adaptation or a pathway landmark structure — midgame identity.",
    when: {
      minGeneticLifetime: 8,
      anySynergy: [
        "waste_loop",
        "sensor_hunt",
        "photo_shield",
        "colonial_bloom",
        "vessel_grid",
      ],
    },
  },
  {
    id: "signal_prestige_ready",
    flag: "prestige_ready",
    description:
      "Real prestige signal (not stockpile). Pace band ~12–15 min: time≥720 + lifetime G≥16 (or biomass peak).",
    when: {
      // Keep Drift out of early midgame — PACE.prestigeVisibleSec [720, 900]
      minTime: 720,
      minGeneticLifetime: 16,
      minBiomassPeak: 50,
    },
  },
  {
    id: "signal_prestige_ready_vault",
    flag: "prestige_ready",
    description: "Vault is an explicit prestige commitment (may open Drift before the time band).",
    when: { minStructures: { spore_vault: 1 } },
  },
  {
    id: "signal_prestige_visible",
    flag: "seen_prestige_ui",
    description: "Show Spore Drift panel once ready + midgame (or time fallback).",
    when: {
      requiresFlags: ["prestige_ready", "seen_midgame"],
    },
  },
  {
    id: "signal_prestige_visible_time",
    flag: "seen_prestige_ui",
    description: "Time fallback so prestige never stays invisible past ~15 min.",
    when: { minTime: 900, minGeneticLifetime: 12 },
  },
];

export const RELICS: RelicDef[] = [
  {
    id: "echo_chloroplast",
    name: "Echo Chloroplast",
    description:
      "Ghost pigments remember light. Soft photo bonus after drift; night penalties slightly kinder.",
    goalHint: "Photo-Shield a symbiont under light, then take Chloroplast Bloom.",
    pathway: "photo",
    earn: {
      anyAdaptations: ["chloroplast_bloom", "light_armor"],
      anyFlags: ["synergy:photo-shield", "synergy:bloom-shield"],
    },
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
    goalHint: "Unlock Sensor Hunt (sensor + tentacle/venom in current).",
    pathway: "predatory",
    earn: {
      anyAdaptations: ["grasp_reflex", "ambush_venom"],
      anyFlags: ["synergy:sensor-hunt", "synergy:night-ambush", "synergy:bait-hunt"],
    },
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
    goalHint: "Close a Waste Loop — chamber beside bacteria or detrital symbiont.",
    pathway: "symbiotic",
    earn: {
      anyAdaptations: ["mutual_gut", "toxin_bargain"],
      anyFlags: ["synergy:waste-loop", "synergy:armored-loop"],
      requiresStructuresBuilt: { chamber: 1, bacteria: 1 },
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
    goalHint: "Grow a Bud, then link at least one Vessel (bloom optional).",
    pathway: "colonial",
    earn: {
      anyAdaptations: ["budding_rhythm", "vessel_instinct"],
      requiresStructuresBuilt: { bud: 1, vessel: 1 },
      anyFlags: ["synergy:colonial-bloom", "synergy:vessel-grid", "synergy:spawn-ferry"],
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
    goalHint: "Build a Mineral Gland or Filter Plate, or take Tight Cycles.",
    pathway: "metabolic",
    earn: {
      anyAdaptations: ["mineral_thrift", "tight_cycles", "slow_burn"],
      anyFlags: ["synergy:mineral-spine", "synergy:filter-rim"],
      requiresStructuresBuilt: { mineral_gland: 1 },
    },
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
    goalHint: "Run two pathways at once (e.g. photo + hunt, or ferment commune).",
    pathway: "hybrid",
    earn: {
      anyAdaptations: ["reef_hunter", "dusk_gardener", "commune_ferment", "armored_loop"],
      anyFlags: ["pathway:hybrid_committed", "synergy:night-ambush", "synergy:ferment-commune"],
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
    goalHint: "Build the Spore Vault once prestige UI appears — banks lineage.",
    pathway: "prestige",
    earn: {
      requiresStructuresBuilt: { spore_vault: 1 },
      anyFlags: ["seen_prestige_ui", "prestige_ready"],
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
    goalHint: "Bud beside a fermented chamber (bacteria + chamber).",
    pathway: "hybrid",
    earn: {
      anyAdaptations: ["commune_ferment", "rim_janitor"],
      anyFlags: ["synergy:ferment-commune", "synergy:fringe-ferment"],
      requiresStructuresBuilt: { bud: 1, bacteria: 1 },
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
  {
    id: "glow_ember",
    name: "Glow Ember",
    description:
      "A cooled lumophore spark. First False Dawn or Bait Hunt after drift costs less energy upkeep for 90s.",
    goalHint: "Place a Lumophore — fake dawn for guests or bait for hunters.",
    pathway: "hybrid",
    earn: {
      requiresStructuresBuilt: { lumophore: 1 },
      anyFlags: ["synergy:false-dawn", "synergy:bait-hunt"],
    },
    modifiers: [
      {
        id: "relic-glow",
        mult: { "tag.lure.upkeep.energy": 0.75, "synergy:false-dawn": 1.1 },
        tags: ["relic", "synergy:false-dawn", "synergy:bait-hunt"],
      },
    ],
    unlockStructures: ["lumophore"],
    permanent: true,
  },
  {
    id: "nest_whisper",
    name: "Nest Whisper",
    description:
      "Brood memory softens the predator spike from the first nest after drift.",
    goalHint: "Build a Brood Nest next to a Bud.",
    pathway: "colonial",
    earn: {
      requiresStructuresBuilt: { nest: 1, bud: 1 },
      anyFlags: ["synergy:brood-nest", "synergy:pressure-bloom"],
    },
    modifiers: [
      {
        id: "relic-nest",
        mult: { "synergy:brood-nest": 1.1, "env.predatorPressure.from.nest": 0.8 },
        tags: ["relic", "pathway:colonial", "synergy:brood-nest"],
      },
    ],
    unlockStructures: ["nest"],
    permanent: true,
  },
  {
    id: "first_wake",
    name: "First Wake",
    description:
      "Starter lineage relic — always available on first drift if midgame was seen. Soft energy cushion after reset.",
    goalHint: "Reach midgame (first adaptation or chamber depth), then Drift.",
    pathway: "prestige",
    earn: {
      requiresFlags: ["seen_midgame"],
      minGeneticLifetime: 10,
    },
    modifiers: [
      {
        id: "relic-first-wake",
        add: { "start.energy": 2, "start.nutrients": 2 },
        mult: { "tag.starter.produce.nutrients": 1.1 },
        tags: ["relic", "prestige"],
      },
    ],
    permanent: true,
  },
];

export const SPORE_DRIFT: PrestigeTrackDef = {
  id: "sporeDrift",
  name: "Spore Drift",
  description:
    "Release the colony as drifting spores. Biomass and most resources reset; relics and pathway unlocks endure. Genetic keeps a fraction of lifetime earned.",
  visibleWhen: {
    minTime: 720,
    minGeneticLifetime: 16,
    minBiomassPeak: 50,
    anyFlags: ["prestige_ready", "seen_prestige_ui"],
    // do NOT require stockpile genetic — adaptations spend it
  },
  driftCost: {
    minBiomass: 35,
    minGeneticLifetime: 16,
    minGeneticStockpile: 2,
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
      unlockFlags: ["prestige_1", "seen_prestige_ui", "first_wake_earned"],
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
  midgameGoals: [
    {
      id: "goal_fork",
      title: "Choose a tide",
      body: "Take a pathway adaptation or land a fork structure (sensor, symbiont, bacteria, bud, gland).",
      completeWhen: { hasFlags: ["seen_midgame", "pathway_committed"] },
    },
    {
      id: "goal_composition",
      title: "Compose, don't just upgrade",
      body: "Trigger any major synergy — Waste Loop, Sensor Hunt, Photo-Shield, Vessel Grid, or Colonial Bloom.",
      completeWhen: { hasFlags: ["pathway_committed"] },
    },
    {
      id: "goal_relic_path",
      title: "Leave a memory",
      body: "Meet one relic goal (journal shows pathway badges). Relics survive Spore Drift.",
      completeWhen: {
        hasRelic: [
          "echo_chloroplast",
          "fang_memory",
          "loop_cyst",
          "colony_spore",
          "thrift_shell",
          "first_wake",
        ],
      },
    },
    {
      id: "goal_vault_or_ready",
      title: "Bank the lineage",
      body: "Hit prestige_ready (lifetime genetic ≥16 or Spore Vault) — the Drift panel opens.",
      completeWhen: { hasFlags: ["prestige_ready", "seen_prestige_ui"] },
    },
    {
      id: "goal_first_drift",
      title: "Spore Drift",
      body: "Release spores when ready. Keep relics + pathway unlocks; genetic keeps ~25%.",
      completeWhen: { hasFlags: ["prestige_1"] },
    },
  ],
};

/** Suggested autopilot / harness — use lifetime genetic, never stockpile alone */
export const PRESTIGE_BALANCE = {
  visibleTargetMinutes: [12, 15],
  firstDriftTargetMinutes: [14, 18],
  geneticLifetimeVisible: 16,
  geneticLifetimeDrift: 16,
  geneticStockpileFloor: 2,
  geneticFractionBase: 0.25,
  geneticFractionPerVaultRelic: 0.05,
  maxGeneticFraction: 0.45,
  /** Harness must set these flags via PRESTIGE_SIGNALS, not G≥15 stockpile */
  requiredFlagsForVisible: ["prestige_ready", "seen_prestige_ui"] as const,
} as const;
