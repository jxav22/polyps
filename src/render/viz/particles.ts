/**
 * Nutrient flow along edges, upgrade flash blooms, ambient sparks.
 * Tuned for readable resource flows + clear build/upgrade feedback.
 */

import { glowColor } from "./palette";
import type { FlashEvent, LaidOutNode, Particle, Vec2, VizEdge } from "./types";

export function createFlowParticles(
  from: LaidOutNode,
  to: LaidOutNode,
  count: number,
  hue: number
): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random() * 0.15;
    out.push({
      x: from.pos.x + (to.pos.x - from.pos.x) * t,
      y: from.pos.y + (to.pos.y - from.pos.y) * t,
      vx: (to.pos.x - from.pos.x) * 0.35,
      vy: (to.pos.y - from.pos.y) * 0.35,
      life: 0,
      maxLife: 1.4 + Math.random() * 0.6,
      hue,
      size: 3.2 + Math.random() * 2.2,
      kind: "nutrient",
      tx: to.pos.x,
      ty: to.pos.y,
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
    duration: kind === "select" ? 0.35 : kind === "birth" ? 0.7 + strength * 0.2 : 0.55 + strength * 0.25,
    strength,
    kind,
  };
}

export function spawnSparks(at: Vec2, hue: number, n = 12): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 55 + Math.random() * 100;
    out.push({
      x: at.x,
      y: at.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.4,
      hue: hue + (Math.random() - 0.5) * 30,
      size: 2 + Math.random() * 2.8,
      kind: "spark",
    });
  }
  return out;
}

