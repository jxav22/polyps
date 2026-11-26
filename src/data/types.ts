/**
 * Content-pack types extending the shared sim interfaces.
 * Lead owns runtime evaluation; this pack only declares data.
 */
import type { EnvId, Modifier, ResourceBag, StructureId } from "../sim/interfaces.ts";

export type { EnvId, Modifier, ResourceBag, StructureId };

export interface SynergyDef {
  id: string;
  name: string;
  description: string;
  /** Composition recipe the UI can surface as a discovery hint */
  recipe: {
    requireTags?: string[];
    minStructures?: Partial<Record<string, number>>;
    adjacentTags?: string[];
    env?: Partial<Record<EnvId, { min?: number; max?: number }>>;
  };
  modifiers: Modifier[];
  /** Soft discovery beat for onboarding / journal */
  discoveryHint: string;
}

export interface EnvPhase {
  id: string;
  name: string;
  /** Duration in seconds (sim time) */
  duration: number;
  /** Target env values for this phase (0–1 normalised unless noted) */
  env: Partial<Record<EnvId, number>>;
  /** Soft yield/cost bias — never wipe progress */
  modifiers: Modifier[];
  flavor: string;
}

export interface EnvCycleDef {
  id: string;
  name: string;
  description: string;
  phases: EnvPhase[];
  /** Loop forever unless interrupted by a rare event */
  loop: boolean;
}

export interface EnvEventDef {
  id: string;
  name: string;
  description: string;
  /** Mean seconds between rolls when eligible */
  meanInterval: number;
  /** First eligible after this many seconds of play */
  unlockAfter: number;
  duration: number;
  env: Partial<Record<EnvId, number>>;
  modifiers: Modifier[];
  /** Never destroys structures or resets resources below floors */
  softOnly: true;
  biasesPathways: Array<"predatory" | "photo" | "symbiotic" | "colonial" | "metabolic">;
}

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  /** How the relic is earned before/during Spore Drift */
  earn: {
    requiresFlags?: string[];
    requiresAdaptations?: string[];
    requiresPrestige?: number;
    requiresStructuresBuilt?: Partial<Record<string, number>>;
  };
  modifiers: Modifier[];
  unlockStructures?: StructureId[];
  unlockAdaptations?: string[];
  permanent: true;
}

export interface PrestigeTrackDef {
  id: "sporeDrift";
  name: string;
  description: string;
  /** Soft visibility gate — show UI when any condition met */
  visibleWhen: {
    minTime?: number;
    minGenetic?: number;
    minBiomassPeak?: number;
    requiresFlags?: string[];
  };
  /** Cost / threshold to trigger a drift */
  driftCost: {
    minBiomass: number;
    minGenetic: number;
  };
  /** What carries over */
  keep: {
    relics: true;
    pathwayUnlocks: true;
    geneticFraction: number;
  };
  relics: RelicDef[];
  unlockTiers: Array<{
    prestige: number;
    name: string;
    unlockFlags: string[];
    unlockAdaptations?: string[];
    unlockStructures?: StructureId[];
  }>;
}

export interface OnboardingHint {
  id: string;
  /** Seconds of play (approx) when this should surface if unmet */
  atTime: number;
  title: string;
  body: string;
  /** Dismiss when any condition is true */
  completeWhen: {
    hasStructures?: Partial<Record<string, number>>;
    hasResources?: Partial<ResourceBag>;
    hasAdaptations?: string[];
    hasFlags?: string[];
    hasSynergy?: string[];
  };
  highlight?: "absorber" | "chamber" | "tentacle" | "grow" | "adapt" | "env" | "prestige";
}
