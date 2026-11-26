import type { EnvId } from "./environment.ts";
import type { ResourceBag } from "./resources.ts";

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

export interface ModifierContext {
  structureCounts: Record<string, number>;
  env: Record<EnvId, number>;
  adjacentTags: string[];
  activeTags: string[];
}

export function modifierApplies(mod: Modifier, ctx: ModifierContext): boolean {
  const w = mod.when;
  if (!w) return true;
  if (w.minStructures) {
    for (const [id, n] of Object.entries(w.minStructures)) {
      if ((ctx.structureCounts[id] ?? 0) < (n ?? 0)) return false;
    }
  }
  if (w.env) {
    for (const [k, range] of Object.entries(w.env)) {
      const v = ctx.env[k as EnvId] ?? 0;
      if (range.min !== undefined && v < range.min) return false;
      if (range.max !== undefined && v > range.max) return false;
    }
  }
  if (w.adjacentTags?.length) {
    for (const t of w.adjacentTags) {
      if (!ctx.adjacentTags.includes(t)) return false;
    }
  }
  return true;
}

/** Fold additive then multiplicative channels into a bag of channel values. */
export function foldModifiers(
  mods: Modifier[],
  ctx: ModifierContext,
  channels: string[],
): Record<string, number> {
  const add: Record<string, number> = {};
  const mult: Record<string, number> = {};
  for (const ch of channels) {
    add[ch] = 0;
    mult[ch] = 1;
  }
  for (const mod of mods) {
    if (!modifierApplies(mod, ctx)) continue;
    if (mod.add) {
      for (const [k, v] of Object.entries(mod.add)) {
        if (v === undefined) continue;
        add[k] = (add[k] ?? 0) + v;
      }
    }
    if (mod.mult) {
      for (const [k, v] of Object.entries(mod.mult)) {
        if (v === undefined) continue;
        mult[k] = (mult[k] ?? 1) * v;
      }
    }
  }
  const out: Record<string, number> = {};
  const keys = new Set([...Object.keys(add), ...Object.keys(mult), ...channels]);
  for (const k of keys) {
    // Channels are multipliers: (1 + additive) * multiplicative; untouched → 1
    out[k] = (1 + (add[k] ?? 0)) * (mult[k] ?? 1);
  }
  return out;
}

export function applyChannelMult(
  bag: Partial<ResourceBag>,
  channels: Record<string, number>,
  prefix: string,
): Partial<ResourceBag> {
  const out: Partial<ResourceBag> = {};
  for (const [k, v] of Object.entries(bag)) {
    if (v === undefined) continue;
    const m = channels[`${prefix}.${k}`] ?? channels[prefix] ?? 1;
    out[k as keyof ResourceBag] = v * m;
  }
  return out;
}
