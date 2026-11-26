/**
 * Atmospheric deep-water backdrop: depth gradient, soft caustics, plankton motes.
 */

import { DEPTH, causticColor } from "./palette";
import type { Particle } from "./types";

export interface BackgroundState {
  motes: Particle[];
  time: number;
}

export function createBackground(w: number, h: number, count = 48): BackgroundState {
  const motes: Particle[] = [];
  for (let i = 0; i < count; i++) {
    motes.push(spawnMote(w, h, Math.random() * 8));
  }
  return { motes, time: 0 };
}

function spawnMote(w: number, h: number, lifeBias = 0): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 6 - 2,
    life: lifeBias + Math.random() * 6,
    maxLife: 6 + Math.random() * 10,
    hue: 170 + Math.random() * 40,
    size: 0.6 + Math.random() * 2.2,
    kind: "mote",
  };
}

export function updateBackground(
  bg: BackgroundState,
  dt: number,
  w: number,
  h: number,
  current = 0.3
): void {
  bg.time += dt;
  const drift = current * 18;
  for (const m of bg.motes) {
    m.life += dt;
    m.x += (m.vx + drift) * dt;
    m.y += m.vy * dt;
    m.vx += Math.sin(bg.time * 0.4 + m.y * 0.01) * 2 * dt;
    if (m.life > m.maxLife || m.x < -20 || m.x > w + 20 || m.y < -20 || m.y > h + 20) {
      Object.assign(m, spawnMote(w, h));
      m.life = 0;
    }
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: BackgroundState,
  w: number,
  h: number,
  light = 0.5,
  disturbance = 0
): void {
  // Depth wash
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  g.addColorStop(0, DEPTH.shallows);
  g.addColorStop(0.45, DEPTH.mid);
  g.addColorStop(0.82, DEPTH.deep);
  g.addColorStop(1, DEPTH.abyss);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Soft vertical murk
  const murk = ctx.createLinearGradient(0, 0, 0, h);
  murk.addColorStop(0, "rgba(4, 20, 32, 0.15)");
  murk.addColorStop(0.55, "rgba(0, 0, 0, 0)");
  murk.addColorStop(1, "rgba(0, 4, 10, 0.55)");
  ctx.fillStyle = murk;
  ctx.fillRect(0, 0, w, h);

  // Distant bioluminescent curtains (submarine aurora)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const t = bg.time;
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.2 + i * 0.3) + Math.sin(t * 0.15 + i) * 40;
    const curtain = ctx.createRadialGradient(cx, h * 0.35, 10, cx, h * 0.5, h * 0.55);
    const hue = 175 + i * 35;
    curtain.addColorStop(0, `hsla(${hue}, 70%, 55%, ${0.04 + light * 0.05})`);
    curtain.addColorStop(0.5, `hsla(${hue + 20}, 60%, 40%, ${0.02 + light * 0.03})`);
    curtain.addColorStop(1, "hsla(200, 50%, 20%, 0)");
    ctx.fillStyle = curtain;
    ctx.fillRect(0, 0, w, h);
  }

  // Caustics — shaders-lite sine mesh
  const bands = 5;
  for (let i = 0; i < bands; i++) {
    ctx.beginPath();
    const amp = 10 + i * 4 + disturbance * 12;
    const y0 = h * (0.18 + i * 0.12);
    ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 8) {
      const y =
        y0 +
        Math.sin(x * 0.012 + t * (0.55 + i * 0.07) + i) * amp +
        Math.sin(x * 0.031 - t * 0.4 + i * 1.7) * (amp * 0.35);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = causticColor(light, 0.045 + i * 0.008);
    ctx.lineWidth = 1.2 + light * 1.5;
    ctx.stroke();
  }

  // Plankton motes
  for (const m of bg.motes) {
    const fade = Math.sin((m.life / m.maxLife) * Math.PI);
    const a = 0.15 + fade * 0.45 * (0.4 + light * 0.6);
    ctx.beginPath();
    ctx.fillStyle = `hsla(${m.hue}, 70%, 70%, ${a})`;
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Disturbance haze — purple-brown murk when stressed (readable env cue)
  if (disturbance > 0.08) {
    ctx.fillStyle = `rgba(60, 30, 70, ${disturbance * 0.16})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,2,6,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
