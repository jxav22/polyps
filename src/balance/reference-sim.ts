/**
 * Pure deterministic reference sim for balance tests/harness.
 * Drop-in contract compatible with polyps-interfaces; lead may swap for real sim.
 */

import {
  ADAPTATION_BY_ID,
  ADAPTATIONS,
  PRESTIGE_GENETIC_THRESHOLD,
  START_RESOURCES,
  STRUCTURE_BY_ID,
  STRUCTURES,
} from "./content-pack.ts";
import {
  addBag,
  canAfford,
  cloneBag,
  emptyBag,
  ENV_IDS,
  RESOURCE_IDS,
  spend,
  type EnvId,
  type Modifier,
  type PlacedStructure,
  type ResourceBag,
  type SimCommand,
  type SimSnapshot,
  type SimState,
  type StructureDef,
} from "./types.ts";

const FIXED_DT = 0.25; // seconds; accumulator consumers may pass any dt

function envAt(time: number): Record<EnvId, number> {
  // Soft cyclic environment — never wipes progress
  const cycle = time / 60;
  return {
    light: 0.45 + 0.35 * Math.sin(cycle * Math.PI * 2),
    temperature: 0.5 + 0.15 * Math.sin(cycle * 1.7 + 1),
    ambientNutrients: 0.55 + 0.2 * Math.sin(cycle * 0.9 + 0.5),
    current: 0.35 + 0.25 * Math.sin(cycle * 1.3 + 2),
    predatorPressure: 0.25 + 0.3 * Math.max(0, Math.sin(cycle * 0.6 + 3)),
    disturbance: Math.max(0, 0.15 * Math.sin(cycle * 2.1 + 0.2)),
  };
}

function countByDef(structures: PlacedStructure[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of structures) {
    out[s.defId] = (out[s.defId] ?? 0) + 1;
  }
  return out;
}

function modifierActive(
  mod: Modifier,
  state: SimState,
  counts: Record<string, number>,
  structureTags: string[],
): boolean {
  if (!mod.when) return true;
  const { minStructures, env, adjacentTags } = mod.when;
  if (minStructures) {
    for (const [id, n] of Object.entries(minStructures)) {
      if ((counts[id] ?? 0) < (n ?? 0)) return false;
    }
  }
  if (env) {
    for (const [eid, bound] of Object.entries(env) as [
      EnvId,
      { min?: number; max?: number },
    ][]) {
      const v = state.env[eid];
      if (bound.min !== undefined && v < bound.min) return false;
      if (bound.max !== undefined && v > bound.max) return false;
    }
  }
  if (adjacentTags && adjacentTags.length > 0) {
    const has = adjacentTags.every((t) => structureTags.includes(t));
    if (!has) return false;
  }
  return true;
}

function collectModifiers(state: SimState): Modifier[] {
  const mods: Modifier[] = [];
  const counts = countByDef(state.structures);
  const allTags = state.structures.flatMap(
    (s) => STRUCTURE_BY_ID[s.defId]?.tags ?? [],
  );

  for (const id of state.adaptations) {
    const def = ADAPTATION_BY_ID[id];
    if (!def) continue;
    for (const m of def.modifiers) {
      if (modifierActive(m, state, counts, allTags)) mods.push(m);
    }
  }

  // Vessel adjacency: each vessel with a vessel neighbor applies bonus
  for (const placed of state.structures) {
    const def = STRUCTURE_BY_ID[placed.defId];
    if (!def?.adjacencyBonus) continue;
    const neighborDefs = placed.neighbors
      .map((slot) => state.structures.find((s) => s.slot === slot))
      .filter(Boolean) as PlacedStructure[];
    const neighborTags = neighborDefs.flatMap(
      (n) => STRUCTURE_BY_ID[n.defId]?.tags ?? [],
    );
    const ok = def.adjacencyBonus.requireTags.every((t) =>
      neighborTags.includes(t),
    );
    if (ok) {
      for (const m of def.adjacencyBonus.modifiers) {
        if (modifierActive(m, state, counts, neighborTags)) mods.push(m);
      }
    }
  }

  return mods;
}

function applyModsToRate(
  base: number,
  channel: string,
  mods: Modifier[],
  tags: string[],
): number {
  let v = base;
  for (const m of mods) {
    if (m.tags && m.tags.length > 0 && !m.tags.some((t) => tags.includes(t))) {
      continue;
    }
    if (m.mult?.[channel] !== undefined) v *= m.mult[channel]!;
    if (m.add?.[channel] !== undefined) v += m.add[channel]!;
  }
  return v;
}

