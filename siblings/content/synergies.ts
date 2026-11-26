/**
 * Compositional synergies — discovery via building, not menu unlocks.
 * At least 5 brief-required + extras. Each encodes recipe + modifiers.
 */
import type { SynergyDef } from "./types";

export const SYNERGIES: SynergyDef[] = [
  // ─── Brief-required ──────────────────────────────────────────────
  {
    id: "waste_loop",
    name: "Waste Loop",
    description:
      "Chamber effluent feeds bacteria or detrital symbionts, returning nutrients/energy. Closed metabolism — starve the loop and toxicity returns.",
    recipe: {
      minStructures: { chamber: 1 },
      requireTags: ["waste", "digest"],
    },
    modifiers: [
      {
        id: "waste-loop-core",
        mult: {
          "tag.waste.convert.rate": 1.35,
          "tag.digest.convert.efficiency": 1.1,
          "resource.waste.penalty": 0.65,
        },
        tags: ["synergy:waste-loop"],
        when: {
          minStructures: { chamber: 1 },
          adjacentTags: ["waste"],
        },
      },
    ],
    discoveryHint: "Seat gut bacteria beside a chamber and watch waste fall instead of climb.",
  },
  {
    id: "sensor_hunt",
    name: "Sensor Hunt",
    description:
      "Chemosensors aim tentacles and venom. Shines when current or predator pressure rises — quiet water wastes the investment.",
    recipe: {
      minStructures: { sensor: 1 },
      requireTags: ["predation"],
      env: { current: { min: 0.35 } },
    },
    modifiers: [
      {
        id: "sensor-hunt-core",
        mult: {
          "tag.limb.produce.nutrients": 1.4,
          "tag.venom.produce.nutrients": 1.5,
        },
        add: { "tag.sensor.upkeep.energy": -0.05 },
        tags: ["synergy:sensor-hunt"],
        when: {
          minStructures: { sensor: 1, tentacle: 1 },
          env: { current: { min: 0.35 } },
        },
      },
      {
        id: "sensor-hunt-pressure",
        mult: { "tag.venom.produce.nutrients": 1.25 },
        tags: ["synergy:sensor-hunt"],
        when: {
          minStructures: { sensor: 1, venom: 1 },
          env: { predatorPressure: { min: 0.4 } },
        },
      },
    ],
    discoveryHint: "A sensor next to hunting limbs turns murky currents into meals.",
  },
  {
    id: "colonial_bloom",
    name: "Colonial Bloom",
    description:
      "Buds that inherit chamber+symbiont packages explode under high light. Without vessels, daughters compete and collapse.",
    recipe: {
      minStructures: { bud: 1, chamber: 1, symbiont: 1 },
      env: { light: { min: 0.55 } },
    },
    modifiers: [
      {
        id: "colonial-bloom-core",
        mult: {
          "tag.bud.produce.genetic": 1.3,
          "tag.photo.produce.energy": 1.25,
          "tag.digest.convert.rate": 1.15,
        },
        tags: ["synergy:colonial-bloom"],
        when: {
          minStructures: { bud: 1, chamber: 1, symbiont: 1 },
          env: { light: { min: 0.55 } },
        },
      },
      {
        id: "colonial-bloom-crowd",
        mult: { "colony.yield": 0.75 },
        tags: ["synergy:colonial-bloom"],
        when: { minStructures: { bud: 3 } },
      },
    ],
    discoveryHint: "Under bright water, buds carrying gut and guests multiply like reef spawn.",
  },
  {
    id: "vessel_grid",
    name: "Vessel Grid",
    description:
      "Adjacent vessels amplify transport and cut upkeep. Enables specialised clusters (mineral edge, photo core, hunt fringe).",
    recipe: {
      minStructures: { vessel: 2 },
      adjacentTags: ["vessel"],
    },
    modifiers: [
      {
        id: "vessel-grid-core",
        mult: {
          "adjacency.transport": 1.5,
          "tag.vessel.upkeep.energy": 0.7,
          "cluster.specialisation": 1.3,
        },
        tags: ["synergy:vessel-grid"],
        when: { minStructures: { vessel: 2 }, adjacentTags: ["vessel"] },
      },
    ],
    discoveryHint: "Link two vessels — resources start flowing toward specialised neighbors.",
  },
  {
    id: "photo_shield",
    name: "Photo-Shield",
    description:
      "Membrane + symbiont keep photosynthetic yield through disturbance and soft light-stress. Over-membrane still dulls current feeding.",
    recipe: {
      requireTags: ["membrane", "photo"],
      env: { light: { min: 0.3 } },
    },
    modifiers: [
      {
        id: "photo-shield-core",
        mult: {
          "env.disturbance.penalty": 0.55,
          "tag.photo.produce.energy": 1.15,
        },
        tags: ["synergy:photo-shield"],
        when: {
          minStructures: { membrane: 1, symbiont: 1 },
          env: { light: { min: 0.3 } },
        },
      },
      {
        id: "photo-shield-storm",
        mult: { "tag.photo.produce.energy": 1.2 },
        tags: ["synergy:photo-shield"],
        when: {
          minStructures: { membrane: 1, symbiont: 1 },
          env: { disturbance: { min: 0.4 } },
        },
      },
    ],
    discoveryHint: "Veil your guests — storms dim the reef less when membrane hugs symbionts.",
  },

  // ─── Extras ──────────────────────────────────────────────────────
  {
    id: "mineral_spine",
    name: "Mineral Spine",
    description:
      "Mineral glands on vessel edges feed venom/membrane without starving the core. Pure absorbers on the same edge fight for current.",
    recipe: {
      minStructures: { mineral_gland: 1, vessel: 1 },
      adjacentTags: ["vessel"],
    },
    modifiers: [
      {
        id: "mineral-spine-core",
        mult: {
          "tag.minerals.produce.minerals": 1.4,
          "tag.venom.cost.minerals": 0.85,
          "tag.membrane.cost.minerals": 0.85,
        },
        tags: ["synergy:mineral-spine", "synergy:vessel-grid"],
        when: {
          minStructures: { mineral_gland: 1, vessel: 1 },
          adjacentTags: ["vessel"],
        },
      },
    ],
    discoveryHint: "Park a mineral gland on a vessel fringe to arm venom without gutting the core.",
  },
  {
    id: "ferment_commune",
    name: "Ferment Commune",
    description:
      "Colonial buds + waste loop: daughters spawn pre-seeded with bacteria. Dim-light colonial play that rivals photo bloom.",
    recipe: {
      minStructures: { bud: 1, bacteria: 1, chamber: 1 },
      requireTags: ["waste", "colonial"],
    },
    modifiers: [
      {
        id: "ferment-commune-core",
        mult: {
          "synergy:waste-loop": 1.2,
          "tag.bud.upkeep.nutrients": 0.8,
          "tag.photo.produce.energy": 0.9,
        },
        tags: ["synergy:ferment-commune", "synergy:waste-loop", "synergy:colonial-bloom"],
        when: { minStructures: { bud: 1, bacteria: 1, chamber: 1 } },
      },
    ],
    discoveryHint: "Bud beside a fermented chamber — daughters arrive already digesting waste.",
  },
  {
    id: "night_ambush",
    name: "Night Ambush",
    description:
      "Low light + sensors + venom: predation peaks when photo collapses. Rewards dual-path readiness.",
    recipe: {
      minStructures: { sensor: 1, venom: 1 },
      env: { light: { max: 0.35 } },
    },
    modifiers: [
      {
        id: "night-ambush-core",
        mult: {
          "tag.venom.produce.nutrients": 1.7,
          "tag.sensor.upkeep.energy": 1.2,
        },
        tags: ["synergy:night-ambush", "synergy:sensor-hunt"],
        when: {
          minStructures: { sensor: 1, venom: 1 },
          env: { light: { max: 0.35 } },
        },
      },
    ],
    discoveryHint: "When the glow fades, venom guided by sensors owns the night water.",
  },
  {
    id: "thermal_gut",
    name: "Thermal Gut",
    description:
      "Warm phases boost chamber+bacteria conversion; cold snaps reverse it. Metabolic path rides the thermometer.",
    recipe: {
      minStructures: { chamber: 1, bacteria: 1 },
      env: { temperature: { min: 0.6 } },
    },
    modifiers: [
      {
        id: "thermal-gut-hot",
        mult: { "tag.digest.convert.rate": 1.3, "tag.waste.convert.rate": 1.25 },
        tags: ["synergy:thermal-gut"],
        when: {
          minStructures: { chamber: 1, bacteria: 1 },
          env: { temperature: { min: 0.6 } },
        },
      },
      {
        id: "thermal-gut-cold",
        mult: { "tag.digest.convert.rate": 0.75 },
        tags: ["synergy:thermal-gut"],
        when: {
          minStructures: { chamber: 1 },
          env: { temperature: { max: 0.3 } },
        },
      },
    ],
    discoveryHint: "Heat wakes the gut — cold makes even full chambers sluggish.",
  },

  // ─── More compositional extras ───────────────────────────────────
  {
    id: "armored_loop",
    name: "Armored Loop",
    description:
      "Membrane wrapping a waste pair softens toxicity shocks during detritus events. Feed current through the veil drops.",
    recipe: {
      requireTags: ["membrane", "waste", "digest"],
      minStructures: { membrane: 1, chamber: 1 },
    },
    modifiers: [
      {
        id: "armored-loop-core",
        mult: {
          "resource.waste.penalty": 0.5,
          "synergy:waste-loop": 1.15,
          "tag.feed.produce.nutrients": 0.85,
        },
        tags: ["synergy:armored-loop", "synergy:waste-loop", "synergy:photo-shield"],
        when: {
          minStructures: { membrane: 1, chamber: 1 },
          adjacentTags: ["waste", "membrane"],
        },
      },
    ],
    discoveryHint: "Wrap your fermenting gut in membrane when the detritus rain hits.",
  },
  {
    id: "hunt_grid",
    name: "Hunt Grid",
    description:
      "Vessels linking sensors to fringe tentacles/venom. Predation bonuses travel; core stays specialised.",
    recipe: {
      minStructures: { vessel: 1, sensor: 1, tentacle: 1 },
      adjacentTags: ["vessel", "sensor"],
    },
    modifiers: [
      {
        id: "hunt-grid-core",
        mult: {
          "synergy:sensor-hunt": 1.25,
          "adjacency.transport.predation": 1.4,
          "tag.core.upkeep.energy": 1.1,
        },
        tags: ["synergy:hunt-grid", "synergy:sensor-hunt", "synergy:vessel-grid"],
        when: {
          minStructures: { vessel: 1, sensor: 1 },
          adjacentTags: ["vessel"],
        },
      },
    ],
    discoveryHint: "Pipe sensor signals through vessels to hunting limbs on the rim.",
  },
  {
    id: "bloom_shield",
    name: "Bloom Shield",
    description:
      "Colonial bloom under membrane: daughters keep photo yield in disturbance. Bud costs rise — quality over spam.",
    recipe: {
      minStructures: { bud: 1, membrane: 1, symbiont: 1 },
      env: { light: { min: 0.45 } },
    },
    modifiers: [
      {
        id: "bloom-shield-core",
        mult: {
          "synergy:colonial-bloom": 1.2,
          "synergy:photo-shield": 1.2,
          "tag.bud.cost.biomass": 1.2,
        },
        tags: ["synergy:bloom-shield", "synergy:colonial-bloom", "synergy:photo-shield"],
        when: {
          minStructures: { bud: 1, membrane: 1, symbiont: 1 },
          env: { disturbance: { min: 0.2 } },
        },
      },
    ],
    discoveryHint: "Shielded buds weather storms without losing their inherited guests.",
  },
  {
    id: "lean_recycle",
    name: "Lean Recycle",
    description:
      "During lean water, waste-loop + absorbers outperform tentacle spam. Rich plumes invert the advantage.",
    recipe: {
      minStructures: { absorber: 1, bacteria: 1, chamber: 1 },
      env: { ambientNutrients: { max: 0.4 } },
    },
    modifiers: [
      {
        id: "lean-recycle-lean",
        mult: {
          "synergy:waste-loop": 1.35,
          "tag.starter.produce.nutrients": 1.25,
          "tag.limb.produce.nutrients": 0.8,
        },
        tags: ["synergy:lean-recycle", "synergy:waste-loop"],
        when: {
          minStructures: { absorber: 1, bacteria: 1 },
          env: { ambientNutrients: { max: 0.4 } },
        },
      },
      {
        id: "lean-recycle-rich",
        mult: {
          "tag.limb.produce.nutrients": 1.2,
          "synergy:waste-loop": 0.9,
        },
        tags: ["synergy:lean-recycle"],
        when: { env: { ambientNutrients: { min: 0.7 } } },
      },
    ],
    discoveryHint: "When the soup thins, quiet absorbers plus gut bacteria beat thrashing arms.",
  },
  {
    id: "spore_pressure",
    name: "Spore Pressure",
    description:
      "Spore Vault + bud under predator pressure: genetic spikes as the colony 'learns fear'. Peaceful water idles the vault.",
    recipe: {
      minStructures: { spore_vault: 1, bud: 1 },
      env: { predatorPressure: { min: 0.45 } },
    },
    modifiers: [
      {
        id: "spore-pressure-core",
        mult: {
          "tag.prestige.produce.genetic": 1.5,
          "tag.bud.produce.genetic": 1.2,
          "tag.defense": 0.9,
        },
        tags: ["synergy:spore-pressure"],
        when: {
          minStructures: { spore_vault: 1, bud: 1 },
          env: { predatorPressure: { min: 0.45 } },
        },
      },
    ],
    discoveryHint: "Fear writes into the vault — predator fronts are genetic weather.",
  },
  {
    id: "dual_symbiont",
    name: "Dual Symbiont",
    description:
      "Photo symbiont + detrital symbiont on one chamber: day energy and waste recycle. Double guest tax; absorber income dips.",
    recipe: {
      minStructures: { symbiont: 1, waste_symbiont: 1, chamber: 1 },
    },
    modifiers: [
      {
        id: "dual-symbiont-core",
        mult: {
          "tag.photo.produce.energy": 1.15,
          "synergy:waste-loop": 1.2,
          "tag.symbiont.upkeep.nutrients": 1.4,
          "tag.feed.produce.nutrients": 0.85,
        },
        tags: ["synergy:dual-symbiont", "synergy:waste-loop"],
        when: { minStructures: { symbiont: 1, waste_symbiont: 1, chamber: 1 } },
      },
    ],
    discoveryHint: "Host both guests on one gut — brilliant, hungry, and fragile.",
  },
];

export const SYNERGIES_BY_ID: Record<string, SynergyDef> = Object.fromEntries(
  SYNERGIES.map((s) => [s.id, s]),
);

/** Brief checklist — all must be implemented in content */
export const REQUIRED_SYNERGY_IDS = [
  "waste_loop",
  "sensor_hunt",
  "colonial_bloom",
  "vessel_grid",
  "photo_shield",
] as const;

export const EXTRA_SYNERGY_IDS = [
  "mineral_spine",
  "ferment_commune",
  "night_ambush",
  "thermal_gut",
  "armored_loop",
  "hunt_grid",
  "bloom_shield",
  "lean_recycle",
  "spore_pressure",
  "dual_symbiont",
] as const;
