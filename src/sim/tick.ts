import { ADAPTATION_MAP } from "../data/adaptations.ts";
import { GLOBAL_RATE, HARD_CAPS, SOFT_CAPS } from "../data/balance.ts";
import { PRESTIGE_SIGNALS } from "../data/prestige.ts";
import { STRUCTURE_MAP } from "../data/structures.ts";
import type { PrestigeSignalDef } from "../data/types.ts";
import {
  SYNERGIES,
  SYNERGY_MODIFIERS,
  SYNERGY_RIVALRIES,
} from "../data/synergies.ts";
import {
  addBag,
  clampBag,
  emptyBag,
  softCap,
  type ResourceBag,
  type ResourceId,
  RESOURCE_IDS,
} from "./resources.ts";
import { envRecord, tickEnvironment } from "./environment.ts";
import {
  foldModifiers,
  type Modifier,
  type ModifierContext,
} from "./modifiers.ts";
import { countByDef, type StructureInstance } from "./structures.ts";
import type { ColonyState } from "./colony.ts";

const FIXED_DT = 1 / 20;

export function tick(state: ColonyState, dt: number): ColonyState {
  const steps = Math.max(1, Math.min(8, Math.round((dt * state.gameSpeed) / FIXED_DT)));
  const stepDt = (dt * state.gameSpeed) / steps;
  let s = state;
  for (let i = 0; i < steps; i++) {
    s = tickOnce(s, stepDt);
  }
  return s;
}

