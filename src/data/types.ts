/**
 * Content-pack types extending the shared sim interfaces.
 * Lead owns runtime evaluation; this pack only declares data.
 */
import type { EnvId, Modifier, ResourceBag, StructureId } from "../polyps-interfaces.ts";

export type { EnvId, Modifier, ResourceBag, StructureId };

export interface SynergyDef {
  id: string;
  name: string;
  description: string;
  /** Composition recipe the UI can surface as a discovery hint */
  recipe: {
    requireTags?: string[];
    minStructures?: Partial<Record<string, number>>;
    /** Identity caps — sim must honor maxStructures (min:0 does NOT mean "none") */
    maxStructures?: Partial<Record<string, number>>;
    adjacentTags?: string[];
    forbidAdjacentTags?: string[];
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
  /** Short UI goal line shown in midgame journal */
  goalHint: string;
  /** How the relic is earned before/during Spore Drift */
  earn: {
    requiresFlags?: string[];
    /** If set, any one flag is enough (OR). requiresFlags stays AND. */
    anyFlags?: string[];
    requiresAdaptations?: string[];
    /** Any one adaptation from the list */
    anyAdaptations?: string[];
    requiresPrestige?: number;
    requiresStructuresBuilt?: Partial<Record<string, number>>;
    /** Lifetime genetic earned this run (not stockpile) */
    minGeneticLifetime?: number;
  };
  modifiers: Modifier[];
  unlockStructures?: StructureId[];
  unlockAdaptations?: string[];
  permanent: true;
  /** Pathway badge for UI grouping */
  pathway?: "predatory" | "photo" | "symbiotic" | "colonial" | "metabolic" | "hybrid" | "prestige";
}

export interface PrestigeSignalDef {
  id: string;
  /** Flag the sim should set when `when` is met */
  flag: string;
  description: string;
  when: {
    minTime?: number;
    /** Lifetime genetic earned (spend does not erase progress) */
    minGeneticLifetime?: number;
    minBiomassPeak?: number;
    minStructures?: Partial<Record<string, number>>;
    anySynergy?: string[];
    anyAdaptation?: string[];
    requiresFlags?: string[];
  };
}

export interface PrestigeTrackDef {
  id: "sporeDrift";
  name: string;
  description: string;
  /** Soft visibility gate — show UI when ANY top-level group matches */
  visibleWhen: {
    minTime?: number;
    /** Prefer lifetime over stockpile — adaptations spend genetic */
    minGeneticLifetime?: number;
    /** Deprecated stockpile check — avoid for visibility */
    minGenetic?: number;
    minBiomassPeak?: number;
    requiresFlags?: string[];
    anyFlags?: string[];
  };
  /** Cost / threshold to trigger a drift */
  driftCost: {
    minBiomass: number;
    /** Lifetime genetic this run, not current stockpile */
    minGeneticLifetime: number;
    /** Optional stockpile floor so drift isn't free after spending everything */
    minGeneticStockpile?: number;
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
  /** Ordered midgame goals toward first drift */
  midgameGoals: Array<{
    id: string;
    title: string;
    body: string;
    completeWhen: {
      hasFlags?: string[];
      hasStructures?: Partial<Record<string, number>>;
      hasRelic?: string[];
      minGeneticLifetime?: number;
    };
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
