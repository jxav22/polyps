/**
 * Organic graph layout — radial lobes from a core, soft repulsion.
 * Not a grid; positions feel like a living colony silhouette.
 */

import type { LaidOutNode, Vec2, VizEdge, VizNode } from "./types.ts";

/** Softly blend toward a new layout so growth doesn't teleport. */
export function lerpLayout(
  prev: LaidOutNode[],
  next: LaidOutNode[],
  alpha: number
): LaidOutNode[] {
  const a = Math.max(0, Math.min(1, alpha));
  const prevById = new Map(prev.map((n) => [n.id, n]));
  return next.map((n) => {
    const p = prevById.get(n.id);
    if (!p) return n;
    return {
      ...n,
      pos: {
        x: p.pos.x + (n.pos.x - p.pos.x) * a,
        y: p.pos.y + (n.pos.y - p.pos.y) * a,
      },
      radius: p.radius + (n.radius - p.radius) * a,
    };
  });
}

const ARCHETYPE_RADIUS: Record<string, number> = {
  core: 28,
  tentacle: 16,
  chamber: 22,
  symbiont: 14,
  membrane: 20,
  bud: 12,
  sensor: 13,
  vessel: 10,
  venom: 15,
  bacteria: 11,
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Prefer a core node as colony heart; else first node. */
function pickCore(nodes: VizNode[]): VizNode {
  return nodes.find((n) => n.archetype === "core") ?? nodes[0];
}

/**
 * Place nodes in organic rings around the core using neighbor topology.
 * Runs a few soft repulsion/attraction iterations for natural clustering.
 */
export function layoutColony(
  nodes: VizNode[],
  edges: VizEdge[] | undefined,
  worldRadius = 220
): LaidOutNode[] {
  if (!nodes.length) return [];

  const core = pickCore(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const laid = new Map<string, LaidOutNode>();

  const edgeList =
    edges ??
    nodes.flatMap((n) =>
      n.neighbors
        .filter((nid) => byId.has(nid) && n.id < nid)
        .map((nid) => ({ from: n.id, to: nid, flow: 0.5 }))
    );

  // BFS rings from core
  const ring = new Map<string, number>();
  const queue = [core.id];
  ring.set(core.id, 0);
  while (queue.length) {
    const id = queue.shift()!;
    const n = byId.get(id)!;
    const r = ring.get(id)!;
    for (const nid of n.neighbors) {
      if (!ring.has(nid) && byId.has(nid)) {
        ring.set(nid, r + 1);
        queue.push(nid);
      }
    }
  }
  for (const n of nodes) {
    if (!ring.has(n.id)) ring.set(n.id, 2 + Math.floor(hash(n.id) * 2));
  }

  const maxRing = Math.max(1, ...ring.values());
  const byRing = new Map<number, VizNode[]>();
  for (const n of nodes) {
    const r = ring.get(n.id)!;
    if (!byRing.has(r)) byRing.set(r, []);
    byRing.get(r)!.push(n);
  }

  for (const [r, group] of byRing) {
    group.sort((a, b) => a.id.localeCompare(b.id));
    const count = group.length;
    const radius =
      r === 0 ? 0 : (worldRadius * 0.28 + (worldRadius * 0.55 * r) / maxRing);

    group.forEach((n, i) => {
      const jitter = (hash(n.id) - 0.5) * 0.35;
      const angle =
        r === 0
          ? 0
          : ((i + 0.5) / count) * Math.PI * 2 +
            jitter +
            hash(core.id + ":spin") * Math.PI * 2;
      const radJitter = r === 0 ? 0 : (hash(n.id + "r") - 0.5) * 18;
      const pos =
        r === 0
          ? { x: 0, y: 0 }
          : {
              x: Math.cos(angle) * (radius + radJitter),
              y: Math.sin(angle) * (radius + radJitter),
            };
      const baseR = ARCHETYPE_RADIUS[n.archetype] ?? 14;
      const growth = n.growth ?? 1;
      laid.set(n.id, {
        ...n,
        pos,
        radius: baseR * (0.55 + 0.45 * growth),
        angle,
      });
    });
  }

  // Soft force relax
  const arr = [...laid.values()];
  for (let iter = 0; iter < 28; iter++) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (a.archetype === "core" && b.archetype === "core") continue;
        const d = dist(a.pos, b.pos) || 0.01;
        const minD = a.radius + b.radius + 14;
        if (d < minD) {
          const push = ((minD - d) / d) * 0.45;
          const dx = (a.pos.x - b.pos.x) * push;
          const dy = (a.pos.y - b.pos.y) * push;
          if (a.archetype !== "core") {
            a.pos.x += dx;
            a.pos.y += dy;
          }
          if (b.archetype !== "core") {
            b.pos.x -= dx;
            b.pos.y -= dy;
          }
        }
      }
    }
    for (const e of edgeList) {
      const a = laid.get(e.from);
      const b = laid.get(e.to);
      if (!a || !b) continue;
      const d = dist(a.pos, b.pos) || 0.01;
      const ideal = a.radius + b.radius + 36;
      const pull = (d - ideal) * 0.04;
      const dx = ((b.pos.x - a.pos.x) / d) * pull;
      const dy = ((b.pos.y - a.pos.y) / d) * pull;
      if (a.archetype !== "core") {
        a.pos.x += dx;
        a.pos.y += dy;
      }
      if (b.archetype !== "core") {
        b.pos.x -= dx;
        b.pos.y -= dy;
      }
    }
  }

  return arr;
}

export function hitTest(
  nodes: LaidOutNode[],
  world: Vec2,
  pad = 4
): LaidOutNode | null {
  let best: LaidOutNode | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const d = dist(n.pos, world);
    if (d <= n.radius + pad && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

export function buildEdgesFromNodes(nodes: VizNode[]): VizEdge[] {
  const seen = new Set<string>();
  const edges: VizEdge[] = [];
  for (const n of nodes) {
    for (const nid of n.neighbors) {
      const key = n.id < nid ? `${n.id}|${nid}` : `${nid}|${n.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: n.id, to: nid, flow: 0.4 + hash(key) * 0.5 });
    }
  }
  return edges;
}
