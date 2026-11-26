import { ADAPTATION_MAP } from "../data/adaptations.ts";
import { STRUCTURE_MAP } from "../data/structures.ts";
import { SYNERGY_MODIFIERS } from "../data/synergies.ts";
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
import { foldModifiers, type Modifier, type ModifierContext } from "./modifiers.ts";
import { countByDef, type StructureInstance } from "./structures.ts";
import type { ColonyState } from "./colony.ts";

const FIXED_DT = 1 / 20;

export function tick(state: ColonyState, dt: number): ColonyState {
  // Frame-rate independent accumulator-style: clamp big frames, scale by gameSpeed
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

  const globalMods: Modifier[] = [...SYNERGY_MODIFIERS];
  for (const aid of [...state.adaptations, ...state.relics]) {
    const a = ADAPTATION_MAP[aid];
    if (a) globalMods.push(...a.modifiers);
  }

  const baseCtx: ModifierContext = {
    structureCounts: counts,
    env: envRec,
    adjacentTags: [],
    activeTags: Object.keys(counts),
  };

  const activeSynergies = SYNERGY_MODIFIERS.filter((m) => {
    const folded = foldModifiers([m], baseCtx, []);
    // reuse applicability via fold's when check — call modifierApplies indirectly
    return Object.keys(folded).length >= 0 && synergyActive(m, baseCtx);
  }).map((m) => m.id);

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

  // Membrane / photo-shield softens disturbance & predator drain
  const membraneCount = counts["membrane"] ?? 0;
  const defense = 1 / (1 + membraneCount * 0.35 + ((counts["symbiont"] ?? 0) > 0 && membraneCount > 0 ? 0.25 : 0));
  const stress = (env.disturbance * 0.4 + env.predatorPressure * 0.25) * defense;

  let delta = emptyBag();
  const structures = state.structures.map((inst) => tickStructureGrowth(inst, dt));

  for (const inst of structures) {
    const def = STRUCTURE_MAP[inst.defId];
    if (!def || inst.growth < 0.4) continue;
    const maturity = Math.min(1, inst.growth);

    const adjTags = adjacentTags(inst, structures);
    const vesselBonus =
      adjTags.filter((t) => t === "vessel").length > 0 && def.tags.includes("vessel")
        ? 1.12
        : adjTags.includes("vessel")
          ? 1.06
          : 1;

    // Env affinity scalar
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
      vesselBonus *
      affinity *
      maturity *
      (1 - stress * 0.5) *
      (1 + state.prestige * 0.04);

    if (def.produce) {
      for (const id of RESOURCE_IDS) {
        const base = def.produce[id];
        if (base === undefined) continue;
        const ch = channelMods[`produce.${id}`] ?? 1;
        delta[id] += base * localMult * ch * dt;
      }
    }

    if (def.upkeep) {
      const upkeepMult = channelMods["upkeep"] ?? 1;
      for (const id of RESOURCE_IDS) {
        const base = def.upkeep[id];
        if (base === undefined) continue;
        delta[id] -= base * upkeepMult * maturity * dt;
      }
    }

    if (def.convert) {
      const convertMult = (channelMods["convert"] ?? 1) * vesselBonus * maturity;
      for (const c of def.convert) {
        const available = state.resources[c.from] + delta[c.from];
        const want = c.rate * convertMult * dt;
        const used = Math.max(0, Math.min(available, want));
        delta[c.from] -= used;
        delta[c.to] += used * c.efficiency;
        // chambers also shed a bit of waste already via produce
      }
    }
  }

  // Ambient feed into absorber already via produce+affinity; add trickle minerals from current
  delta.minerals += env.ambientNutrients * 0.04 * dt;
  delta.genetic += (Object.keys(counts).length > 3 ? 0.02 : 0.008) * dt;

  // Waste toxicity soft pressure — high waste slows energy production (applied as energy drain)
  if (state.resources.waste > 25) {
    const toxin = Math.min(2, (state.resources.waste - 25) * 0.04);
    delta.energy -= toxin * dt;
  }

  // Biomass synthesis: gentle sink so energy abundance becomes mass
  if (state.resources.energy > 12 && state.resources.minerals > 1.5) {
    const synth = Math.min(state.resources.energy * 0.02, 0.25) * dt;
    delta.energy -= synth * 1.1;
    delta.minerals -= synth * 0.2;
    delta.biomass += synth * 0.95;
  }

  let resources = addBag(state.resources, delta);
  // Soft caps — never hard-block, just taper
  resources.nutrients = softCap(resources.nutrients, 80, 140);
  resources.energy = softCap(resources.energy, 70, 120);
  resources.biomass = softCap(resources.biomass, 60, 100);
  resources.waste = softCap(resources.waste, 40, 70);
  resources.minerals = softCap(resources.minerals, 40, 70);
  resources.genetic = softCap(resources.genetic, 40, 80);
  resources = clampBag(resources);

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
  if (state.time > 600 && counts["bud"] && !flags.includes("can-prestige")) {
    flags = [...flags, "can-prestige"];
    message = "Spore Drift awaits when you are ready.";
  }

  // Early prestige hint by ~12–15 min sim time (accelerated)
  const prestigeReady =
    state.structures.length >= 6 && state.time >= 120 && (counts["bud"] ?? 0) >= 1;

  return {
    ...state,
    time: state.time + dt,
    env,
    structures,
    resources,
    rates,
    activeSynergies,
    flags: prestigeReady && !flags.includes("can-prestige") ? [...flags, "can-prestige"] : flags,
    message:
      prestigeReady && state.message === "Absorb. Digest. Grow."
        ? "Spore Drift visible on the horizon."
        : message,
  };
}

function synergyActive(m: Modifier, ctx: ModifierContext): boolean {
  const w = m.when;
  if (!w) return true;
  if (w.minStructures) {
    for (const [id, n] of Object.entries(w.minStructures)) {
      if ((ctx.structureCounts[id] ?? 0) < (n ?? 0)) return false;
    }
  }
  if (w.env) {
    for (const [k, range] of Object.entries(w.env)) {
      const v = ctx.env[k as keyof typeof ctx.env] ?? 0;
      if (range.min !== undefined && v < range.min) return false;
      if (range.max !== undefined && v > range.max) return false;
    }
  }
  return true;
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

export function simulate(state: ColonyState, seconds: number, cmdEvery?: (t: number, s: ColonyState) => ColonyState): ColonyState {
  let s = state;
  const step = 0.25;
  for (let t = 0; t < seconds; t += step) {
    if (cmdEvery) s = cmdEvery(s.time, s);
    s = tick(s, step);
  }
  return s;
}

export type { ResourceId };