function tickOnce(state: ColonyState, dt: number): ColonyState {
  const env = tickEnvironment(state.env, dt);
  const counts = countByDef(state.structures);
  const envRec = envRecord(env);
  const rate = GLOBAL_RATE * (1 + state.prestige * 0.04);

  const globalMods: Modifier[] = [...SYNERGY_MODIFIERS];
  for (const aid of [...state.adaptations, ...state.relics]) {
    const a = ADAPTATION_MAP[aid];
    if (a) globalMods.push(...a.modifiers);
  }

  // Colony-wide tag presence (used as soft adjacency for global synergy eval)
  const presentTags = new Set<string>();
  for (const s of state.structures) {
    STRUCTURE_MAP[s.defId]?.tags.forEach((t) => presentTags.add(t));
  }
  // Tags that appear on at least one neighbor pair
  const adjacentTagSet = new Set<string>();
  const bySlot = new Map(state.structures.map((s) => [s.slot, s]));
  for (const s of state.structures) {
    for (const n of s.neighbors) {
      const other = bySlot.get(n);
      if (!other) continue;
      STRUCTURE_MAP[other.defId]?.tags.forEach((t) => adjacentTagSet.add(t));
    }
  }

  const baseCtx: ModifierContext = {
    structureCounts: counts,
    env: envRec,
    adjacentTags: [...adjacentTagSet],
    activeTags: [...presentTags],
  };

  const activeSynergies = SYNERGIES.filter((syn) => {
    const recipe = syn.recipe;
    if (recipe.minStructures) {
      for (const [id, n] of Object.entries(recipe.minStructures)) {
        if ((counts[id] ?? 0) < (n ?? 0)) return false;
      }
    }
    if (recipe.env) {
      for (const [k, range] of Object.entries(recipe.env)) {
        const v = envRec[k as keyof typeof envRec] ?? 0;
        if (range?.min !== undefined && v < range.min) return false;
        if (range?.max !== undefined && v > range.max) return false;
      }
    }
    if (recipe.requireTags?.length) {
      for (const t of recipe.requireTags) {
        if (!presentTags.has(t)) return false;
      }
    }
    if (recipe.adjacentTags?.length) {
      for (const t of recipe.adjacentTags) {
        if (!adjacentTagSet.has(t)) return false;
      }
    }
    // Identity / exclusion recipes (Silent Reef etc.)
    const recipeAny = recipe as {
      maxStructures?: Partial<Record<string, number>>;
      forbidAdjacentTags?: string[];
    };
    if (recipeAny.maxStructures) {
      for (const [id, n] of Object.entries(recipeAny.maxStructures)) {
        if ((counts[id] ?? 0) > (n ?? 0)) return false;
      }
    }
    if (recipeAny.forbidAdjacentTags?.length) {
      for (const t of recipeAny.forbidAdjacentTags) {
        if (adjacentTagSet.has(t)) return false;
      }
    }
    // Recipe satisfied ⇒ active; modifier.when is applied when folding channels
    return true;
  }).map((s) => s.id);

  const channelMods = foldModifiers(globalMods, baseCtx, [
    "produce",
    "convert",
    "upkeep",
    "produce.nutrients",
    "produce.energy",
    "produce.biomass",
    "produce.genetic",
    "produce.minerals",
    "produce.waste",
  ]);

  // Hard caps from content balance contract
  if (channelMods["convert"] !== undefined) {
    channelMods["convert"] = Math.min(
      channelMods["convert"],
      HARD_CAPS.wasteLoopConvertRateMult,
    );
  }
  if (channelMods["produce.energy"] !== undefined) {
    channelMods["produce.energy"] = Math.min(
      channelMods["produce.energy"],
      HARD_CAPS.photoEnergySynergyMult,
    );
  }

  // Rivalries: both synergies active → soft identity tax on produce
  let rivalryMult = 1;
  const activeSet = new Set(activeSynergies);
  for (const r of SYNERGY_RIVALRIES) {
    if (activeSet.has(r.a) && activeSet.has(r.b)) {
      rivalryMult *= r.rivalryMult;
    }
  }

  const membraneCount = counts["membrane"] ?? 0;
  const defense =
    1 /
    (1 +
      membraneCount * 0.35 +
      ((counts["symbiont"] ?? 0) > 0 && membraneCount > 0 ? 0.25 : 0));
  const stress = (env.disturbance * 0.4 + env.predatorPressure * 0.25) * defense;

  // Waste soft yield floor
  let wasteMult = 1;
  if (state.resources.waste > SOFT_CAPS.wastePenaltyStart) {
    const t = Math.min(
      1,
      (state.resources.waste - SOFT_CAPS.wastePenaltyStart) /
        (SOFT_CAPS.wastePenaltyFull - SOFT_CAPS.wastePenaltyStart),
    );
    const hasLoop = activeSynergies.includes("waste_loop");
    wasteMult = hasLoop ? 1 - t * 0.15 : 1 - t * (1 - SOFT_CAPS.wasteYieldFloor);
  }

  let delta = emptyBag();
  const structures = state.structures.map((inst) => tickStructureGrowth(inst, dt));

  for (const inst of structures) {
    const def = STRUCTURE_MAP[inst.defId];
    if (!def || inst.growth < 0.4) continue;
    const maturity = Math.min(1, inst.growth);
    const adjTags = adjacentTags(inst, structures);

    // Adjacency structure modifiers (vessel grid, etc.)
    let adjMult = 1;
    if (def.adjacencyBonus) {
      const ok = def.adjacencyBonus.requireTags.every((t) => adjTags.includes(t));
      if (ok) {
        const folded = foldModifiers(def.adjacencyBonus.modifiers, {
          ...baseCtx,
          adjacentTags: adjTags,
        }, ["produce", "convert", "upkeep"]);
        adjMult *= folded["produce"] ?? 1;
      }
    }

    const vesselBonus =
      adjTags.filter((t) => t === "vessel").length > 0 && def.tags.includes("vessel")
        ? 1.12
        : adjTags.includes("vessel")
          ? 1.06
          : 1;

    let affinity = 1;
    if (def.envAffinity) {
      let sum = 0;
      let w = 0;
      for (const [k, weight] of Object.entries(def.envAffinity)) {
        if (weight === undefined) continue;
        const v = envRec[k as keyof typeof envRec] ?? 0.5;
        sum += weight >= 0 ? v * weight : (1 - v) * Math.abs(weight);
        w += Math.abs(weight);
      }
      if (w > 0) affinity = 0.55 + 0.9 * (sum / w);
    }

    const localMult =
      (channelMods["produce"] ?? 1) *
      adjMult *
      vesselBonus *
      affinity *
      maturity *
      wasteMult *
      rivalryMult *
      (1 - stress * 0.5) *
      rate;

    if (def.produce) {
      for (const id of RESOURCE_IDS) {
        const base = def.produce[id];
        if (base === undefined || base === 0) continue;
        let ch = channelMods[`produce.${id}`] ?? 1;
        ch *= tagChannelMult(channelMods, def.tags, `produce.${id}`);
        ch *= tagChannelMult(channelMods, def.tags, "produce");
        delta[id] += base * localMult * ch * dt;
      }
    }

    // Signed upkeep: negative consumes (matches interfaces.ts)
    if (def.upkeep) {
      const upkeepMult = (channelMods["upkeep"] ?? 1) * maturity * rate;
      for (const id of RESOURCE_IDS) {
        const base = def.upkeep[id];
        if (base === undefined || base === 0) continue;
        let ch = tagChannelMult(channelMods, def.tags, `upkeep.${id}`);
        delta[id] += base * upkeepMult * ch * dt;
      }
    }

    if (def.convert) {
      const convertMult = (channelMods["convert"] ?? 1) * vesselBonus * maturity * rate;
      for (const c of def.convert) {
        const available = state.resources[c.from] + delta[c.from];
        const want = c.rate * convertMult * dt;
        const used = Math.max(0, Math.min(available, want));
        delta[c.from] -= used;
        delta[c.to] += used * c.efficiency;
      }
    }
  }

  // Ambient mineral trickle from t=0 (prevents membrane/symbiont soft-lock)
  delta.minerals += (0.05 + env.ambientNutrients * 0.04) * rate * dt;
  delta.genetic += (Object.keys(counts).length > 3 ? 0.045 : 0.02) * rate * dt;
  // Soft basal energy from light so tentacle upkeep cannot zero the colony pre-chamber
  delta.energy += env.light * 0.18 * rate * dt;

  /**
   * Core anabolism — live harness found colonial dead without biomass income.
   * Convert energy+nutrients → biomass while keeping a small energy reserve.
   */
  const energyReserve = 1.5;
  const availEnergy = state.resources.energy + delta.energy - energyReserve;
  const availNutrients = state.resources.nutrients + delta.nutrients;
  if (availEnergy > 0 && availNutrients > 0.5) {
    const synthRate = Math.min(0.35, availEnergy * 0.12, availNutrients * 0.1) * rate * dt;
    delta.nutrients -= synthRate;
    delta.energy -= synthRate * 0.75;
    delta.biomass += synthRate * 1.05;
  }

  let resources = addBag(state.resources, delta);

  // Softcap pressure: excess biomass past soft band bleeds into genetic novelty
  // so the hard wall is a signal, not a dead stop.
  const BIOMASS_SOFT = SOFT_CAPS.biomassSoft;
  const BIOMASS_HARD = SOFT_CAPS.biomassHard;
  if (resources.biomass > BIOMASS_SOFT && delta.biomass > 0) {
    const overflow = Math.min(delta.biomass, resources.biomass - BIOMASS_SOFT);
    const bleed = overflow * 0.35;
    resources.biomass -= bleed;
    delta.genetic += bleed * 0.08;
    resources.genetic += bleed * 0.08;
  }

  resources.nutrients = softCap(resources.nutrients, 80, 140);
  resources.energy = softCap(resources.energy, 70, 120);
  resources.biomass = softCap(resources.biomass, BIOMASS_SOFT, BIOMASS_HARD);
  resources.waste = softCap(resources.waste, 40, 70);
  resources.minerals = softCap(resources.minerals, 40, 70);
  resources.genetic = softCap(resources.genetic, 40, 80);
  resources = clampBag(resources);

  const geneticGain = Math.max(0, delta.genetic);
  const geneticLifetime = (state.geneticLifetime ?? 0) + geneticGain;
  const biomassPeak = Math.max(state.biomassPeak ?? 0, resources.biomass);

  const rates: Partial<ResourceBag> = {};
  for (const id of RESOURCE_IDS) {
    rates[id] = delta[id] / Math.max(dt, 1e-6);
  }

  let message = state.message;
  let flags = state.flags;
  if (resources.genetic >= 3 && !flags.includes("can-adapt")) {
    flags = [...flags, "can-adapt"];
    message = "Genetic insight ready — adapt the colony.";
  }

  const nextTime = state.time + dt;
  const signalCtx = {
    time: nextTime,
    geneticLifetime,
    biomassPeak,
    counts,
    adaptations: state.adaptations,
    synergies: activeSynergies,
    flags,
  };
  const newlySet: string[] = [];
  for (const signal of PRESTIGE_SIGNALS) {
    if (flags.includes(signal.flag)) continue;
    if (!prestigeSignalApplies(signal, signalCtx)) continue;
    flags = [...flags, signal.flag];
    newlySet.push(signal.flag);
    // Keep can-prestige alias for HUD / commands
    if (signal.flag === "prestige_ready" && !flags.includes("can-prestige")) {
      flags = [...flags, "can-prestige"];
    }
  }
  if (newlySet.includes("seen_prestige_ui")) {
    message = "Spore Drift visible on the horizon.";
  } else if (newlySet.includes("prestige_ready")) {
    message = "Lineage pressure builds — Spore Drift approaches.";
  } else if (newlySet.includes("pathway_committed")) {
    message = "A pathway identity takes hold.";
  } else if (newlySet.includes("seen_midgame")) {
    message = "Midgame currents — compose synergies toward Drift.";
  }

  return {
    ...state,
    time: nextTime,
    env,
    structures,
    resources,
    rates,
    activeSynergies,
    flags,
    message,
    geneticLifetime,
    biomassPeak,
  };
}