function affinityScale(def: StructureDef, env: Record<EnvId, number>): number {
  if (!def.envAffinity) return 1;
  let scale = 1;
  for (const [eid, weight] of Object.entries(def.envAffinity) as [
    EnvId,
    number,
  ][]) {
    const e = env[eid] ?? 0.5;
    // weight > 0: benefit from high env; weight < 0: hurt by high env
    scale += weight * (e - 0.5) * 2;
  }
  return Math.max(0.15, scale);
}

function recomputeNeighbors(structures: PlacedStructure[]): void {
  // Ring slots 0..N-1; neighbors = adjacent slot indices
  for (const s of structures) {
    const others = structures.filter((o) => o.id !== s.id);
    s.neighbors = others
      .filter((o) => Math.abs(o.slot - s.slot) === 1 || (s.slot === 0 && o.slot === others.length))
      .map((o) => o.slot);
    // Simpler: nearest by slot distance modulo 12
    const ring = 12;
    s.neighbors = others
      .filter((o) => {
        const d = Math.min(
          Math.abs(o.slot - s.slot),
          ring - Math.abs(o.slot - s.slot),
        );
        return d === 1;
      })
      .map((o) => o.slot);
  }
}

function isUnlocked(def: StructureDef, state: SimState): boolean {
  if (state.unlockedStructures.has(def.id)) return true;
  if (!def.unlock) return true;
  const counts = countByDef(state.structures);
  if (def.unlock.requiresStructures) {
    for (const [id, n] of Object.entries(def.unlock.requiresStructures)) {
      if ((counts[id] ?? 0) < (n ?? 0)) return false;
    }
  }
  if (
    def.unlock.requiresGenetic !== undefined &&
    state.resources.genetic < def.unlock.requiresGenetic
  ) {
    return false;
  }
  if (def.unlock.requiresFlags) {
    for (const f of def.unlock.requiresFlags) {
      if (!state.flags.includes(f)) return false;
    }
  }
  return true;
}

export function createInitialState(seedTime = 0): SimState {
  const starter: PlacedStructure = {
    id: "s0",
    defId: "absorber",
    slot: 0,
    neighbors: [],
  };
  const state: SimState = {
    time: seedTime,
    resources: { ...START_RESOURCES },
    structures: [starter],
    adaptations: [],
    env: envAt(seedTime),
    flags: [],
    prestige: 0,
    relics: [],
    nextStructureId: 1,
    unlockedStructures: new Set(["absorber"]),
    tickIndex: 0,
  };
  recomputeNeighbors(state.structures);
  return state;
}

export function snapshot(state: SimState): SimSnapshot {
  return {
    time: state.time,
    resources: cloneBag(state.resources),
    structures: state.structures.map((s) => ({
      ...s,
      neighbors: [...s.neighbors],
    })),
    adaptations: [...state.adaptations],
    env: { ...state.env },
    flags: [...state.flags],
    prestige: state.prestige,
    relics: [...state.relics],
  };
}

export function serializeState(state: SimState): string {
  return JSON.stringify({
    v: 1,
    time: state.time,
    resources: state.resources,
    structures: state.structures,
    adaptations: state.adaptations,
    env: state.env,
    flags: state.flags,
    prestige: state.prestige,
    relics: state.relics,
    nextStructureId: state.nextStructureId,
    unlockedStructures: [...state.unlockedStructures],
    tickIndex: state.tickIndex,
  });
}

export function deserializeState(raw: string): SimState {
  const data = JSON.parse(raw) as {
    v: number;
    time: number;
    resources: ResourceBag;
    structures: PlacedStructure[];
    adaptations: string[];
    env: Record<EnvId, number>;
    flags: string[];
    prestige: number;
    relics: string[];
    nextStructureId: number;
    unlockedStructures: string[];
    tickIndex: number;
  };
  if (data.v !== 1) throw new Error(`Unsupported save version ${data.v}`);
  return {
    time: data.time,
    resources: { ...emptyBag(), ...data.resources },
    structures: data.structures.map((s) => ({
      ...s,
      neighbors: [...s.neighbors],
    })),
    adaptations: [...data.adaptations],
    env: data.env,
    flags: [...data.flags],
    prestige: data.prestige,
    relics: [...data.relics],
    nextStructureId: data.nextStructureId,
    unlockedStructures: new Set(data.unlockedStructures),
    tickIndex: data.tickIndex,
  };
}

