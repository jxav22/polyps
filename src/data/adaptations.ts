import type { Modifier } from "../sim/modifiers.ts";

export interface AdaptationDef {
  id: string;
  name: string;
  description: string;
  pathway: "predatory" | "photo" | "symbiotic" | "colonial" | "metabolic" | "hybrid";
  costGenetic: number;
  modifiers: Modifier[];
  unlockStructures?: string[];
  permanentRelic?: boolean;
}

export const ADAPTATION_DEFS: AdaptationDef[] = [
  {
    id: "keen-sting",
    name: "Keen Sting",
    description: "Tentacles and venom hit harder when currents run.",
    pathway: "predatory",
    costGenetic: 3,
    modifiers: [
      {
        id: "keen-sting",
        mult: { "produce.nutrients": 1.25 },
        when: { env: { current: { min: 0.4 } }, minStructures: { tentacle: 1 } },
      },
    ],
  },
  {
    id: "chloroplast-bloom",
    name: "Chloroplast Bloom",
    description: "Photosymbionts flood energy under high light.",
    pathway: "photo",
    costGenetic: 3,
    modifiers: [
      {
        id: "chloro",
        mult: { "produce.energy": 1.35 },
        when: { env: { light: { min: 0.55 } }, minStructures: { symbiont: 1 } },
      },
    ],
  },
  {
    id: "closed-gut",
    name: "Closed Gut",
    description: "Waste bacteria reclaim more nutrients.",
    pathway: "symbiotic",
    costGenetic: 4,
    modifiers: [
      {
        id: "closed-gut",
        mult: { convert: 1.2 },
        when: { minStructures: { bacteria: 1, chamber: 1 } },
      },
    ],
  },
  {
    id: "spore-memory",
    name: "Spore Memory",
    description: "Relic: keep a shard of genetic insight after Spore Drift.",
    pathway: "hybrid",
    costGenetic: 6,
    modifiers: [{ id: "spore-memory", add: { "produce.genetic": 0.05 } }],
    permanentRelic: true,
  },
  {
    id: "colony-pulse",
    name: "Colony Pulse",
    description: "Buds multiply biomass when light and chambers align.",
    pathway: "colonial",
    costGenetic: 5,
    modifiers: [
      {
        id: "colony-pulse",
        mult: { "produce.biomass": 1.4 },
        when: {
          minStructures: { bud: 1, chamber: 1, symbiont: 1 },
          env: { light: { min: 0.5 } },
        },
      },
    ],
  },
];

export const ADAPTATION_MAP: Record<string, AdaptationDef> = Object.fromEntries(
  ADAPTATION_DEFS.map((d) => [d.id, d]),
);