/** Evaluate PRESTIGE_SIGNALS.when — progress clauses OR; time/flags AND. */
function prestigeSignalApplies(
  signal: PrestigeSignalDef,
  ctx: {
    time: number;
    geneticLifetime: number;
    biomassPeak: number;
    counts: Record<string, number>;
    adaptations: string[];
    synergies: string[];
    flags: string[];
  },
): boolean {
  const when = signal.when;
  if (when.minTime !== undefined && ctx.time < when.minTime) return false;
  if (when.requiresFlags?.length) {
    if (!when.requiresFlags.every((f) => ctx.flags.includes(f))) return false;
  }

  const clauses: boolean[] = [];
  if (when.minGeneticLifetime !== undefined) {
    clauses.push(ctx.geneticLifetime >= when.minGeneticLifetime);
  }
  if (when.minBiomassPeak !== undefined) {
    clauses.push(ctx.biomassPeak >= when.minBiomassPeak);
  }
  if (when.minStructures) {
    clauses.push(
      Object.entries(when.minStructures).every(
        ([id, n]) => (ctx.counts[id] ?? 0) >= (n ?? 0),
      ),
    );
  }
  if (when.anySynergy?.length) {
    clauses.push(when.anySynergy.some((s) => ctx.synergies.includes(s)));
  }
  if (when.anyAdaptation?.length) {
    clauses.push(when.anyAdaptation.some((a) => ctx.adaptations.includes(a)));
  }

  // Flags/time-only signals (e.g. seen_prestige_ui from requiresFlags)
  if (clauses.length === 0) return true;
  return clauses.some(Boolean);
}

