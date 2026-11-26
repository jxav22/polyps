/**
 * Sample colony + tiny loop helpers for wiring / smoke demos.
 */

import { ColonyRenderer } from "./colony-renderer";
import type { VizSnapshot } from "./types";

/** Representative v1 colony covering every archetype. */
export const DEMO_SNAPSHOT: VizSnapshot = {
  time: 0,
  env: { light: 0.62, current: 0.35, disturbance: 0.05 },
  nodes: [
    {
      id: "n0",
      defId: "absorber",
      archetype: "core",
      hue: 185,
      pulse: 1.2,
      neighbors: ["n1", "n2", "n3", "n7"],
    },
    {
      id: "n1",
      defId: "tentacle",
      archetype: "tentacle",
      hue: 168,
      pulse: 1.4,
      neighbors: ["n0", "n8"],
    },
    {
      id: "n2",
      defId: "chamber",
      archetype: "chamber",
      hue: 210,
      pulse: 0.9,
      neighbors: ["n0", "n3", "n9"],
    },
    {
      id: "n3",
      defId: "symbiont",
      archetype: "symbiont",
      hue: 95,
      pulse: 1.6,
      neighbors: ["n0", "n2", "n4"],
    },
    {
      id: "n4",
      defId: "membrane",
      archetype: "membrane",
      hue: 195,
      pulse: 0.7,
      neighbors: ["n3", "n5"],
    },
    {
      id: "n5",
      defId: "bud",
      archetype: "bud",
      hue: 145,
      pulse: 1.1,
      neighbors: ["n4"],
      growth: 0.85,
    },
    {
      id: "n6",
      defId: "sensor",
      archetype: "sensor",
      hue: 280,
      pulse: 1.3,
      neighbors: ["n7", "n8"],
    },
    {
      id: "n7",
      defId: "vessel",
      archetype: "vessel",
      hue: 200,
      pulse: 0.8,
      neighbors: ["n0", "n6", "n9"],
    },
    {
      id: "n8",
      defId: "venom",
      archetype: "venom",
      hue: 330,
      pulse: 1.5,
      neighbors: ["n1", "n6"],
    },
    {
      id: "n9",
      defId: "bacteria",
      archetype: "bacteria",
      hue: 55,
      pulse: 1.0,
      neighbors: ["n2", "n7"],
    },
  ],
  edges: [
    { from: "n0", to: "n1", flow: 0.8 },
    { from: "n0", to: "n2", flow: 0.7 },
    { from: "n0", to: "n3", flow: 0.6 },
    { from: "n0", to: "n7", flow: 0.9 },
    { from: "n2", to: "n3", flow: 0.5 },
    { from: "n3", to: "n4", flow: 0.4 },
    { from: "n4", to: "n5", flow: 0.35 },
    { from: "n7", to: "n6", flow: 0.55 },
    { from: "n6", to: "n8", flow: 0.65 },
    { from: "n1", to: "n8", flow: 0.5 },
    { from: "n2", to: "n9", flow: 0.75 },
    { from: "n7", to: "n9", flow: 0.7 },
  ],
};

/**
 * Mount a looping demo on a canvas. Returns a stop() function.
 */
export function demoLoop(
  canvas: HTMLCanvasElement,
  opts?: { flashEverySec?: number }
): { renderer: ColonyRenderer; stop: () => void } {
  const renderer = new ColonyRenderer(canvas, { interactive: true });
  renderer.setSnapshot({ ...DEMO_SNAPSHOT });
  renderer.onNodeClick((node) => {
    if (node) renderer.flashNode(node.id, 1.2);
  });

  let raf = 0;
  let lastFlash = 0;
  const every = opts?.flashEverySec ?? 4;

  const frame = (ms: number) => {
    const t = ms / 1000;
    // Gentle env breathing
    const snap = {
      ...DEMO_SNAPSHOT,
      time: t,
      env: {
        light: 0.45 + Math.sin(t * 0.25) * 0.2,
        current: 0.25 + Math.sin(t * 0.15) * 0.15,
        disturbance: 0.02 + Math.max(0, Math.sin(t * 0.1)) * 0.08,
      },
    };
    renderer.setSnapshot(snap);
    if (t - lastFlash > every) {
      lastFlash = t;
      const ids = DEMO_SNAPSHOT.nodes.map((n) => n.id);
      renderer.flashNode(ids[Math.floor(Math.random() * ids.length)], 0.8);
    }
    renderer.draw(t);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  const onResize = () => renderer.resize();
  window.addEventListener("resize", onResize);

  return {
    renderer,
    stop: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    },
  };
}