/** Tiny absorb pops when a flow particle reaches its target. */
export function spawnAbsorb(at: Vec2, hue: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
    out.push({
      x: at.x,
      y: at.y,
      vx: Math.cos(a) * 28,
      vy: Math.sin(a) * 28,
      life: 0,
      maxLife: 0.22,
      hue,
      size: 2.2,
      kind: "spark",
    });
  }
  return out;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  const next: Particle[] = [];
  const extras: Particle[] = [];
  for (const p of particles) {
    p.life += dt;
    if (p.life >= p.maxLife) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === "spark") {
      p.vx *= Math.pow(0.06, dt);
      p.vy *= Math.pow(0.06, dt);
      p.vy += 28 * dt;
    }
    if (p.kind === "nutrient" || p.kind === "waste" || p.kind === "energy") {
      // Mild meander — keep mostly directional for readability
      p.vx += Math.sin(p.life * 6) * 4 * dt;
      p.vy += Math.cos(p.life * 5) * 4 * dt;
      if (Math.random() < dt * 22) {
        extras.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 0.32,
          hue: p.hue,
          size: p.size * 0.6,
          kind: "trail",
        });
      }
      // Arrival absorb
      if (p.tx != null && p.ty != null) {
        const d = Math.hypot(p.tx - p.x, p.ty - p.y);
        if (d < 10) {
          extras.push(...spawnAbsorb({ x: p.tx, y: p.ty }, p.hue));
          continue; // consume particle
        }
      }
    }
    if (p.kind === "trail") p.size *= 0.97;
    next.push(p);
  }
  return next.concat(extras);
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.7, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.7, y);
  ctx.closePath();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    const fade = 1 - p.life / p.maxLife;
    const base =
      p.kind === "spark"
        ? 0.95
        : p.kind === "trail"
          ? 0.4
          : p.kind === "waste"
            ? 0.75
            : p.kind === "energy"
              ? 0.8
              : 0.7;
    const a = fade * base;
    const r = p.size * (0.6 + fade * 0.65);
    ctx.fillStyle = glowColor(
      p.hue,
      a,
      p.kind === "waste" ? 50 : p.kind === "energy" ? 70 : 76
    );

    if (p.kind === "waste") {
      // Amber diamond — distinct from nutrient orbs
      drawDiamond(ctx, p.x, p.y, r);
      ctx.fill();
      ctx.fillStyle = glowColor(p.hue, a * 0.95, 85);
      drawDiamond(ctx, p.x, p.y, r * 0.35);
      ctx.fill();
    } else if (p.kind === "energy") {
      // Elongated streak along velocity
      const ang = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.6, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (p.kind === "nutrient" || p.kind === "spark") {
        ctx.beginPath();
        ctx.fillStyle = glowColor(p.hue, a * 0.95, 90);
        ctx.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const ease = 1 - Math.pow(1 - Math.min(1, u), 2);
    const fade = 1 - u;
    const kind = f.kind ?? "upgrade";

    const r =
      (kind === "select" ? 14 : kind === "birth" ? 26 : 22) +
      ease * (kind === "birth" ? 100 : 75) * f.strength;
    const a = fade * (kind === "select" ? 0.4 : 0.7) * f.strength;
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
    g.addColorStop(0, glowColor(f.hue, a, 92));
    g.addColorStop(0.35, glowColor(f.hue + 25, a * 0.5, 72));
    g.addColorStop(1, glowColor(f.hue, 0, 50));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
    ctx.fill();

    const ringR = 8 + ease * (60 + f.strength * 45);
    ctx.beginPath();
    ctx.arc(f.x, f.y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = glowColor(f.hue, fade * 0.8 * f.strength, 82);
    ctx.lineWidth = 2.5 * fade + 0.6;
    ctx.stroke();

    if (kind === "upgrade" || kind === "birth") {
      const u2 = Math.max(0, u - 0.1);
      if (u2 > 0) {
        const ring2 = 14 + (1 - Math.pow(1 - u2, 2)) * 80 * f.strength;
        ctx.beginPath();
        ctx.arc(f.x, f.y, ring2, 0, Math.PI * 2);
        ctx.strokeStyle = glowColor(f.hue + 40, fade * 0.4 * f.strength, 78);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    // Birth: spokes for extra “structure forming” readability
    if (kind === "birth") {
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + time;
        const len = 12 + ease * 36 * f.strength;
        ctx.beginPath();
        ctx.moveTo(f.x + Math.cos(ang) * 6, f.y + Math.sin(ang) * 6);
        ctx.lineTo(f.x + Math.cos(ang) * len, f.y + Math.sin(ang) * len);
        ctx.strokeStyle = glowColor(f.hue, fade * 0.45 * f.strength, 80);
        ctx.lineWidth = 1.5 * fade;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  return live;
}

function bezierPoint(
  a: Vec2,
  c: Vec2,
  b: Vec2,
  u: number
): Vec2 {
  const omu = 1 - u;
  return {
    x: omu * omu * a.x + 2 * omu * u * c.x + u * u * b.x,
    y: omu * omu * a.y + 2 * omu * u * c.y + u * u * b.y,
  };
}

function edgeControl(a: LaidOutNode, b: LaidOutNode, time: number): Vec2 {
  const mx = (a.pos.x + b.pos.x) / 2;
  const my = (a.pos.y + b.pos.y) / 2;
  const nx = -(b.pos.y - a.pos.y);
  const ny = b.pos.x - a.pos.x;
  const len = Math.hypot(nx, ny) || 1;
  const bend = Math.sin(time * 0.7 + a.angle) * 12;
  return { x: mx + (nx / len) * bend, y: my + (ny / len) * bend };
}

/** Advance resource particles along edges; arrival absorb; color by resource kind. */
export function syncEdgeFlows(
  particles: Particle[],
  nodes: LaidOutNode[],
  edges: VizEdge[],
  dt: number,
  scale: number
): Particle[] {
  let list = updateParticles(particles, dt);
  if (!edges.length) return list;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const target = Math.floor(edges.length * 4 * scale);

  const countFlow = () =>
    list.filter((p) => p.kind === "nutrient" || p.kind === "waste" || p.kind === "energy")
      .length;

  let guard = 0;
  while (countFlow() < target && guard++ < 8) {
    const e = edges[Math.floor(Math.random() * edges.length)];
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) break;

    const wasteLoop =
      (a.archetype === "chamber" && b.archetype === "bacteria") ||
      (b.archetype === "chamber" && a.archetype === "bacteria") ||
      a.archetype === "bacteria" ||
      b.archetype === "bacteria";
    const photo = a.archetype === "symbiont" || b.archetype === "symbiont";

    let kind: Particle["kind"] = "nutrient";
    let hue = 175;
    if (wasteLoop && Math.random() < 0.5) {
      kind = "waste";
      hue = 38;
    } else if (photo && Math.random() < 0.4) {
      kind = "energy";
      hue = 95;
    }

    list = list.concat(createFlowParticles(a, b, 1, hue));
    const p = list[list.length - 1];
    p.kind = kind;
    p.hue = hue;
    const dx = b.pos.x - a.pos.x;
    const dy = b.pos.y - a.pos.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 48 + (e.flow ?? 0.5) * 55;
    p.vx = (dx / len) * speed;
    p.vy = (dy / len) * speed;
    p.x = a.pos.x;
    p.y = a.pos.y;
    p.tx = b.pos.x;
    p.ty = b.pos.y;
    if (kind === "waste") p.size *= 1.25;
    if (kind === "energy") p.size *= 1.1;
  }
  return list;
}

/**
 * Traveling beads + chevron ticks so flow direction is unmistakable.
 */
export function drawFlowBeads(
  ctx: CanvasRenderingContext2D,
  a: LaidOutNode,
  b: LaidOutNode,
  time: number,
  flow: number
): void {
  const c = edgeControl(a, b, time);
  const wasteLoop =
    (a.archetype === "chamber" && b.archetype === "bacteria") ||
    (b.archetype === "chamber" && a.archetype === "bacteria") ||
    a.archetype === "bacteria" ||
    b.archetype === "bacteria";
  const photo = a.archetype === "symbiont" || b.archetype === "symbiont";
  const hue = wasteLoop ? 38 : photo ? 95 : 175;
  const n = 3 + Math.floor(flow * 3);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const u = (time * (0.4 + flow * 0.5) + i / n) % 1;
    const p = bezierPoint(a.pos, c, b.pos, u);
    const p2 = bezierPoint(a.pos, c, b.pos, Math.min(0.999, u + 0.04));
    const ang = Math.atan2(p2.y - p.y, p2.x - p.x);

    // Bead
    ctx.beginPath();
    ctx.fillStyle = glowColor(hue, 0.55 + flow * 0.4, 82);
    ctx.arc(p.x, p.y, 2.8 + flow * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Chevron — direction arrowhead (oversized for readability)
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-2.5, 4.5);
    ctx.lineTo(-2.5, -4.5);
    ctx.closePath();
    ctx.fillStyle = glowColor(hue, 0.7 + flow * 0.25, 90);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Build conduit: animated tendril from parent → growing child.
 * `progress` 0–1 matches growth tween.
 */
export function drawBuildConduit(
  ctx: CanvasRenderingContext2D,
  parent: LaidOutNode,
  child: LaidOutNode,
  progress: number,
  time: number
): void {
  const p = Math.max(0, Math.min(1, progress));
  const ease = 1 - Math.pow(1 - p, 2);
  const c = edgeControl(parent, child, time);
  const hue = child.hue;

  ctx.save();
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";

  // Full ghost path (dim)
  ctx.beginPath();
  ctx.moveTo(parent.pos.x, parent.pos.y);
  ctx.quadraticCurveTo(c.x, c.y, child.pos.x, child.pos.y);
  ctx.strokeStyle = glowColor(hue, 0.12, 70);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Grown portion — sample bezier up to ease
  ctx.beginPath();
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * ease;
    const pt = bezierPoint(parent.pos, c, child.pos, u);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.strokeStyle = glowColor(hue, 0.35 + ease * 0.45, 78);
  ctx.lineWidth = 2.5 + ease * 2;
  ctx.stroke();

  // Leading tip bloom
  const tip = bezierPoint(parent.pos, c, child.pos, ease);
  const g = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 14);
  g.addColorStop(0, glowColor(hue, 0.7, 90));
  g.addColorStop(1, glowColor(hue, 0, 60));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