function tagChannelMult(
  channels: Record<string, number>,
  tags: string[],
  suffix: string,
): number {
  let m = 1;
  for (const tag of tags) {
    const key = `tag.${tag}.${suffix}`;
    if (channels[key] !== undefined) m *= channels[key]!;
  }
  return m;
}

function adjacentTags(inst: StructureInstance, all: StructureInstance[]): string[] {
  const bySlot = new Map(all.map((s) => [s.slot, s]));
  const tags: string[] = [];
  for (const n of inst.neighbors) {
    const other = bySlot.get(n);
    if (!other) continue;
    const def = STRUCTURE_MAP[other.defId];
    if (def) tags.push(...def.tags);
  }
  return tags;
}

function tickStructureGrowth(inst: StructureInstance, dt: number): StructureInstance {
  if (inst.growth >= 1) return inst;
  return { ...inst, growth: Math.min(1, inst.growth + dt * 0.85) };
}

export function simulate(
  state: ColonyState,
  seconds: number,
  cmdEvery?: (t: number, s: ColonyState) => ColonyState,
): ColonyState {
  let s = state;
  const step = 0.25;
  for (let t = 0; t < seconds; t += step) {
    if (cmdEvery) s = cmdEvery(s.time, s);
    s = tick(s, step);
  }
  return s;
}

export type { ResourceId };
