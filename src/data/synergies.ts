import type { Modifier } from "../sim/modifiers.ts";

/**
 * Global synergy modifiers evaluated each tick.
 * At least 4 real synergies from the brief.
 */
export const SYNERGY_MODIFIERS: Modifier[] = [
  // 1. Waste loop: chamber waste + bacteria → nutrients
  {
    id: "syn-waste-loop",
    mult: { convert: 1.25, "produce.nutrients": 1.1 },
    when: { minStructures: { chamber: 1, bacteria: 1 } },
    tags: ["synergy", "waste-loop"],
  },
  // 2. Sensor hunt: sensors + tentacles/venom → predation under current/predator
  {
    id: "syn-sensor-hunt",
    mult: { "produce.nutrients": 1.3, "produce.energy": 1.15 },
    when: {
      minStructures: { sensor: 1, tentacle: 1 },
      env: { current: { min: 0.35 } },
    },
    tags: ["synergy", "sensor-hunt"],
  },
  {
    id: "syn-sensor-venom",
    mult: { "produce.nutrients": 1.2 },
    when: {
      minStructures: { sensor: 1, venom: 1 },
      env: { predatorPressure: { min: 0.25 } },
    },
    tags: ["synergy", "sensor-hunt"],
  },
  // 3. Colonial bloom: buds inherit chamber+symbiont under high light
  {
    id: "syn-colonial-bloom",
    mult: { "produce.biomass": 1.45, "produce.genetic": 1.25 },
    when: {
      minStructures: { bud: 1, chamber: 1, symbiont: 1 },
      env: { light: { min: 0.55 } },
    },
    tags: ["synergy", "colonial-bloom"],
  },
  // 4. Vessel grid: adjacent vessels amplify transport (also checked per-structure)
  {
    id: "syn-vessel-grid",
    mult: { produce: 1.1, convert: 1.1 },
    when: { minStructures: { vessel: 2 } },
    tags: ["synergy", "vessel-grid"],
  },
  // 5. Photo-shield: membrane + symbiont keep photo yield in disturbances
  {
    id: "syn-photo-shield",
    mult: { "produce.energy": 1.2 },
    when: {
      minStructures: { membrane: 1, symbiont: 1 },
      env: { disturbance: { min: 0.15 } },
    },
    tags: ["synergy", "photo-shield"],
  },
];
