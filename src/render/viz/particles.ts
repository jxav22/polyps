/**
 * Nutrient flow along edges, upgrade flash blooms, ambient sparks.
 */

import { glowColor } from "./palette.ts";
import type { FlashEvent, LaidOutNode, Particle, Vec2, VizEdge } from "./types.ts";

export function createFlowParticles(
  from: LaidOutNode,
  to: LaidOutNode,
  count: number,
  hue: number
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    out.push({
      x: from.pos.x + (to.pos.x - from.pos.x) * t,
      y: from.pos.y + (to.pos.y - from.pos.y) * t,
      vx: (to.pos.x - from.pos.x) * 0.35,
      vy: (to.pos.y - from.pos.y) * 0.35,
      life: Math.random() * 0.5,
      maxLife: 1.2 + Math.random() * 0.8,
      hue,
      size: 1.5 + Math.random() * 2,
      kind: "nutrient",
    });
  }
  return out;
}

export function spawnFlash(at: Vec2, hue: number, time: number, strength = 1): FlashEvent {
  return {
    x: at.x,
    y: at.y,
    hue,
    born: time,
    duration: 0.55 + strength * 0.25,
    strength,
  };
}

export function spawnSparks(at: Vec2, hue: number, n = 12): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 80;
    out.push({
      x: at.x,
      y: at.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.4,
      hue: hue + (Math.random() - 0.5) * 30,
      size: 1.5 + Math.random() * 2.5,
      kind: "spark",
    });
  }
  return out;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  const next: Particle[] = [];
  for (const p of particles) {
    p.life += dt;
    if (p.life >= p.maxLife) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "spark") {
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vy += 20 * dt;
    }
    if (p.kind === "nutrient") {
      p.vx += Math.sin(p.life * 8) * 8 * dt;
      p.vy += Math.cos(p.life * 7) * 8 * dt;
    }
    next.push(p);
  }
  return next;
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const fade = 1 - p.life / p.maxLife;
    const a = fade * (p.kind === "spark" ? 0.9 : 0.55);
    ctx.beginPath();
    ctx.fillStyle = glowColor(p.hue, a, p.kind === "waste" ? 45 : 72);
    ctx.arc(p.x, p.y, p.size * (0.6 + fade * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFlashes(
  ctx: CanvasRenderingContext2D,
  flashes: FlashEvent[],
  time: number
): FlashEvent[] {
  const live: FlashEvent[] = [];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const f of flashes) {
    const u = (time - f.born) / f.duration;
    if (u >= 1) continue;
    live.push(f);
    const r = 20 + u * 70 * f.strength;
    const a = (1 - u) * 0.55 * f.strength;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, glowColor(f.hue, a, 85));
    g.addColorStop(0.4, glowColor(f.hue + 40, a * 0.45, 70));
    g.addColorStop(1, glowColor(f.hue, 0, 50));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return live;
}

/** Advance nutrient particles along vessel curves; respawn when spent. */
export function syncEdgeFlows(
  particles: Particle[],
  nodes: LaidOutNode[],
  edges: VizEdge[],
  dt: number,
  scale: number
): Particle[] {
  let list = updateParticles(particles, dt);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nutrients = list.filter((p) => p.kind === "nutrient").length;
  const target = Math.floor(edges.length * 3 * scale);

  if (nutrients < target && edges.length) {
    const e = edges[Math.floor(Math.random() * edges.length)];
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (a && b) {
      const hue = (a.hue + b.hue) / 2;
      list = list.concat(createFlowParticles(a, b, 1, hue));
      // Bias velocity toward destination
      const p = list[list.length - 1];
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 35 + (e.flow ?? 0.5) * 40;
      p.vx = (dx / len) * speed;
      p.vy = (dy / len) * speed;
      p.x = a.pos.x;
      p.y = a.pos.y;
    }
  }
  return list;
}
