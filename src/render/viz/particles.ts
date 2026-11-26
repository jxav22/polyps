/**
 * Nutrient flow along edges, upgrade flash blooms, ambient sparks.
 * Tuned for readable motion: trails, shockwave rings, clear sparks.
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

export function spawnFlash(
  at: Vec2,
  hue: number,
  time: number,
  strength = 1,
  kind: FlashEvent["kind"] = "upgrade"
): FlashEvent {
  return {
    x: at.x,
    y: at.y,
    hue,
    born: time,
    duration: kind === "select" ? 0.35 : 0.55 + strength * 0.25,
    strength,
    kind,
  };
}

export function spawnSparks(at: Vec2, hue: number, n = 12): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 50 + Math.random() * 90;
    out.push({
      x: at.x,
      y: at.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.45,
      hue: hue + (Math.random() - 0.5) * 30,
      size: 1.8 + Math.random() * 2.8,
      kind: "spark",
    });
  }
  return out;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  const next: Particle[] = [];
  const trails: Particle[] = [];
  for (const p of particles) {
    p.life += dt;
    if (p.life >= p.maxLife) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "spark") {
      p.vx *= Math.pow(0.08, dt); // frame-rate independent damp
      p.vy *= Math.pow(0.08, dt);
      p.vy += 28 * dt;
    }
    if (p.kind === "nutrient" || p.kind === "waste") {
      p.vx += Math.sin(p.life * 8) * 8 * dt;
      p.vy += Math.cos(p.life * 7) * 8 * dt;
      // Soft trail crumbs for motion clarity
      if (Math.random() < dt * 18) {
        trails.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 0.28,
          hue: p.hue,
          size: p.size * 0.55,
          kind: "trail",
        });
      }
    }
    if (p.kind === "trail") {
      p.size *= 0.98;
    }
    next.push(p);
  }
  return next.concat(trails);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const fade = 1 - p.life / p.maxLife;
    const base =
      p.kind === "spark" ? 0.95 : p.kind === "trail" ? 0.35 : p.kind === "waste" ? 0.65 : 0.6;
    const a = fade * base;
    ctx.beginPath();
    ctx.fillStyle = glowColor(p.hue, a, p.kind === "waste" ? 48 : 74);
    const r = p.size * (0.55 + fade * 0.7);
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Bright core on nutrient/waste for readability
    if (p.kind === "nutrient" || p.kind === "waste" || p.kind === "spark") {
      ctx.beginPath();
      ctx.fillStyle = glowColor(p.hue, a * 0.9, 88);
      ctx.arc(p.x, p.y, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
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
    if (u >= 1 || u < 0) continue;
    live.push(f);
    const ease = 1 - Math.pow(1 - Math.min(1, u), 2); // ease-out
    const fade = 1 - u;
    const kind = f.kind ?? "upgrade";

    // Core bloom
    const r = (kind === "select" ? 14 : 22) + ease * (kind === "birth" ? 90 : 75) * f.strength;
    const a = fade * (kind === "select" ? 0.4 : 0.65) * f.strength;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, glowColor(f.hue, a, 90));
    g.addColorStop(0.35, glowColor(f.hue + 25, a * 0.5, 72));
    g.addColorStop(1, glowColor(f.hue, 0, 50));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave ring — primary readability cue
    const ringR = 8 + ease * (55 + f.strength * 40);
    ctx.beginPath();
    ctx.arc(f.x, f.y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor(f.hue, fade * 0.75 * f.strength, 80);
    ctx.lineWidth = 2.2 * fade + 0.5;
    ctx.stroke();

    if (kind === "upgrade" || kind === "birth") {
      // Second delayed ring
      const u2 = Math.max(0, u - 0.12);
      if (u2 > 0) {
        const ring2 = 12 + (1 - Math.pow(1 - u2, 2)) * 70 * f.strength;
        ctx.beginPath();
        ctx.arc(f.x, f.y, ring2, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor(f.hue + 40, fade * 0.35 * f.strength, 75);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
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
  const nutrients = list.filter((p) => p.kind === "nutrient" || p.kind === "waste").length;
  const target = Math.floor(edges.length * 3.5 * scale);

  if (nutrients < target && edges.length) {
    const e = edges[Math.floor(Math.random() * edges.length)];
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (a && b) {
      const wasteLoop =
        (a.archetype === "chamber" && b.archetype === "bacteria") ||
        (b.archetype === "chamber" && a.archetype === "bacteria") ||
        a.archetype === "bacteria" ||
        b.archetype === "bacteria";
      const kind = wasteLoop && Math.random() < 0.45 ? "waste" : "nutrient";
      const hue = kind === "waste" ? 38 : (a.hue + b.hue) / 2;
      list = list.concat(createFlowParticles(a, b, 1, hue));
      const p = list[list.length - 1];
      p.kind = kind;
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 40 + (e.flow ?? 0.5) * 48;
      p.vx = (dx / len) * speed;
      p.vy = (dy / len) * speed;
      p.x = a.pos.x;
      p.y = a.pos.y;
      if (kind === "waste") p.size *= 1.2;
    }
  }
  return list;
}

/** Draw traveling beads on a connection for clear flow direction. */
export function drawFlowBeads(
  ctx: CanvasRenderingContext2D,
  a: LaidOutNode,
  b: LaidOutNode,
  time: number,
  flow: number
): void {
  const mx = (a.pos.x + b.pos.x) / 2;
  const my = (a.pos.y + b.pos.y) / 2;
  const nx = -(b.pos.y - a.pos.y);
  const ny = b.pos.x - a.pos.x;
  const len = Math.hypot(nx, ny) || 1;
  const bend = Math.sin(time * 0.7 + a.angle) * 12;
  const cx = mx + (nx / len) * bend;
  const cy = my + (ny / len) * bend;
  const hue = (a.hue + b.hue) / 2;
  const n = 2 + Math.floor(flow * 2);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const u = (time * (0.35 + flow * 0.45) + i / n) % 1;
    // Quadratic bezier point
    const omu = 1 - u;
    const x = omu * omu * a.pos.x + 2 * omu * u * cx + u * u * b.pos.x;
    const y = omu * omu * a.pos.y + 2 * omu * u * cy + u * u * b.pos.y;
    ctx.beginPath();
    ctx.fillStyle = glowColor(hue, 0.35 + flow * 0.35, 78);
    ctx.arc(x, y, 1.6 + flow, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
