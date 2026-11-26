/**
 * Compositional synergies — discovery via building, not menu unlocks.
 * At least 5 brief-required + extras. Each encodes recipe + modifiers.
 */
import type { SynergyDef } from "./types.ts";
import type { Modifier } from "../sim/interfaces.ts";

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
  {
    id: "filter_rim",
    name: "Filter Rim",
    description:
      "Filter plates on vessel edges drink current without tentacle energy tax. Still water idles them; they compete with absorbers for the same shear.",
    recipe: {
      minStructures: { filter_plate: 1, vessel: 1 },
      adjacentTags: ["vessel"],
      env: { current: { min: 0.4 } },
    },
    modifiers: [
      {
        id: "filter-rim-core",
        mult: {
          "tag.filter.produce.nutrients": 1.45,
          "tag.starter.produce.nutrients": 0.9,
          "tag.limb.upkeep.energy": 0.9,
        },
        tags: ["synergy:filter-rim", "synergy:vessel-grid"],
        when: {
          minStructures: { filter_plate: 1, vessel: 1 },
          adjacentTags: ["vessel"],
          env: { current: { min: 0.4 } },
        },
      },
    ],
    discoveryHint: "Hang filter plates on the vessel rim where the current bites.",
  },
  {
    id: "brood_nest",
    name: "Brood Nest",
    description:
      "Nests cheapen adjacent buds but raise local predator pressure. Pair with membrane or accept the hunt tax.",
    recipe: {
      minStructures: { nest: 1, bud: 1 },
      adjacentTags: ["bud"],
    },
    modifiers: [
      {
        id: "brood-nest-core",
        mult: {
          "tag.bud.cost.biomass": 0.7,
          "env.predatorPressure": 1.3,
          "synergy:colonial-bloom": 1.1,
        },
        tags: ["synergy:brood-nest", "synergy:colonial-bloom"],
        when: { minStructures: { nest: 1, bud: 1 }, adjacentTags: ["bud"] },
      },
      {
        id: "brood-nest-armored",
        mult: { "env.predatorPressure": 0.85 },
        tags: ["synergy:brood-nest"],
        when: { minStructures: { nest: 1, membrane: 1 } },
      },
    ],
    discoveryHint: "A nest beside a bud births cheaper daughters — and louder predators.",
  },
  {
    id: "false_dawn",
    name: "False Dawn",
    description:
      "Lumophore adjacent to symbionts fakes local light at night. Costs energy; real noon still outshines it.",
    recipe: {
      minStructures: { lumophore: 1, symbiont: 1 },
      env: { light: { max: 0.4 } },
    },
    modifiers: [
      {
        id: "false-dawn-core",
        mult: {
          "tag.photo.produce.energy": 1.3,
          "tag.lure.upkeep.energy": 1.25,
        },
        add: { "local.light": 0.25 },
        tags: ["synergy:false-dawn"],
        when: {
          minStructures: { lumophore: 1, symbiont: 1 },
          env: { light: { max: 0.4 } },
        },
      },
    ],
    discoveryHint: "Light a lumophore beside guests when the real sun is gone.",
  },
  {
    id: "bait_hunt",
    name: "Bait Hunt",
    description:
      "Lumophore beside sensors/venom lures prey into strikes. Raises predator pressure on the colony — bait cuts both ways.",
    recipe: {
      minStructures: { lumophore: 1, sensor: 1 },
      requireTags: ["predation"],
    },
    modifiers: [
      {
        id: "bait-hunt-core",
        mult: {
          "synergy:sensor-hunt": 1.3,
          "tag.venom.produce.nutrients": 1.35,
          "env.predatorPressure": 1.2,
        },
        tags: ["synergy:bait-hunt", "synergy:sensor-hunt", "synergy:night-ambush"],
        when: { minStructures: { lumophore: 1, sensor: 1 } },
      },
    ],
    discoveryHint: "Glow near sensors — prey come looking, and so do things that eat you.",
  },
  {
    id: "anoxic_grid",
    name: "Anoxic Grid",
    description:
      "During low-oxygen pockets, vessel grids + bacteria keep clusters alive while raw feed collapses. Photo path suffers most.",
    recipe: {
      minStructures: { vessel: 2, bacteria: 1 },
      env: { current: { max: 0.25 } },
    },
    modifiers: [
      {
        id: "anoxic-grid-core",
        mult: {
          "synergy:vessel-grid": 1.35,
          "synergy:waste-loop": 1.2,
          "tag.feed.produce.nutrients": 0.7,
          "tag.photo.produce.energy": 0.55,
        },
        tags: ["synergy:anoxic-grid", "synergy:vessel-grid", "synergy:waste-loop"],
        when: {
          minStructures: { vessel: 2, bacteria: 1 },
          env: { current: { max: 0.25 } },
        },
      },
    ],
    discoveryHint: "When the water goes still and thin, linked guts outlive hungry arms.",
  },
  {
    id: "spawn_ferry",
    name: "Spawn Ferry",
    description:
      "Spawn Current event + vessels + buds: daughters migrate along the grid instead of stacking. Needs at least two vessels.",
    recipe: {
      minStructures: { bud: 1, vessel: 2 },
      env: { current: { min: 0.65 } },
    },
    modifiers: [
      {
        id: "spawn-ferry-core",
        mult: {
          "tag.bud.cost.biomass": 0.85,
          "synergy:colonial-bloom": 1.2,
          "colony.crowd.penalty": 0.75,
        },
        tags: ["synergy:spawn-ferry", "synergy:colonial-bloom", "synergy:vessel-grid"],
        when: {
          minStructures: { bud: 1, vessel: 2 },
          env: { current: { min: 0.65 } },
        },
      },
    ],
    discoveryHint: "Ride a spawn current — vessels ferry daughters before they smother each other.",
  },

  // ─── Cross-path / rivalry-aware ──────────────────────────────────
  {
    id: "silent_reef",
    name: "Silent Reef",
    description:
      "No tentacles: membrane + filter plates + absorbers. Quiet current grazing. Sensor Hunt and Bait Hunt refuse to light — you traded teeth for stillness.",
    recipe: {
      minStructures: { membrane: 1, filter_plate: 1, absorber: 2 },
      maxStructures: { tentacle: 0, venom: 0 },
    },
    modifiers: [
      {
        id: "silent-reef-core",
        mult: {
          "tag.filter.produce.nutrients": 1.35,
          "tag.starter.produce.nutrients": 1.25,
          "tag.defense": 1.15,
          "synergy:sensor-hunt": 0.5,
          "synergy:bait-hunt": 0.5,
          "tag.limb.produce.nutrients": 0.6,
        },
        tags: ["synergy:silent-reef", "synergy:filter-rim", "synergy:photo-shield"],
        when: {
          minStructures: { membrane: 1, filter_plate: 1, absorber: 2 },
          maxStructures: { tentacle: 0, venom: 0 },
        },
      },
    ],
    discoveryHint: "Shed your arms — veiled filters graze the shear in silence.",
  },
  {
    id: "red_tide",
    name: "Red Tide",
    description:
      "High waste + venom + toxin bargain: toxicity becomes a weaponised cloud. Chambers without recyclers still choke the host.",
    recipe: {
      minStructures: { venom: 1, chamber: 1 },
      requireTags: ["waste", "venom"],
    },
    modifiers: [
      {
        id: "red-tide-core",
        mult: {
          "tag.venom.produce.nutrients": 1.45,
          "resource.waste.penalty": 0.55,
          "tag.predation.aura": 1.3,
          "tag.photo.produce.energy": 0.7,
          "tag.starter.produce.nutrients": 0.75,
        },
        tags: ["synergy:red-tide", "synergy:sensor-hunt", "synergy:waste-loop"],
        when: { minStructures: { venom: 1, chamber: 1, bacteria: 1 } },
      },
    ],
    discoveryHint: "Let the gut run filthy beside venom — the cloud hunts for you.",
  },
  {
    id: "core_fringe",
    name: "Core–Fringe Split",
    description:
      "Vessel grid with photo/waste core and predation fringe. Both specialisations get a bonus — but only if the rim and core stay tagged apart. Mixing limbs into the core cancels it.",
    recipe: {
      minStructures: { vessel: 2, chamber: 1, tentacle: 1 },
      adjacentTags: ["vessel"],
    },
    modifiers: [
      {
        id: "core-fringe-split",
        mult: {
          "cluster.core.yield": 1.25,
          "cluster.fringe.predation": 1.3,
          "synergy:vessel-grid": 1.15,
        },
        tags: ["synergy:core-fringe", "synergy:vessel-grid", "synergy:hunt-grid"],
        when: {
          minStructures: { vessel: 2 },
          adjacentTags: ["vessel"],
        },
      },
      {
        id: "core-fringe-mixed",
        mult: { "cluster.specialisation": 0.7, "synergy:core-fringe": 0.5 },
        tags: ["synergy:core-fringe"],
        when: { minStructures: { vessel: 1 } },
      },
    ],
    discoveryHint: "Pipe the body: soft core inward, hunting limbs on the rim.",
  },
  {
    id: "guest_guard",
    name: "Guest Guard",
    description:
      "Membrane + dual symbiont: guests survive light storms and detritus spikes. Nutrient tithe rises — the reef feeds its tenants first.",
    recipe: {
      minStructures: { membrane: 1, symbiont: 1, waste_symbiont: 1 },
    },
    modifiers: [
      {
        id: "guest-guard-core",
        mult: {
          "synergy:dual-symbiont": 1.25,
          "synergy:photo-shield": 1.2,
          "synergy:armored-loop": 1.15,
          "tag.feed.produce.nutrients": 0.75,
          "tag.symbiont.upkeep.nutrients": 1.35,
        },
        tags: ["synergy:guest-guard", "synergy:dual-symbiont", "synergy:photo-shield"],
        when: { minStructures: { membrane: 1, symbiont: 1, waste_symbiont: 1 } },
      },
    ],
    discoveryHint: "Veil both guests — they eat first when the weather turns.",
  },
  {
    id: "novelty_engine",
    name: "Novelty Engine",
    description:
      "Sensor + spore vault + shifting env phases: genetic ticks scale with phase changes. Stable builds (pure photo noon camping) starve novelty.",
    recipe: {
      minStructures: { sensor: 1, spore_vault: 1 },
    },
    modifiers: [
      {
        id: "novelty-engine-core",
        mult: {
          "tag.prestige.produce.genetic": 1.4,
          "tag.sensor.produce.genetic": 1.5,
          "produce.genetic.from.phaseChange": 1.6,
        },
        tags: ["synergy:novelty-engine", "synergy:spore-pressure"],
        when: { minStructures: { sensor: 1, spore_vault: 1 } },
      },
      {
        id: "novelty-engine-stale",
        mult: { "produce.genetic": 0.7 },
        tags: ["synergy:novelty-engine"],
        when: { env: { light: { min: 0.7 }, disturbance: { max: 0.15 } } },
      },
    ],
    discoveryHint: "Vault what the sensors notice — boredom starves evolution.",
  },
  {
    id: "lean_armor",
    name: "Lean Armor",
    description:
      "Lean water + membrane + waste loop: survive thin soup without hunting. Rich plumes punish the same build (missed feast + membrane current tax).",
    recipe: {
      minStructures: { membrane: 1, bacteria: 1, chamber: 1 },
      env: { ambientNutrients: { max: 0.4 } },
    },
    modifiers: [
      {
        id: "lean-armor-lean",
        mult: {
          "synergy:lean-recycle": 1.3,
          "synergy:waste-loop": 1.25,
          "tag.defense": 1.15,
          "tag.limb.produce.nutrients": 0.7,
        },
        tags: ["synergy:lean-armor", "synergy:lean-recycle", "synergy:waste-loop"],
        when: {
          minStructures: { membrane: 1, bacteria: 1 },
          env: { ambientNutrients: { max: 0.4 } },
        },
      },
      {
        id: "lean-armor-rich",
        mult: {
          "tag.feed.produce.nutrients": 0.75,
          "synergy:lean-armor": 0.6,
        },
        tags: ["synergy:lean-armor"],
        when: { env: { ambientNutrients: { min: 0.75 } } },
      },
    ],
    discoveryHint: "In lean water, armored guts beat hungry arms — until the plume returns.",
  },
  {
    id: "overveil",
    name: "Overveil",
    description:
      "Anti-synergy warning: 4+ membranes stack defense but crush current feed and filter rim. Soft-caps itself — armor past the peak is a trap.",
    recipe: {
      minStructures: { membrane: 4 },
    },
    modifiers: [
      {
        id: "overveil-trap",
        mult: {
          "tag.defense": 1.4,
          "tag.feed.produce.nutrients": 0.55,
          "synergy:filter-rim": 0.5,
          "tag.filter.produce.nutrients": 0.6,
          "env.current.affinity": 0.5,
        },
        tags: ["synergy:overveil", "anti:overbuild"],
        when: { minStructures: { membrane: 4 } },
      },
    ],
    discoveryHint: "Too many veils — the reef goes blind to the current.",
  },
  {
    id: "fringe_ferment",
    name: "Fringe Ferment",
    description:
      "Bacteria on the vessel fringe (not core) process waste while the core stays photo-clean. Inverts Dual Symbiont crowding — logistics instead of double-guest tax.",
    recipe: {
      minStructures: { bacteria: 1, vessel: 1, symbiont: 1, chamber: 1 },
      adjacentTags: ["vessel", "bacteria"],
    },
    modifiers: [
      {
        id: "fringe-ferment-core",
        mult: {
          "synergy:waste-loop": 1.2,
          "synergy:dual-symbiont": 0.85,
          "tag.photo.produce.energy": 1.1,
          "tag.symbiont.upkeep.nutrients": 0.9,
          "adjacency.transport.waste": 1.4,
        },
        tags: ["synergy:fringe-ferment", "synergy:vessel-grid", "synergy:waste-loop"],
        when: {
          minStructures: { bacteria: 1, vessel: 1, symbiont: 1 },
          adjacentTags: ["vessel"],
        },
      },
    ],
    discoveryHint: "Ship the mess to the rim — keep guests clean in the core.",
  },
  {
    id: "clean_core",
    name: "Clean Core",
    description:
      "Chamber with zero waste structures adjacent — convert efficiency up, but Detritus Rain and Red Tide punish the purity.",
    recipe: {
      minStructures: { chamber: 1 },
      maxStructures: { bacteria: 0, waste_symbiont: 0 },
      forbidAdjacentTags: ["waste"],
    },
    modifiers: [
      {
        id: "clean-core-pure",
        mult: {
          "tag.digest.convert.efficiency": 1.25,
          "synergy:waste-loop": 0.5,
          "synergy:red-tide": 0.6,
          "resource.waste.penalty": 1.35,
        },
        tags: ["synergy:clean-core"],
        when: {
          minStructures: { chamber: 1 },
          maxStructures: { bacteria: 0, waste_symbiont: 0 },
          forbidAdjacentTags: ["waste"],
        },
      },
    ],
    discoveryHint: "Keep the gut sterile — sharp digestion until the mess arrives.",
  },
  {
    id: "pressure_bloom",
    name: "Pressure Bloom",
    description:
      "Odd couple: colonial bloom under predator pressure with membranes. Daughters inherit defense bias; genetic from novelty dips.",
    recipe: {
      minStructures: { bud: 1, membrane: 1, symbiont: 1 },
      env: { predatorPressure: { min: 0.4 }, light: { min: 0.4 } },
    },
    modifiers: [
      {
        id: "pressure-bloom-core",
        mult: {
          "synergy:colonial-bloom": 1.15,
          "synergy:photo-shield": 1.15,
          "tag.bud.inherit.membrane": 1,
          "synergy:novelty-engine": 0.8,
          "tag.defense": 1.2,
        },
        tags: ["synergy:pressure-bloom", "synergy:colonial-bloom", "synergy:brood-nest"],
        when: {
          minStructures: { bud: 1, membrane: 1 },
          env: { predatorPressure: { min: 0.4 } },
        },
      },
    ],
    discoveryHint: "Bloom behind the veil while the water has teeth.",
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
  "filter_rim",
  "brood_nest",
  "false_dawn",
  "bait_hunt",
  "anoxic_grid",
  "spawn_ferry",
  "silent_reef",
  "red_tide",
  "core_fringe",
  "guest_guard",
  "novelty_engine",
  "lean_armor",
  "overveil",
  "fringe_ferment",
  "clean_core",
  "pressure_bloom",
] as const;