function sanitizeResources(bag: ResourceBag): void {
  for (const id of RESOURCE_IDS) {
    if (!Number.isFinite(bag[id]) || Number.isNaN(bag[id])) bag[id] = 0;
    if (bag[id] < 0) bag[id] = 0;
    // Soft cap waste toxicity feedback — still finite
    if (id === "waste" && bag[id] > 200) bag[id] = 200;
    if (bag[id] > 1e9) bag[id] = 1e9;
  }
}

function tickOnce(state: SimState, dt: number): void {
  state.time += dt;
  state.tickIndex += 1;
  state.env = envAt(state.time);

  const mods = collectModifiers(state);
  const delta = emptyBag();
  const wastePenalty = Math.min(0.5, state.resources.waste / 100);

  for (const placed of state.structures) {
    const def = STRUCTURE_BY_ID[placed.defId];
    if (!def) continue;
    const scale = affinityScale(def, state.env) * (1 - wastePenalty * 0.5);
    const tags = def.tags;

    if (def.produce) {
      for (const id of RESOURCE_IDS) {
        const base = def.produce[id];
        if (base === undefined) continue;
        const rate = applyModsToRate(base * scale, id, mods, tags);
        delta[id] += rate * dt;
      }
    }

    if (def.upkeep) {
      for (const id of RESOURCE_IDS) {
        const base = def.upkeep[id];
        if (base === undefined) continue;
        // upkeep values are negative consumes
        delta[id] += base * dt;
      }
    }

    if (def.convert) {
      for (const c of def.convert) {
        const available = state.resources[c.from] + delta[c.from];
        const take = Math.min(available, c.rate * scale * dt);
        if (take <= 0) continue;
        delta[c.from] -= take;
        const out = take * c.efficiency;
        const outRate = applyModsToRate(out / Math.max(dt, 1e-9), c.to, mods, tags);
        delta[c.to] += outRate * dt;
      }
    }
  }

  // Ambient trickle + milestone genetic
  delta.nutrients += 0.05 * state.env.ambientNutrients * dt;
  delta.minerals += 0.015 * dt;
  // Baseline metabolic spark (light-linked) so anabolism isn't dead when energy hits 0
  delta.energy += 0.12 * state.env.light * dt;

  // Core anabolism: energy + nutrients (+ trace minerals) → biomass
  // Brief: "energy+minerals→biomass structures". Content pack has no producer —
  // without this, colony soft-locks after spending starter biomass.
  // Keep an energy reserve so pathway builds (symbiont/sensor/…) remain affordable.
  {
    const ENERGY_RESERVE = 4;
    const energyAvail = Math.max(
      0,
      state.resources.energy + delta.energy - ENERGY_RESERVE,
    );
    const nutAvail = state.resources.nutrients + delta.nutrients;
    const minAvail = state.resources.minerals + delta.minerals;
    const rate = 0.45 * dt;
    const takeE = Math.min(Math.max(0, energyAvail), rate);
    const takeN = Math.min(Math.max(0, nutAvail), rate * 0.8);
    const takeM = Math.min(Math.max(0, minAvail), rate * 0.05);
    const made =
      Math.min(takeE, takeN / 0.8) *
      (0.85 + 0.15 * Math.min(1, takeM / (rate * 0.05 || 1)));
    if (made > 0) {
      delta.energy -= made;
      delta.nutrients -= made * 0.8;
      delta.minerals -= made * 0.05;
      delta.biomass += made * 0.9;
    }
  }

  // Soft genetic from novelty: unique structure types * time factor
  const unique = new Set(state.structures.map((s) => s.defId)).size;
  delta.genetic += 0.015 * unique * dt;
  // Milestone genetic while digesting
  if ((countByDef(state.structures).chamber ?? 0) > 0) {
    delta.genetic += 0.02 * dt;
  }

  addBag(state.resources, delta);
  sanitizeResources(state.resources);

  if (state.resources.waste > 0.5 && !state.flags.includes("waste_seen")) {
    state.flags.push("waste_seen");
  }

  // Discover unlocks
  for (const def of STRUCTURES) {
    if (isUnlocked(def, state)) state.unlockedStructures.add(def.id);
  }

  // Prestige visibility flag
  if (
    state.resources.genetic >= PRESTIGE_GENETIC_THRESHOLD &&
    !state.flags.includes("prestige_ready")
  ) {
    state.flags.push("prestige_ready");
  }
}

