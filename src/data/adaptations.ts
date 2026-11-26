/**
 * Pathway adaptations — each has a real trade-off, not pure uplift.
 * Hybrids exist but penalise pure-path multipliers so forks stay meaningful.
 */
import type { AdaptationDef } from "../sim/interfaces.ts";

export const ADAPTATIONS: AdaptationDef[] = [
  // ─── Predatory ───────────────────────────────────────────────────
  {
    id: "grasp_reflex",
    name: "Grasp Reflex",
    description:
      "Tentacles snatch faster in current. Burns more energy when idle — restless hunters pay rent.",
    pathway: "predatory",
    costGenetic: 4,
    modifiers: [
      {
        id: "grasp-feed",
        mult: { "tag.feed.produce.nutrients": 1.35, "tag.limb.upkeep.energy": 1.4 },
        tags: ["pathway:predatory"],
      },
    ],
    unlockStructures: ["sensor"],
  },
  {
    id: "ambush_venom",
    name: "Ambush Venom",
    description:
      "Venom bursts scale with predator pressure. Raises waste toxicity — need a sink or choke.",
    pathway: "predatory",
    costGenetic: 8,
    modifiers: [
      {
        id: "ambush-burst",
        mult: { "tag.venom.produce.nutrients": 1.55, "tag.venom.produce.waste": 1.45 },
        tags: ["pathway:predatory", "synergy:sensor-hunt"],
        when: { env: { predatorPressure: { min: 0.3 } } },
      },
    ],
    unlockStructures: ["venom"],
  },
  {
    id: "hunter_memory",
    name: "Hunter Memory",
    description:
      "Sensors bank genetic from successful strikes. Photo structures yield less — eyes for the dark, not the sun.",
    pathway: "predatory",
    costGenetic: 12,
    modifiers: [
      {
        id: "hunter-memory",
        mult: {
          "tag.sensor.produce.genetic": 1.8,
          "tag.photo.produce.energy": 0.75,
        },
        tags: ["pathway:predatory"],
      },
    ],
    permanentRelic: true,
  },

  // ─── Photosynthetic ──────────────────────────────────────────────
  {
    id: "chloroplast_bloom",
    name: "Chloroplast Bloom",
    description:
      "Symbionts flood energy in high light. Night phases hit harder — store or diversify.",
    pathway: "photo",
    costGenetic: 4,
    modifiers: [
      {
        id: "chloro-day",
        mult: { "tag.photo.produce.energy": 1.5 },
        tags: ["pathway:photo"],
        when: { env: { light: { min: 0.5 } } },
      },
      {
        id: "chloro-night",
        mult: { "tag.photo.produce.energy": 0.55 },
        tags: ["pathway:photo"],
        when: { env: { light: { max: 0.35 } } },
      },
    ],
    unlockStructures: ["symbiont"],
  },
  {
    id: "light_armor",
    name: "Light Armor",
    description:
      "Membranes preserve photo yield through disturbance. Thick veils slow ambient nutrient intake.",
    pathway: "photo",
    costGenetic: 7,
    modifiers: [
      {
        id: "light-armor",
        mult: {
          "synergy:photo-shield": 1.25,
          "tag.feed.produce.nutrients": 0.85,
        },
        tags: ["pathway:photo", "synergy:photo-shield"],
      },
    ],
  },
  {
    id: "solar_vaulting",
    name: "Solar Vaulting",
    description:
      "Buds inherit photo traits aggressively under bloom light. Predation limbs cost more biomass.",
    pathway: "photo",
    costGenetic: 11,
    modifiers: [
      {
        id: "solar-vault",
        mult: {
          "tag.bud.produce.genetic": 1.35,
          "tag.predation.cost.biomass": 1.3,
        },
        tags: ["pathway:photo", "synergy:colonial-bloom"],
        when: { env: { light: { min: 0.55 } } },
      },
    ],
    permanentRelic: true,
  },

  // ─── Symbiotic / waste-loop ──────────────────────────────────────
  {
    id: "mutual_gut",
    name: "Mutual Gut",
    description:
      "Waste converters run hotter beside chambers. Clean colonies starve the partnership.",
    pathway: "symbiotic",
    costGenetic: 4,
    modifiers: [
      {
        id: "mutual-gut",
        mult: { "tag.waste.convert.rate": 1.4, "tag.digest.produce.waste": 1.15 },
        tags: ["pathway:symbiotic", "synergy:waste-loop"],
      },
    ],
    unlockStructures: ["waste_symbiont", "bacteria"],
  },
  {
    id: "toxin_bargain",
    name: "Toxin Bargain",
    description:
      "High waste becomes fuel instead of throttle — until a hard cap. Mineral income dips.",
    pathway: "symbiotic",
    costGenetic: 8,
    modifiers: [
      {
        id: "toxin-bargain",
        mult: {
          "resource.waste.penalty": 0.5,
          "tag.waste.convert.efficiency": 1.2,
          "produce.minerals": 0.8,
        },
        tags: ["pathway:symbiotic"],
      },
    ],
  },
  {
    id: "guest_lineage",
    name: "Guest Lineage",
    description:
      "Symbionts persist through Spore Drift as soft relics. Host biomass growth slows slightly.",
    pathway: "symbiotic",
    costGenetic: 13,
    modifiers: [
      {
        id: "guest-lineage",
        mult: { "tag.symbiont.produce.energy": 1.2, "gain.biomass": 0.9 },
        tags: ["pathway:symbiotic"],
      },
    ],
    permanentRelic: true,
  },

  // ─── Colonial ────────────────────────────────────────────────────
  {
    id: "budding_rhythm",
    name: "Budding Rhythm",
    description:
      "Buds cheaper under stable temperature. Crowding without vessels slashes all yields.",
    pathway: "colonial",
    costGenetic: 5,
    modifiers: [
      {
        id: "bud-rhythm",
        mult: { "tag.bud.cost.biomass": 0.75 },
        tags: ["pathway:colonial"],
        when: { env: { temperature: { min: 0.35, max: 0.7 } } },
      },
      {
        id: "bud-crowd-tax",
        mult: { "colony.yield": 0.7 },
        tags: ["pathway:colonial"],
        when: { minStructures: { bud: 3 }, adjacentTags: [] },
      },
    ],
    unlockStructures: ["bud"],
  },
  {
    id: "vessel_instinct",
    name: "Vessel Instinct",
    description:
      "Adjacent vessels share upkeep. Isolated vessels become energy sinks.",
    pathway: "colonial",
    costGenetic: 7,
    modifiers: [
      {
        id: "vessel-instinct-grid",
        mult: { "synergy:vessel-grid": 1.3, "tag.vessel.upkeep.energy": 0.7 },
        tags: ["pathway:colonial", "synergy:vessel-grid"],
        when: { adjacentTags: ["vessel"] },
      },
      {
        id: "vessel-instinct-alone",
        mult: { "tag.vessel.upkeep.energy": 1.6 },
        tags: ["pathway:colonial"],
        when: { adjacentTags: ["!vessel"] },
      },
    ],
    unlockStructures: ["vessel"],
  },
  {
    id: "polyp_city",
    name: "Polyp City",
    description:
      "Daughter buds inherit chamber+symbiont packages. Genetic income from novelty falls — conformity tax.",
    pathway: "colonial",
    costGenetic: 14,
    modifiers: [
      {
        id: "polyp-city",
        mult: {
          "synergy:colonial-bloom": 1.4,
          "produce.genetic": 0.75,
        },
        tags: ["pathway:colonial", "synergy:colonial-bloom"],
      },
    ],
    permanentRelic: true,
  },

  // ─── Metabolic ───────────────────────────────────────────────────
  {
    id: "tight_cycles",
    name: "Tight Cycles",
    description:
      "All convert efficiencies rise; raw produce rates fall. Think processors, not harvesters.",
    pathway: "metabolic",
    costGenetic: 4,
    modifiers: [
      {
        id: "tight-cycles",
        mult: { "convert.efficiency": 1.25, "produce.*": 0.85 },
        tags: ["pathway:metabolic"],
      },
    ],
    unlockStructures: ["bacteria"],
  },
  {
    id: "heat_tolerant",
    name: "Heat Tolerant",
    description:
      "Temperature swings stop punishing digestion. Light affinity softens — photo path less tempting.",
    pathway: "metabolic",
    costGenetic: 7,
    modifiers: [
      {
        id: "heat-tolerant",
        mult: { "env.temperature.penalty": 0.4, "tag.photo.envAffinity.light": 0.7 },
        tags: ["pathway:metabolic"],
      },
    ],
  },
  {
    id: "mineral_thrift",
    name: "Mineral Thrift",
    description:
      "Venom and membrane cost fewer minerals. Waste conversion slows — thrift vs recycle fork.",
    pathway: "metabolic",
    costGenetic: 10,
    modifiers: [
      {
        id: "mineral-thrift",
        mult: {
          "tag.venom.cost.minerals": 0.7,
          "tag.membrane.cost.minerals": 0.7,
          "tag.waste.convert.rate": 0.8,
        },
        tags: ["pathway:metabolic", "synergy:mineral-spine"],
      },
    ],
    permanentRelic: true,
  },

  // ─── Hybrid (deliberate compromises) ─────────────────────────────
  {
    id: "reef_hunter",
    name: "Reef Hunter",
    description:
      "Photo energy fuels predation bursts. Neither path reaches pure peak — a coastal generalist.",
    pathway: "hybrid",
    costGenetic: 10,
    modifiers: [
      {
        id: "reef-hunter",
        mult: {
          "tag.photo.produce.energy": 1.15,
          "tag.predation.produce.nutrients": 1.15,
          "pathway.pure.bonus": 0.7,
        },
        tags: ["pathway:hybrid"],
        when: { env: { light: { min: 0.4 }, current: { min: 0.3 } } },
      },
    ],
  },
  {
    id: "commune_ferment",
    name: "Commune Ferment",
    description:
      "Colonial buds + waste loop: daughters spawn with bacteria. Light bloom synergy weakens.",
    pathway: "hybrid",
    costGenetic: 12,
    modifiers: [
      {
        id: "commune-ferment",
        mult: {
          "synergy:waste-loop": 1.25,
          "synergy:colonial-bloom": 0.85,
          "tag.bud.inherit.bacteria": 1,
        },
        tags: ["pathway:hybrid", "synergy:waste-loop", "synergy:ferment-commune"],
      },
    ],
  },

  // ─── Expanded trade-off adaptations ──────────────────────────────
  {
    id: "current_sail",
    name: "Current Sail",
    description:
      "Membranes catch shear as mild nutrient intake. Storms slap harder — sail or shield, not both at peak.",
    pathway: "predatory",
    costGenetic: 6,
    modifiers: [
      {
        id: "current-sail",
        mult: {
          "tag.membrane.produce.nutrients": 1,
          "tag.feed.from.current": 1.25,
          "env.disturbance.penalty": 1.35,
        },
        add: { "tag.membrane.produce.nutrients": 0.15 },
        tags: ["pathway:predatory"],
        when: { env: { current: { min: 0.45 } } },
      },
    ],
  },
  {
    id: "venom_thrift_swap",
    name: "Venom–Thrift Swap",
    description:
      "Venom sacs refund a sliver of minerals on kill bursts. Waste spike doubles — recyclers become mandatory.",
    pathway: "predatory",
    costGenetic: 9,
    modifiers: [
      {
        id: "venom-thrift-swap",
        mult: {
          "tag.venom.produce.nutrients": 1.2,
          "tag.venom.produce.waste": 2.0,
          "tag.venom.cost.minerals": 0.85,
        },
        tags: ["pathway:predatory", "synergy:waste-loop"],
      },
    ],
  },
  {
    id: "shade_debt",
    name: "Shade Debt",
    description:
      "Photo structures bank surplus energy into a shade buffer spent at night. Day yields clipped 10%.",
    pathway: "photo",
    costGenetic: 6,
    modifiers: [
      {
        id: "shade-debt-day",
        mult: { "tag.photo.produce.energy": 0.9 },
        add: { "buffer.shade": 0.2 },
        tags: ["pathway:photo"],
        when: { env: { light: { min: 0.5 } } },
      },
      {
        id: "shade-debt-night",
        mult: { "tag.photo.produce.energy": 1.4 },
        tags: ["pathway:photo"],
        when: { env: { light: { max: 0.3 } } },
      },
    ],
  },
  {
    id: "guest_tax",
    name: "Guest Tax",
    description:
      "More symbionts raise energy but levy a nutrient tithe. Fail the tithe and guests go dormant (not dead).",
    pathway: "photo",
    costGenetic: 9,
    modifiers: [
      {
        id: "guest-tax",
        mult: {
          "tag.symbiont.produce.energy": 1.3,
          "tag.symbiont.upkeep.nutrients": 1.5,
        },
        tags: ["pathway:photo", "pathway:symbiotic"],
      },
    ],
  },
  {
    id: "overflow_valve",
    name: "Overflow Valve",
    description:
      "At high waste, auto-vent to ambient at the cost of minerals. Prevents hard choke; bleeds scarce grit.",
    pathway: "symbiotic",
    costGenetic: 6,
    modifiers: [
      {
        id: "overflow-valve",
        mult: { "resource.waste.penalty": 0.4 },
        add: { "produce.minerals": -0.04 },
        tags: ["pathway:symbiotic"],
        when: { env: {} },
      },
    ],
  },
  {
    id: "partner_lock",
    name: "Partner Lock",
    description:
      "Waste-loop adjacency becomes mandatory for chamber efficiency. Solo chambers limp — commit to the pair.",
    pathway: "symbiotic",
    costGenetic: 10,
    modifiers: [
      {
        id: "partner-lock-paired",
        mult: { "tag.digest.convert.efficiency": 1.35 },
        tags: ["pathway:symbiotic", "synergy:waste-loop"],
        when: { adjacentTags: ["waste"] },
      },
      {
        id: "partner-lock-solo",
        mult: { "tag.digest.convert.efficiency": 0.65 },
        tags: ["pathway:symbiotic"],
        when: { minStructures: { chamber: 1 } },
      },
    ],
  },
  {
    id: "signal_cascade",
    name: "Signal Cascade",
    description:
      "Each vessel neighbor boosts bud genetic tick. Isolated buds stall — grid or bust.",
    pathway: "colonial",
    costGenetic: 8,
    modifiers: [
      {
        id: "signal-cascade",
        mult: { "tag.bud.produce.genetic": 1.45, "synergy:vessel-grid": 1.15 },
        tags: ["pathway:colonial", "synergy:vessel-grid"],
        when: { adjacentTags: ["vessel"] },
      },
      {
        id: "signal-cascade-alone",
        mult: { "tag.bud.produce.genetic": 0.6 },
        tags: ["pathway:colonial"],
        when: { minStructures: { bud: 1 } },
      },
    ],
  },
  {
    id: "thin_walls",
    name: "Thin Walls",
    description:
      "Membranes cost less biomass but lose predator mitigation. Colonial sprawl over armor.",
    pathway: "colonial",
    costGenetic: 6,
    modifiers: [
      {
        id: "thin-walls",
        mult: {
          "tag.membrane.cost.biomass": 0.7,
          "tag.defense": 0.7,
          "tag.bud.cost.biomass": 0.9,
        },
        tags: ["pathway:colonial"],
      },
    ],
  },
  {
    id: "slow_burn",
    name: "Slow Burn",
    description:
      "Upkeep across the colony drops; convert rates crawl. Long-cycle metabolic patience.",
    pathway: "metabolic",
    costGenetic: 6,
    modifiers: [
      {
        id: "slow-burn",
        mult: { "upkeep.*": 0.7, "convert.rate": 0.8, "produce.*": 0.9 },
        tags: ["pathway:metabolic"],
      },
    ],
  },
  {
    id: "catalyst_spike",
    name: "Catalyst Spike",
    description:
      "Short temperature windows double convert rates then inflict waste debt. Ride warm_ebb or suffer.",
    pathway: "metabolic",
    costGenetic: 11,
    modifiers: [
      {
        id: "catalyst-spike",
        mult: {
          "convert.rate": 2.0,
          "tag.digest.produce.waste": 1.8,
        },
        tags: ["pathway:metabolic", "synergy:thermal-gut"],
        when: { env: { temperature: { min: 0.65 } } },
      },
    ],
  },
  {
    id: "dusk_gardener",
    name: "Dusk Gardener",
    description:
      "Photo softens into dusk; predation softens into dawn. A circadian hybrid that never peaks.",
    pathway: "hybrid",
    costGenetic: 9,
    modifiers: [
      {
        id: "dusk-gardener-dusk",
        mult: {
          "tag.photo.produce.energy": 1.2,
          "tag.predation.produce.nutrients": 1.15,
          "pathway.pure.bonus": 0.65,
        },
        tags: ["pathway:hybrid"],
        when: { env: { light: { min: 0.2, max: 0.45 } } },
      },
    ],
  },
  {
    id: "armored_loop",
    name: "Armored Loop",
    description:
      "Membrane adjacency boosts waste converters (shielded ferment). Photo-shield and waste-loop share the veil — current feed suffers.",
    pathway: "hybrid",
    costGenetic: 11,
    modifiers: [
      {
        id: "armored-loop",
        mult: {
          "synergy:waste-loop": 1.2,
          "synergy:photo-shield": 1.15,
          "tag.feed.produce.nutrients": 0.8,
        },
        tags: ["pathway:hybrid", "synergy:armored-loop"],
        when: { adjacentTags: ["membrane", "waste"] },
      },
    ],
  },

  // ─── Fork-enablers (mid/late) ────────────────────────────────────
  {
    id: "still_covenant",
    name: "Still Covenant",
    description:
      "Locks Silent Reef identity: filter/absorber bonuses rise, but any tentacle imposes a harsh upkeep shock. Commit or don't.",
    pathway: "metabolic",
    costGenetic: 9,
    modifiers: [
      {
        id: "still-covenant-keep",
        mult: { "synergy:silent-reef": 1.35, "tag.filter.produce.nutrients": 1.2 },
        tags: ["pathway:metabolic", "synergy:silent-reef"],
        when: { minStructures: { tentacle: 0 } },
      },
      {
        id: "still-covenant-break",
        mult: { "tag.limb.upkeep.energy": 2.0, "synergy:silent-reef": 0.3 },
        tags: ["pathway:metabolic"],
        when: { minStructures: { tentacle: 1 } },
      },
    ],
  },
  {
    id: "cloud_breather",
    name: "Cloud Breather",
    description:
      "Red Tide cloud heals waste penalty further but permanently dims photo affinity. Predatory toxin lifestyle.",
    pathway: "predatory",
    costGenetic: 10,
    modifiers: [
      {
        id: "cloud-breather",
        mult: {
          "synergy:red-tide": 1.3,
          "resource.waste.penalty": 0.7,
          "tag.photo.envAffinity.light": 0.5,
        },
        tags: ["pathway:predatory", "synergy:red-tide"],
      },
    ],
  },
  {
    id: "tagged_body",
    name: "Tagged Body",
    description:
      "Core–Fringe Split reads cleaner: stronger split bonus, nastier mixed penalty. Demands vessel discipline.",
    pathway: "colonial",
    costGenetic: 10,
    modifiers: [
      {
        id: "tagged-body-split",
        mult: { "synergy:core-fringe": 1.35, "cluster.specialisation": 1.25 },
        tags: ["pathway:colonial", "synergy:core-fringe"],
        when: { adjacentTags: ["vessel"] },
      },
      {
        id: "tagged-body-mixed",
        mult: { "colony.yield": 0.65 },
        tags: ["pathway:colonial"],
        when: { minStructures: { vessel: 1 } },
      },
    ],
    unlockStructures: ["vessel"],
  },
  {
    id: "weather_scribe",
    name: "Weather Scribe",
    description:
      "Novelty Engine writes faster on phase changes; stable env genetic tick falls harder. Evolution as restlessness.",
    pathway: "hybrid",
    costGenetic: 11,
    modifiers: [
      {
        id: "weather-scribe",
        mult: {
          "synergy:novelty-engine": 1.35,
          "produce.genetic.from.phaseChange": 1.5,
          "produce.genetic.stable": 0.6,
        },
        tags: ["pathway:hybrid", "synergy:novelty-engine"],
      },
    ],
  },
  {
    id: "rim_janitor",
    name: "Rim Janitor",
    description:
      "Fringe Ferment bacteria convert faster; Dual Symbiont guest tax feels worse — push waste architecture to the rim.",
    pathway: "symbiotic",
    costGenetic: 8,
    modifiers: [
      {
        id: "rim-janitor",
        mult: {
          "synergy:fringe-ferment": 1.35,
          "synergy:dual-symbiont": 0.75,
          "adjacency.transport.waste": 1.3,
        },
        tags: ["pathway:symbiotic", "synergy:fringe-ferment"],
      },
    ],
  },
];

