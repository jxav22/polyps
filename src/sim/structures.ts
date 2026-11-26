import type { Modifier } from "./modifiers.ts";
import type { EnvId } from "./environment.ts";
import type { ResourceBag, ResourceId } from "./resources.ts";

export type StructureId = string;

export interface StructureDef {
  id: StructureId;
  name: string;
  description: string;
  tags: string[];
  cost: Partial<ResourceBag>;
  upkeep?: Partial<ResourceBag>;
  produce?: Partial<ResourceBag>;
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

export interface StructureInstance {
  id: string;
  defId: StructureId;
  slot: number;
  neighbors: number[];
  /** growth tween 0..1 */
  growth: number;
}

export function countByDef(instances: StructureInstance[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of instances) {
    counts[s.defId] = (counts[s.defId] ?? 0) + 1;
  }
  return counts;
}

export function isUnlocked(
  def: StructureDef,
  counts: Record<string, number>,
  genetic: number,
  flags: string[],
): boolean {
  const u = def.unlock;
  if (!u) return true;
  if (u.requiresGenetic !== undefined && genetic < u.requiresGenetic) return false;
  if (u.requiresFlags) {
    for (const f of u.requiresFlags) {
      if (!flags.includes(f)) return false;
    }
  }
  if (u.requiresStructures) {
    for (const [id, n] of Object.entries(u.requiresStructures)) {
      if ((counts[id] ?? 0) < (n ?? 0)) return false;
    }
  }
  return true;
}

/** Hex ring slots: slot 0 = core, then rings outward. */
export function slotPosition(slot: number, cx: number, cy: number, spacing: number): { x: number; y: number } {
  if (slot === 0) return { x: cx, y: cy };
  // rings of 6, 12, 18...
  let remaining = slot;
  let ring = 1;
  while (remaining > ring * 6) {
    remaining -= ring * 6;
    ring++;
  }
  const indexInRing = remaining - 1;
  const count = ring * 6;
  const angle = (indexInRing / count) * Math.PI * 2 - Math.PI / 2;
  const r = spacing * ring;
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

export function neighborSlots(slot: number): number[] {
  if (slot === 0) return [1, 2, 3, 4, 5, 6];
  // Approximate: adjacent indices in same ring ±1, and parent-ish toward core
  let remaining = slot;
  let ring = 1;
  let start = 1;
  while (remaining > ring * 6) {
    remaining -= ring * 6;
    start += ring * 6;
    ring++;
  }
  const indexInRing = remaining - 1;
  const count = ring * 6;
  const prev = start + ((indexInRing - 1 + count) % count);
  const next = start + ((indexInRing + 1) % count);
  const neighbors = [prev, next];
  if (ring === 1) {
    neighbors.push(0);
  } else {
    const innerStart = start - (ring - 1) * 6;
    const innerCount = (ring - 1) * 6;
    const innerIdx = Math.floor((indexInRing / count) * innerCount);
    neighbors.push(innerStart + innerIdx);
    neighbors.push(innerStart + ((innerIdx + 1) % innerCount));
  }
  return neighbors;
}

export const MAX_SLOTS = 1 + 6 + 12 + 18; // 37 slots