/** Frame-rate independent tick with fixed substeps for determinism */
export function tick(state: SimState, dt: number): SimState {
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  if (dt > 5) dt = 5; // clamp catch-up
  let remaining = dt;
  while (remaining > 1e-9) {
    const step = Math.min(FIXED_DT, remaining);
    tickOnce(state, step);
    remaining -= step;
  }
  return state;
}

export function applyCommand(state: SimState, cmd: SimCommand): SimState {
  if (cmd.type === "build" && cmd.structureId) {
    const def = STRUCTURE_BY_ID[cmd.structureId];
    if (!def) return state;
    if (!isUnlocked(def, state)) return state;
    const counts = countByDef(state.structures);
    if (def.maxCount !== undefined && (counts[def.id] ?? 0) >= def.maxCount) {
      return state;
    }
    if (!canAfford(state.resources, def.cost)) return state;
    spend(state.resources, def.cost);
    const slot =
      cmd.slot ??
      (state.structures.reduce((m, s) => Math.max(m, s.slot), -1) + 1) % 12;
    state.structures.push({
      id: `s${state.nextStructureId++}`,
      defId: def.id,
      slot,
      neighbors: [],
    });
    recomputeNeighbors(state.structures);
    state.unlockedStructures.add(def.id);
    // Milestone genetic drip
    state.resources.genetic += 0.25;
    sanitizeResources(state.resources);
  }

  if (cmd.type === "sell" && cmd.structureId) {
    // structureId here means placed instance id
    const idx = state.structures.findIndex((s) => s.id === cmd.structureId);
    if (idx >= 0 && state.structures[idx].defId !== "absorber") {
      const def = STRUCTURE_BY_ID[state.structures[idx].defId];
      if (def) {
        // 50% refund
        for (const id of RESOURCE_IDS) {
          const c = def.cost[id];
          if (c) state.resources[id] += c * 0.5;
        }
      }
      state.structures.splice(idx, 1);
      recomputeNeighbors(state.structures);
    }
  }

  if (cmd.type === "adapt" && cmd.adaptationId) {
    const def = ADAPTATION_BY_ID[cmd.adaptationId];
    if (!def) return state;
    if (state.adaptations.includes(def.id)) return state;
    if (state.resources.genetic < def.costGenetic) return state;
    state.resources.genetic -= def.costGenetic;
    state.adaptations.push(def.id);
    if (def.unlockStructures) {
      for (const sid of def.unlockStructures) {
        state.unlockedStructures.add(sid);
      }
    }
    if (def.permanentRelic && !state.relics.includes(def.id)) {
      state.relics.push(def.id);
    }
    state.flags.push(`adapted:${def.id}`);
  }

  if (cmd.type === "prestige") {
    if (!state.flags.includes("prestige_ready")) return state;
    const relics = [...new Set([...state.relics, ...state.adaptations.filter((id) => ADAPTATION_BY_ID[id]?.permanentRelic)])];
    const prestige = state.prestige + 1;
    const keptGenetic = Math.min(4, state.resources.genetic * 0.1) + prestige;
    const next = createInitialState(0);
    next.prestige = prestige;
    next.relics = relics;
    next.adaptations = relics.filter((id) => ADAPTATION_BY_ID[id]?.permanentRelic);
    next.resources.genetic = keptGenetic;
    next.resources.biomass += prestige * 2;
    next.flags.push("post_prestige");
    // copy into state
    Object.assign(state, next);
    state.unlockedStructures = new Set(next.unlockedStructures);
  }

  return state;
}

export function listBuildable(state: SimState): StructureDef[] {
  const counts = countByDef(state.structures);
  return STRUCTURES.filter((def) => {
    if (!isUnlocked(def, state)) return false;
    if (def.maxCount !== undefined && (counts[def.id] ?? 0) >= def.maxCount) {
      return false;
    }
    return canAfford(state.resources, def.cost);
  });
}

export function listAdaptable(state: SimState): typeof ADAPTATIONS {
  return ADAPTATIONS.filter(
    (a) =>
      !state.adaptations.includes(a.id) &&
      state.resources.genetic >= a.costGenetic,
  );
}

export function assertFiniteState(state: SimState): void {
  for (const id of RESOURCE_IDS) {
    if (!Number.isFinite(state.resources[id])) {
      throw new Error(`NaN/Inf resource ${id}`);
    }
  }
  for (const eid of ENV_IDS) {
    if (!Number.isFinite(state.env[eid])) {
      throw new Error(`NaN/Inf env ${eid}`);
    }
  }
  if (!Number.isFinite(state.time)) throw new Error("NaN/Inf time");
}