export const ADAPTATIONS_BY_ID: Record<string, AdaptationDef> = Object.fromEntries(
  ADAPTATIONS.map((a) => [a.id, a]),
);

/** Suggested unlock order for balance harness autopilots */
export const PATHWAY_ORDER: Record<AdaptationDef["pathway"], string[]> = {
  predatory: [
    "grasp_reflex",
    "current_sail",
    "ambush_venom",
    "venom_thrift_swap",
    "hunter_memory",
  ],
  photo: [
    "chloroplast_bloom",
    "shade_debt",
    "light_armor",
    "guest_tax",
    "solar_vaulting",
  ],
  symbiotic: [
    "mutual_gut",
    "overflow_valve",
    "toxin_bargain",
    "partner_lock",
    "guest_lineage",
  ],
  colonial: [
    "budding_rhythm",
    "thin_walls",
    "vessel_instinct",
    "signal_cascade",
    "polyp_city",
  ],
  metabolic: [
    "tight_cycles",
    "slow_burn",
    "heat_tolerant",
    "mineral_thrift",
    "catalyst_spike",
  ],
  hybrid: [
    "reef_hunter",
    "dusk_gardener",
    "commune_ferment",
    "armored_loop",
    "weather_scribe",
  ],
};

// Extend pathway orders with fork-enablers
PATHWAY_ORDER.predatory.push("cloud_breather");
PATHWAY_ORDER.colonial.push("tagged_body");
PATHWAY_ORDER.metabolic.push("still_covenant");
PATHWAY_ORDER.symbiotic.push("rim_janitor");

/** Lead runtime aliases */
export const ADAPTATION_DEFS = ADAPTATIONS;
export const ADAPTATION_MAP = ADAPTATIONS_BY_ID;
