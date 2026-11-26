/**
 * ColonyRenderer — Canvas 2D presentation for Polyps.
 * Reads VizSnapshot / SimSnapshot-shaped data; never mutates sim economy.
 *
 * Drop-in:
 *   import { ColonyRenderer } from "./colony-renderer";
 *   const r = new ColonyRenderer(canvas);
 *   r.setSnapshot(vizFromSim(snapshot));
 *   function frame(t) { r.draw(t); requestAnimationFrame(frame); }
 */

import { drawArchetype, drawConnection } from "./archetypes";
import {
  createBackground,
  drawBackground,
  updateBackground,
  type BackgroundState,
} from "./background";
import {
  buildEdgesFromNodes,
  hitTest,
  layoutColony,
} from "./layout";
import { ARCHETYPE_HUE } from "./palette";
import {
  drawFlashes,
  drawParticles,
  spawnFlash,
  spawnSparks,
  syncEdgeFlows,
} from "./particles";
import type {
  ColonyRendererOptions,
  FlashEvent,
  LaidOutNode,
  NodeClickHandler,
  Particle,
  VizEdge,
  VizNode,
  VizSnapshot,
} from "./types";

export type { VizSnapshot, VizNode, VizEdge, ColonyRendererOptions } from "./types";

/** Map lead SimSnapshot structures → viz nodes (tolerant of missing visual). */
export function vizNodesFromSim(structures: {
  id: string;
  defId: string;
  slot: number;
  neighbors: number[];
  visual?: { archetype?: string; hue?: number; pulse?: number };
  growth?: number;
}[], defsById?: Record<string, { visual?: { archetype?: string; hue?: number; pulse?: number } }>): VizNode[] {
  const idBySlot = new Map(structures.map((s) => [s.slot, s.id]));
  return structures.map((s) => {
    const defVis = defsById?.[s.defId]?.visual;
    const vis = s.visual ?? defVis ?? {};
    const archetype = (vis.archetype as VizNode["archetype"]) || "core";
    return {
      id: s.id,
      defId: s.defId,
      archetype,
      hue: vis.hue ?? ARCHETYPE_HUE[archetype] ?? 180,
      pulse: vis.pulse ?? 1,
      neighbors: s.neighbors
        .map((slot) => idBySlot.get(slot))
        .filter((x): x is string => !!x),
      growth: s.growth ?? 1,
      slot: s.slot,
    };
  });
}

