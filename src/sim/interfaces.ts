/**
 * Shared TypeScript interfaces for Polyps.
 * Lead owns the real package; other workers match these shapes when contributing modules.
 */

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
  /** multiplicative on matching channels; 1 = no change */
  mult?: Partial<Record<string, number>>;
  /** additive */
  add?: Partial<Record<string, number>>;
  tags?: string[];
  /** optional condition evaluated by sim */
  when?: {
    minStructures?: Partial<Record<string, number>>;
    /** count must be <= n (use for identity builds e.g. no tentacles) */
    maxStructures?: Partial<Record<string, number>>;
    env?: Partial<Record<EnvId, { min?: number; max?: number }>>;
    adjacentTags?: string[];
    /** if set, ALL listed tags must be absent from adjacentTags */
    forbidAdjacentTags?: string[];
  };
}

export interface StructureDef {
  id: StructureId;
  name: string;
  description: string;
  tags: string[];
  cost: Partial<ResourceBag>;
  /** per-second upkeep (negative = consume) */
  upkeep?: Partial<ResourceBag>;
  /** base per-second production */
  produce?: Partial<ResourceBag>;
  /** convert rates: from -> to */
  convert?: { from: ResourceId; to: ResourceId; rate: number; efficiency: number }[];
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
  pathway: "predatory" | "photo" | "symbiotic" | "colonial" | "metabolic" | "hybrid";
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

export interface SimSnapshot {
  time: number;
  resources: ResourceBag;
  structures: { id: StructureId; defId: StructureId; slot: number; neighbors: number[] }[];
  adaptations: string[];
  env: Record<EnvId, number>;
  flags: string[];
  prestige: number;
  relics: string[];
}

/** Pure function contract */
export type TickFn = (state: unknown, dt: number) => unknown;
export type CommandFn = (state: unknown, cmd: SimCommand) => unknown;
