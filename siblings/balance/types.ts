/** Local mirror of shared polyps-interfaces — keep in sync with internal/polyps-interfaces.ts */

export type ResourceId =
  | "nutrients"
  | "energy"
  | "biomass"
  | "genetic"
  | "minerals"
  | "waste";

export type EnvId =
  | "light"
  | "temperature"
  | "ambientNutrients"
  | "current"
  | "predatorPressure"
  | "disturbance";

export type StructureId = string;

export type Pathway =
  | "predatory"
  | "photo"
  | "symbiotic"
  | "colonial"
  | "metabolic"
  | "hybrid";

export interface ResourceBag {
  nutrients: number;
  energy: number;
  biomass: number;
  genetic: number;
  minerals: number;
  waste: number;
}

export interface Modifier {
  id: string;
  mult?: Partial<Record<string, number>>;
  add?: Partial<Record<string, number>>;
  tags?: string[];
  when?: {
    minStructures?: Partial<Record<string, number>>;
    env?: Partial<Record<EnvId, { min?: number; max?: number }>>;
    adjacentTags?: string[];
  };
}

export interface StructureDef {
  id: StructureId;
  name: string;
  description: string;
  tags: string[];
  cost: Partial<ResourceBag>;
  upkeep?: Partial<ResourceBag>;
  produce?: Partial<ResourceBag>;
  convert?: {
    from: ResourceId;
    to: ResourceId;
    rate: number;
    efficiency: number;
  }[];
  adjacencyBonus?: { requireTags: string[]; modifiers: Modifier[] };
  envAffinity?: Partial<Record<EnvId, number>>;
  unlock?: {
    requiresStructures?: Partial<Record<string, number>>;
    requiresGenetic?: number;
    requiresFlags?: string[];
  };
  maxCount?: number;
  visual: {
    archetype:
      | "core"
      | "tentacle"
      | "chamber"
      | "symbiont"
      | "membrane"
      | "bud"
      | "sensor"
      | "vessel"
      | "venom"
      | "bacteria";
    hue: number;
    pulse: number;
  };
}

export interface AdaptationDef {
  id: string;
  name: string;
  description: string;
  pathway: Pathway;
  costGenetic: number;
  modifiers: Modifier[];
  unlockStructures?: StructureId[];
  permanentRelic?: boolean;
}

export interface SimCommand {
  type: "build" | "sell" | "adapt" | "prestige" | "assign";
  structureId?: StructureId;
  adaptationId?: string;
  slot?: number;
}

export interface PlacedStructure {
  id: StructureId;
  defId: StructureId;
  slot: number;
  neighbors: number[];
}

export interface SimSnapshot {
  time: number;
  resources: ResourceBag;
  structures: PlacedStructure[];
  adaptations: string[];
  env: Record<EnvId, number>;
  flags: string[];
  prestige: number;
  relics: string[];
}

export interface SimState {
  time: number;
  resources: ResourceBag;
  structures: PlacedStructure[];
  adaptations: string[];
  env: Record<EnvId, number>;
  flags: string[];
  prestige: number;
  relics: string[];
  nextStructureId: number;
  unlockedStructures: Set<string>;
  tickIndex: number;
}

export const RESOURCE_IDS: ResourceId[] = [
  "nutrients",
  "energy",
  "biomass",
  "genetic",
  "minerals",
  "waste",
];

export const ENV_IDS: EnvId[] = [
  "light",
  "temperature",
  "ambientNutrients",
  "current",
  "predatorPressure",
  "disturbance",
];

export function emptyBag(): ResourceBag {
  return {
    nutrients: 0,
    energy: 0,
    biomass: 0,
    genetic: 0,
    minerals: 0,
    waste: 0,
  };
}

export function cloneBag(bag: ResourceBag): ResourceBag {
  return { ...bag };
}

export function addBag(
  target: ResourceBag,
  delta: Partial<ResourceBag>,
  scale = 1,
): void {
  for (const id of RESOURCE_IDS) {
    const v = delta[id];
    if (v !== undefined) target[id] += v * scale;
  }
}

export function canAfford(bag: ResourceBag, cost: Partial<ResourceBag>): boolean {
  for (const id of RESOURCE_IDS) {
    const c = cost[id];
    if (c !== undefined && bag[id] < c) return false;
  }
  return true;
}

export function spend(bag: ResourceBag, cost: Partial<ResourceBag>): void {
  for (const id of RESOURCE_IDS) {
    const c = cost[id];
    if (c !== undefined) bag[id] -= c;
  }
}