export class ColonyRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private opts: Required<ColonyRendererOptions>;
  private bg: BackgroundState;
  private snapshot: VizSnapshot | null = null;
  private laid: LaidOutNode[] = [];
  private edges: VizEdge[] = [];
  private particles: Particle[] = [];
  private flashes: FlashEvent[] = [];
  private selectedId: string | null = null;
  private hoverId: string | null = null;
  private time = 0;
  private dpr = 1;
  private onClick: NodeClickHandler | null = null;
  private growing = new Map<string, number>(); // id → growth 0–1 tween

  constructor(canvas: HTMLCanvasElement, options: ColonyRendererOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ColonyRenderer: 2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = {
      clearColor: options.clearColor ?? "",
      worldRadius: options.worldRadius ?? 220,
      showVessels: options.showVessels ?? true,
      particleScale: options.particleScale ?? 1,
      interactive: options.interactive ?? true,
    };
    this.bg = createBackground(canvas.width || 800, canvas.height || 600);
    this.resize();
    if (this.opts.interactive) this.bindPointer();
  }

  setOptions(partial: Partial<ColonyRendererOptions>): void {
    Object.assign(this.opts, partial);
  }

  onNodeClick(handler: NodeClickHandler | null): void {
    this.onClick = handler;
  }

  /** Replace colony graph. Triggers growth tweens for new ids. */
  setSnapshot(snap: VizSnapshot): void {
    const prev = new Set(this.laid.map((n) => n.id));
    this.snapshot = snap;
    this.edges = snap.edges?.length
      ? snap.edges
      : buildEdgesFromNodes(snap.nodes);

    for (const n of snap.nodes) {
      if (!prev.has(n.id) && !this.growing.has(n.id)) {
        this.growing.set(n.id, 0);
      }
      if (n.growth !== undefined && n.growth < 1) {
        this.growing.set(n.id, n.growth);
      }
    }

    const nodes = snap.nodes.map((n) => ({
      ...n,
      growth: this.growing.has(n.id) ? this.growing.get(n.id)! : n.growth ?? 1,
    }));
    this.laid = layoutColony(nodes, this.edges, this.opts.worldRadius);
  }

  /** Flash + sparks at a node (upgrade / build feedback). */
  flashNode(nodeId: string, strength = 1): void {
    const n = this.laid.find((x) => x.id === nodeId);
    if (!n) return;
    this.flashes.push(spawnFlash(n.pos, n.hue, this.time, strength));
    this.particles.push(...spawnSparks(n.pos, n.hue, Math.floor(8 + strength * 8)));
  }

  /** Flash at world coords (e.g. prestige). */
  flashAt(x: number, y: number, hue = 180, strength = 1): void {
    this.flashes.push(spawnFlash({ x, y }, hue, this.time, strength));
    this.particles.push(...spawnSparks({ x, y }, hue, 14));
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  setSelectedId(id: string | null): void {
    this.selectedId = id;
  }

  getLaidNodes(): readonly LaidOutNode[] {
    return this.laid;
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    const cssW = parent?.clientWidth || this.canvas.clientWidth || 800;
    const cssH = parent?.clientHeight || this.canvas.clientHeight || 600;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(cssW * this.dpr);
    this.canvas.height = Math.floor(cssH * this.dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.bg = createBackground(cssW, cssH, Math.floor(40 + (cssW * cssH) / 20000));
  }

  /** Screen → colony world (origin at canvas center). */
  screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    return {
      x: clientX - rect.left - w / 2,
      y: clientY - rect.top - h / 2,
    };
  }

  private bindPointer(): void {
    this.canvas.addEventListener("pointermove", (e) => {
      const w = this.screenToWorld(e.clientX, e.clientY);
      const hit = hitTest(this.laid, w);
      this.hoverId = hit?.id ?? null;
      this.canvas.style.cursor = hit ? "pointer" : "default";
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      const w = this.screenToWorld(e.clientX, e.clientY);
      const hit = hitTest(this.laid, w);
      this.selectedId = hit?.id ?? null;
      this.onClick?.(hit, e);
    });
  }

  private tickGrowth(dt: number): void {
    if (!this.growing.size || !this.snapshot) return;
    let dirty = false;
    for (const [id, g] of this.growing) {
      const next = Math.min(1, g + dt * 1.6);
      if (next >= 1) {
        this.growing.delete(id);
        dirty = true;
      } else {
        this.growing.set(id, next);
        dirty = true;
      }
    }
    if (dirty) {
      const nodes = this.snapshot.nodes.map((n) => ({
        ...n,
        growth: this.growing.get(n.id) ?? n.growth ?? 1,
      }));
      this.laid = layoutColony(nodes, this.edges, this.opts.worldRadius);
    }
  }

  /**
   * Draw one frame. Pass absolute seconds (performance.now()/1000) or monotonic time.
   * Internally tracks dt from last call.
   */
  private lastT: number | null = null;

  draw(timeSeconds: number): void {
    const t = timeSeconds;
    const dt = this.lastT == null ? 1 / 60 : Math.min(0.05, Math.max(0, t - this.lastT));
    this.lastT = t;
    this.time = t;

    const w = this.canvas.clientWidth || this.canvas.width / this.dpr;
    const h = this.canvas.clientHeight || this.canvas.height / this.dpr;
    const env = this.snapshot?.env ?? {};
    const light = env.light ?? 0.55;
    const current = env.current ?? 0.3;
    const disturbance = env.disturbance ?? 0;

    this.tickGrowth(dt);
    updateBackground(this.bg, dt, w, h, current);
    this.particles = syncEdgeFlows(
      this.particles,
      this.laid,
      this.edges,
      dt,
      this.opts.particleScale
    );

    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    drawBackground(ctx, this.bg, w, h, light, disturbance);

    ctx.translate(w / 2, h / 2);

    // Subtle colony sway from current
    const sway = Math.sin(t * 0.35) * (2 + current * 4);
    ctx.rotate(sway * 0.002);
    ctx.translate(sway * 0.3, Math.cos(t * 0.28) * 1.5);

    if (this.opts.showVessels) {
      for (const e of this.edges) {
        const a = this.laid.find((n) => n.id === e.from);
        const b = this.laid.find((n) => n.id === e.to);
        if (a && b) drawConnection(ctx, a, b, t, e.flow ?? 0.45);
      }
    }

    // Draw small → large so core sits on top-ish; core last
    const order = [...this.laid].sort((a, b) => {
      if (a.archetype === "core") return 1;
      if (b.archetype === "core") return -1;
      return a.radius - b.radius;
    });

    const drawCtx = {
      ctx,
      time: t,
      selectedId: this.selectedId ?? this.hoverId,
    };
    for (const n of order) {
      // Hover breathe
      if (n.id === this.hoverId && n.id !== this.selectedId) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        drawArchetype(drawCtx, { ...n, pulse: n.pulse * 1.25 });
        ctx.restore();
      } else {
        drawArchetype(drawCtx, n);
      }
    }

    drawParticles(ctx, this.particles);
    this.flashes = drawFlashes(ctx, this.flashes, t);

    ctx.restore();
  }
}
