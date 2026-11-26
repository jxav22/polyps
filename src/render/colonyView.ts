import { STRUCTURE_MAP } from "../data/structures.ts";
import type { SimSnapshot } from "../sim/colony.ts";
import { slotPosition } from "../sim/structures.ts";

export interface ColonyView {
  canvas: HTMLCanvasElement;
  hitTest(x: number, y: number): number | null;
  draw(snap: SimSnapshot, t: number, selectedSlot: number | null): void;
  resize(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  hue: number;
}

export function createColonyView(canvas: HTMLCanvasElement): ColonyView {
  const ctx = canvas.getContext("2d")!;
  const particles: Particle[] = [];
  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    const parent = canvas.parentElement ?? document.body;
    const rect = parent.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = Math.max(320, rect.width);
    h = Math.max(320, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spacing() {
    return Math.min(w, h) * 0.09;
  }

  function center() {
    return { cx: w * 0.5, cy: h * 0.52 };
  }

  function hitTest(clientX: number, clientY: number): number | null {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cx, cy } = center();
    const sp = spacing();
    let best: number | null = null;
    let bestD = Infinity;
    // Check occupied + empty nearby for build targeting via UI; hitTest returns slot under cursor
    for (let slot = 0; slot < 37; slot++) {
      const p = slotPosition(slot, cx, cy, sp);
      const d = Math.hypot(p.x - x, p.y - y);
      const r = slot === 0 ? sp * 0.55 : sp * 0.38;
      if (d < r && d < bestD) {
        bestD = d;
        best = slot;
      }
    }
    return best;
  }

  function spawnFlow(snap: SimSnapshot, t: number) {
    if (particles.length > 120) return;
    const { cx, cy } = center();
    const sp = spacing();
    const nutrientRate = snap.rates.nutrients ?? 0;
    if (nutrientRate > 0.2 && Math.random() < 0.4) {
      const ang = t * 0.3 + Math.random() * Math.PI * 2;
      const r = sp * (2.5 + Math.random());
      particles.push({
        x: cx + Math.cos(ang) * r,
        y: cy + Math.sin(ang) * r,
        vx: (cx - (cx + Math.cos(ang) * r)) * 0.015,
        vy: (cy - (cy + Math.sin(ang) * r)) * 0.015,
        life: 1,
        hue: 170,
      });
    }
    if ((snap.rates.energy ?? 0) > 0.5 && Math.random() < 0.25) {
      particles.push({
        x: cx + (Math.random() - 0.5) * sp,
        y: cy + (Math.random() - 0.5) * sp,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.6 - Math.random() * 0.4,
        life: 1,
        hue: 45,
      });
    }
  }

  function draw(snap: SimSnapshot, t: number, selectedSlot: number | null) {
    if (!w) resize();
    const { cx, cy } = center();
    const sp = spacing();

    // Deep water background
    const g = ctx.createRadialGradient(cx, cy * 0.7, 20, cx, cy, Math.max(w, h) * 0.7);
    g.addColorStop(0, "#0a2a32");
    g.addColorStop(0.45, "#061820");
    g.addColorStop(1, "#030a10");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Soft caustic shimmer
    ctx.save();
    ctx.globalAlpha = 0.08 + snap.env.light * 0.1;
    for (let i = 0; i < 5; i++) {
      const yy = ((t * (12 + i * 3) + i * 80) % (h + 40)) - 20;
      ctx.strokeStyle = `hsla(${180 + i * 12}, 70%, 70%, 0.5)`;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      for (let x = 0; x <= w; x += 24) {
        ctx.lineTo(x, yy + Math.sin(x * 0.02 + t + i) * 10);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Disturbance haze
    if (snap.env.disturbance > 0.1) {
      ctx.fillStyle = `rgba(80, 40, 90, ${snap.env.disturbance * 0.18})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Slot ghosts for empty buildable
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let slot = 1; slot <= 18; slot++) {
      const occupied = snap.structures.some((s) => s.slot === slot);
      if (occupied) continue;
      const p = slotPosition(slot, cx, cy, sp);
      ctx.beginPath();
      ctx.arc(p.x, p.y, sp * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = "#4ecdc4";
      ctx.stroke();
    }
    ctx.restore();

    // Connections
    const bySlot = new Map(snap.structures.map((s) => [s.slot, s]));
    ctx.lineWidth = 2;
    for (const s of snap.structures) {
      const def = STRUCTURE_MAP[s.defId];
      const a = slotPosition(s.slot, cx, cy, sp);
      for (const n of s.neighbors) {
        if (n <= s.slot) continue;
        if (!bySlot.has(n)) continue;
        const b = slotPosition(n, cx, cy, sp);
        const pulse = 0.25 + 0.15 * Math.sin(t * 2 + s.slot);
        ctx.strokeStyle = `hsla(${def?.visual.hue ?? 180}, 60%, 55%, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Structures
    for (const s of snap.structures) {
      const def = STRUCTURE_MAP[s.defId];
      if (!def) continue;
      const p = slotPosition(s.slot, cx, cy, sp);
      const r = (s.slot === 0 ? sp * 0.5 : sp * 0.34) * (0.55 + 0.45 * s.growth);
      const pulse = 1 + Math.sin(t * def.visual.pulse * 2 + s.slot) * 0.06;
      const hue = def.visual.hue;
      const selected = selectedSlot === s.slot;

      // glow
      const glow = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 2.2);
      glow.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.35)`);
      glow.addColorStop(1, `hsla(${hue}, 80%, 40%, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      drawArchetype(ctx, def.visual.archetype, p.x, p.y, r * pulse, hue, t, selected);
    }

    spawnFlow(snap, t);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.life * 0.7})`;
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Light vignette based on env
    ctx.fillStyle = `rgba(0,0,0,${0.25 - snap.env.light * 0.15})`;
    ctx.fillRect(0, 0, w, h);
  }

  return { canvas, hitTest, draw, resize };
}

function drawArchetype(
  ctx: CanvasRenderingContext2D,
  archetype: string,
  x: number,
  y: number,
  r: number,
  hue: number,
  t: number,
  selected: boolean,
) {
  ctx.save();
  if (selected) {
    ctx.shadowColor = `hsla(${hue}, 90%, 70%, 0.9)`;
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = `hsla(${hue}, 55%, 42%, 0.95)`;
  ctx.strokeStyle = `hsla(${hue}, 70%, 72%, 0.9)`;
  ctx.lineWidth = 2;

  switch (archetype) {
    case "tentacle": {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = t * 1.5 + i * 2.1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * r * 1.1,
          y + Math.sin(a) * r * 1.1,
          x + Math.cos(a + 0.4) * r * 1.6,
          y + Math.sin(a + 0.4) * r * 1.6,
        );
        ctx.stroke();
      }
      break;
    }
    case "chamber": {
      roundPoly(ctx, x, y, r, 6, t * 0.1);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
      ctx.fill();
      break;
    }
    case "symbiont": {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.cos(a) * r * 0.45,
          y + Math.sin(a) * r * 0.45,
          r * 0.28,
          r * 0.16,
          a,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      break;
    }
    case "membrane": {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 40%, 50%, 0.35)`;
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "bud": {
      ctx.beginPath();
      ctx.arc(x - r * 0.25, y, r * 0.55, 0, Math.PI * 2);
      ctx.arc(x + r * 0.3, y - r * 0.15, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "sensor": {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 90%, 80%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, r * (1 + 0.2 * Math.sin(t * 3)), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "vessel": {
      roundPoly(ctx, x, y, r * 0.85, 4, Math.PI / 4);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "venom": {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.7, y + r * 0.6);
      ctx.lineTo(x - r * 0.7, y + r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "bacteria": {
      for (let i = 0; i < 4; i++) {
        const a = t * 2 + i * 1.7;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default: {
      // core absorber — lobed polyp
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = r * (0.85 + 0.15 * Math.sin(a * 3 + t));
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function roundPoly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  sides: number,
  rot: number,
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