/** Pairs that weaken each other when both active — lead applies rivalry mult */
export const SYNERGY_RIVALRIES: Array<{ a: string; b: string; rivalryMult: number; note: string }> = [
  {
    a: "silent_reef",
    b: "sensor_hunt",
    rivalryMult: 0.55,
    note: "Still grazers vs active hunters — picking both dilutes identity.",
  },
  {
    a: "silent_reef",
    b: "bait_hunt",
    rivalryMult: 0.5,
    note: "Bait glow breaks the silent contract.",
  },
  {
    a: "red_tide",
    b: "photo_shield",
    rivalryMult: 0.7,
    note: "Filthy cloud dims shielded guests.",
  },
  {
    a: "dual_symbiont",
    b: "fringe_ferment",
    rivalryMult: 0.8,
    note: "Double-guest core vs rim logistics — pick a waste architecture.",
  },
  {
    a: "brood_nest",
    b: "lean_armor",
    rivalryMult: 0.75,
    note: "Nest predator spike fights lean survival posture.",
  },
  {
    a: "novelty_engine",
    b: "colonial_bloom",
    rivalryMult: 0.85,
    note: "Conformist bloom vs novelty-seeking vault — genetic sources compete.",
  },
  {
    a: "overveil",
    b: "filter_rim",
    rivalryMult: 0.45,
    note: "Overveil is the soft-cap trap for filter rims.",
  },
  {
    a: "core_fringe",
    b: "dual_symbiont",
    rivalryMult: 0.9,
    note: "Mild — dual guests in core is fine; crowding the fringe with guests blurs the split.",
  },
  {
    a: "clean_core",
    b: "waste_loop",
    rivalryMult: 0.4,
    note: "Sterile gut vs closed loop — mutually exclusive identities.",
  },
  {
    a: "pressure_bloom",
    b: "novelty_engine",
    rivalryMult: 0.8,
    note: "Defensive daughters vs restless vault genetics.",
  },
];

/** Flattened modifiers for the tick evaluator */
export const SYNERGY_MODIFIERS: Modifier[] = SYNERGIES.flatMap((s) => s.modifiers);
