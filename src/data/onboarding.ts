/**
 * First ~10 minutes — milestone hints, not a tutorial wall.
 * First 60s: absorb → digest → tentacle. Then pathway teases.
 */
import type { OnboardingHint } from "./types.ts";

export const ONBOARDING_HINTS: OnboardingHint[] = [
  {
    id: "absorb_start",
    atTime: 0,
    title: "Drink the water",
    body: "Your Absorber slowly pulls nutrients. Watch the stock climb — you'll need a gut next.",
    completeWhen: { hasResources: { nutrients: 4 } },
    highlight: "absorber",
  },
  {
    id: "grow_tentacle",
    atTime: 45,
    title: "Reach farther",
    body: "Grow a Tentacle when you can. It feeds faster but burns energy — don't spam idle arms.",
    completeWhen: { hasStructures: { tentacle: 1 } },
    highlight: "tentacle",
  },
  {
    id: "build_chamber",
    atTime: 90,
    title: "Digest, don't hoard",
    body: "A Digestive Chamber turns nutrients into energy — and waste. Energy grows structures; waste will matter soon.",
    completeWhen: { hasStructures: { chamber: 1 } },
    highlight: "chamber",
  },
  {
    id: "waste_awareness",
    atTime: 150,
    title: "Waste is a resource",
    body: "Toxicity rises if waste pools. Bacteria or a Detrital Symbiont close the loop into nutrients again.",
    completeWhen: {
      hasStructures: { bacteria: 1 },
      hasSynergy: ["waste_loop"],
    },
    highlight: "grow",
  },
  {
    id: "first_fork_tease",
    atTime: 240,
    title: "A fork in the tide",
    body: "Genetic points unlock adaptations. Predators hunt currents; photosymbionts ride light; recyclers thrive on mess.",
    completeWhen: { hasAdaptations: ["grasp_reflex", "chloroplast_bloom", "mutual_gut", "tight_cycles"] },
    highlight: "adapt",
  },
  {
    id: "membrane_or_sensor",
    atTime: 300,
    title: "Armor or aim",
    body: "Membranes blunt predators and storms. Sensors make tentacles lethal in current — pick a bias, or split thin.",
    completeWhen: { hasStructures: { membrane: 1 }, hasSynergy: ["sensor_hunt"] },
    highlight: "grow",
  },
  {
    id: "env_cycle_notice",
    atTime: 360,
    title: "The water changes",
    body: "Light, current, and heat cycle. Builds that shone at noon may stall at night — composition beats one trick.",
    completeWhen: { hasFlags: ["seen_env_phase_change"] },
    highlight: "env",
  },
  {
    id: "vessel_hint",
    atTime: 420,
    title: "Connect the body",
    body: "Transport Vessels look weak alone. Pair them — specialised clusters wake up when the grid links.",
    completeWhen: { hasSynergy: ["vessel_grid"] },
    highlight: "grow",
  },
  {
    id: "bud_tease",
    atTime: 480,
    title: "Leave a daughter",
    body: "Buds spend biomass and genetic to reproduce. Inherit gut + guests under bright water for a bloom — or ferment in the dark.",
    completeWhen: { hasStructures: { bud: 1 } },
    highlight: "grow",
  },
  {
    id: "synergy_journal",
    atTime: 540,
    title: "Composition, not upgrades",
    body: "Photo-Shield, Sensor Hunt, Waste Loop — these aren't shop items. They appear when parts touch.",
    completeWhen: {
      hasSynergy: ["waste_loop", "photo_shield", "sensor_hunt", "colonial_bloom"],
    },
    highlight: "adapt",
  },
  {
    id: "prestige_horizon",
    atTime: 660,
    title: "Spore Drift on the horizon",
    body: "When biomass and genetic crest, you can release spores. Relics keep pathway memory — the colony resets, the lineage doesn't.",
    completeWhen: { hasFlags: ["seen_prestige_ui"] },
    highlight: "prestige",
  },
  {
    id: "fork_reminder",
    atTime: 600,
    title: "Every build is a fork",
    body: "Nests cheapen daughters but call predators. Lumophores fake dawn or bait hunts. Filters drink current without thrashing — if the water moves.",
    completeWhen: {
      hasStructures: { nest: 1 },
      hasSynergy: ["false_dawn", "bait_hunt", "filter_rim"],
    },
    highlight: "grow",
  },
];

/** Strict first-minute script for UI sequencing */
export const FIRST_60S = [
  "absorb_start",
  "grow_tentacle",
  "build_chamber",
] as const;

export const ONBOARDING_BALANCE = {
  tentacleTargetSec: [60, 120],
  chamberTargetSec: [120, 180],
  firstAdaptationSec: [300, 480],
  prestigeHintSec: [660, 900],
} as const;
