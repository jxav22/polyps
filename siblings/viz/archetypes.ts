/**
 * Procedural silhouette drawers per visual archetype.
 * Each reads growth + pulse so morphing / heartbeat feel alive.
 */

import { glowColor, membraneColor } from "./palette";
import type { LaidOutNode } from "./types";

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  time: number;
  selectedId?: string | null;
}

function pulseScale(node: LaidOutNode, time: number): number {
  const p = node.pulse || 1;
  return 1 + Math.sin(time * (1.4 + p) + node.angle) * 0.06 * p;
}

function blobPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  lobes: number,
  time: number,
  seed: number
): void {
  ctx.beginPath();
  const steps = lobes * 8;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.12 * Math.sin(t * lobes + time * 1.2 + seed) +
      0.05 * Math.sin(t * (lobes + 2) - time * 0.8);
    const px = x + Math.cos(t) * r * wobble;
    const py = y + Math.sin(t) * r * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function fillGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hue: number,
  alpha: number
): void {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.6);
  g.addColorStop(0, glowColor(hue, alpha * 0.85, 72));
  g.addColorStop(0.45, glowColor(hue, alpha * 0.35, 55));
  g.addColorStop(1, glowColor(hue, 0, 40));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawConnection(
  ctx: CanvasRenderingContext2D,
  a: LaidOutNode,
  b: LaidOutNode,
  time: number,
  flow = 0.4
): void {
  const mx = (a.pos.x + b.pos.x) / 2;
  const my = (a.pos.y + b.pos.y) / 2;
  const nx = -(b.pos.y - a.pos.y);
  const ny = b.pos.x - a.pos.x;
  const len = Math.hypot(nx, ny) || 1;
  const bend = Math.sin(time * 0.7 + a.angle) * 12;
  const cx = mx + (nx / len) * bend;
  const cy = my + (ny / len) * bend;

  ctx.beginPath();
  ctx.moveTo(a.pos.x, a.pos.y);
  ctx.quadraticCurveTo(cx, cy, b.pos.x, b.pos.y);
  ctx.strokeStyle = membraneColor((a.hue + b.hue) / 2, 0.25 + flow * 0.25);
  ctx.lineWidth = 2 + flow * 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Soft inner lumen
  ctx.beginPath();
  ctx.moveTo(a.pos.x, a.pos.y);
  ctx.quadraticCurveTo(cx, cy, b.pos.x, b.pos.y);
  ctx.strokeStyle = glowColor((a.hue + b.hue) / 2, 0.12 + flow * 0.2, 70);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCore(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const s = pulseScale(node, time);
  const { x, y } = node.pos;
  const r = node.radius * s;
  fillGlow(ctx, x, y, r, node.hue, 0.55);
  blobPath(ctx, x, y, r, 5, time, 1);
  ctx.fillStyle = membraneColor(node.hue, 0.55);
  ctx.fill();
  blobPath(ctx, x, y, r * 0.55, 3, time * 1.2, 2);
  ctx.fillStyle = glowColor(node.hue, 0.7, 68);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = glowColor(node.hue + 20, 0.95, 85);
  ctx.fill();
}

function drawTentacle(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const len = node.radius * 2.8 * (node.growth ?? 1);
  const baseAngle = node.angle;
  fillGlow(ctx, x, y, node.radius * 0.7, node.hue, 0.35);

  for (let t = 0; t < 3; t++) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 8;
    for (let i = 1; i <= segs; i++) {
      const u = i / segs;
      const wave = Math.sin(time * 2.2 + u * 4 + t) * (6 + t * 2) * u;
      const ang = baseAngle + (t - 1) * 0.35 + wave * 0.04;
      const px = x + Math.cos(ang) * len * u;
      const py = y + Math.sin(ang) * len * u;
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = glowColor(node.hue + t * 8, 0.55 - t * 0.1, 60);
    ctx.lineWidth = (4 - t) * (node.growth ?? 1);
    ctx.lineCap = "round";
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x, y, node.radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = membraneColor(node.hue, 0.6);
  ctx.fill();
}

function drawChamber(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const s = pulseScale(node, time);
  const { x, y } = node.pos;
  const r = node.radius * s;
  fillGlow(ctx, x, y, r, node.hue, 0.4);
  blobPath(ctx, x, y, r, 4, time, 3);
  ctx.fillStyle = membraneColor(node.hue, 0.4);
  ctx.fill();
  ctx.strokeStyle = glowColor(node.hue, 0.5, 65);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Swirling digest contents
  for (let i = 0; i < 5; i++) {
    const a = time * 1.5 + i * 1.2;
    const rr = r * (0.25 + (i % 3) * 0.12);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a * 1.3) * rr * 0.7, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowColor(node.hue + 30, 0.55, 70);
    ctx.fill();
  }
}

function drawSymbiont(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius * pulseScale(node, time);
  fillGlow(ctx, x, y, r * 1.1, node.hue, 0.5 + Math.sin(time * 2) * 0.1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + time * 0.4;
    const px = x + Math.cos(a) * r * 0.55;
    const py = y + Math.sin(a) * r * 0.55;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = glowColor(node.hue, 0.65, 68);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = glowColor(node.hue + 15, 0.85, 78);
  ctx.fill();
}

function drawMembrane(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius * (1.15 + Math.sin(time * 1.1) * 0.04);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 2;
    const wob = 1 + 0.08 * Math.sin(t * 3 + time);
    const px = x + Math.cos(t) * r * wob;
    const py = y + Math.sin(t) * r * wob;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = glowColor(node.hue, 0.55, 62);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = membraneColor(node.hue, 0.18);
  ctx.fill();
}

function drawBud(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const g = node.growth ?? 1;
  const r = node.radius * pulseScale(node, time);
  fillGlow(ctx, x, y, r, node.hue, 0.4);
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y, r * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = membraneColor(node.hue, 0.55);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.45 * g, y - r * 0.1, r * 0.45 * g, 0, Math.PI * 2);
  ctx.fillStyle = glowColor(node.hue + 20, 0.7, 70);
  ctx.fill();
}

function drawSensor(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius * pulseScale(node, time);
  fillGlow(ctx, x, y, r, node.hue, 0.45);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = membraneColor(node.hue, 0.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = glowColor(node.hue, 0.8, 55);
  ctx.fill();
  const pupil = 0.18 + Math.sin(time * 3) * 0.04;
  ctx.beginPath();
  ctx.arc(x + Math.cos(time) * 2, y, r * pupil, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(4, 10, 18, 0.9)";
  ctx.fill();
  // Scan ring
  ctx.beginPath();
  ctx.arc(x, y, r * (1.1 + Math.sin(time * 2.5) * 0.08), 0, Math.PI * 1.4);
  ctx.strokeStyle = glowColor(node.hue, 0.45, 75);
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function drawVessel(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius;
  fillGlow(ctx, x, y, r, node.hue, 0.3);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(node.angle + Math.sin(time) * 0.1);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.4, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = membraneColor(node.hue, 0.55);
  ctx.fill();
  ctx.strokeStyle = glowColor(node.hue, 0.5, 68);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawVenom(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius * pulseScale(node, time);
  fillGlow(ctx, x, y, r, node.hue, 0.4);
  blobPath(ctx, x, y, r * 0.85, 6, time, 9);
  ctx.fillStyle = membraneColor(node.hue, 0.55);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + node.angle;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5);
    ctx.lineTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35);
    ctx.strokeStyle = glowColor(node.hue, 0.7, 58);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  // Drip
  const drip = ((time * 0.6) % 1);
  ctx.beginPath();
  ctx.arc(x, y + r * (0.6 + drip * 0.8), 2, 0, Math.PI * 2);
  ctx.fillStyle = glowColor(node.hue, 0.6 * (1 - drip), 60);
  ctx.fill();
}

function drawBacteria(d: DrawCtx, node: LaidOutNode): void {
  const { ctx, time } = d;
  const { x, y } = node.pos;
  const r = node.radius;
  fillGlow(ctx, x, y, r, node.hue, 0.3);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.9, 0, Math.PI * 2);
  ctx.strokeStyle = membraneColor(node.hue, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = time * 1.8 + i * 0.9;
    const orbit = r * (0.25 + (i % 3) * 0.15);
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * orbit,
      y + Math.sin(a * 1.1) * orbit,
      3.2,
      1.8,
      a,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = glowColor(node.hue + i * 5, 0.7, 65);
    ctx.fill();
  }
}

const DRAWERS: Record<string, (d: DrawCtx, n: LaidOutNode) => void> = {
  core: drawCore,
  tentacle: drawTentacle,
  chamber: drawChamber,
  symbiont: drawSymbiont,
  membrane: drawMembrane,
  bud: drawBud,
  sensor: drawSensor,
  vessel: drawVessel,
  venom: drawVenom,
  bacteria: drawBacteria,
};

export function drawArchetype(d: DrawCtx, node: LaidOutNode): void {
  const fn = DRAWERS[node.archetype] ?? drawCore;
  fn(d, node);
  if (d.selectedId === node.id) {
    const { ctx, time } = d;
    ctx.beginPath();
    ctx.arc(
      node.pos.x,
      node.pos.y,
      node.radius * 1.45 + Math.sin(time * 4) * 2,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = glowColor(node.hue, 0.65, 80);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
