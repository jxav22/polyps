/**
 * Polyps colony visuals — barrel export for `src/render/`.
 *
 * Copy this folder into the Vite app as `src/render/` (or import paths accordingly).
 */

export {
  ColonyRenderer,
  vizNodesFromSim,
} from "./colony-renderer.ts";
export type { ColonyRendererOptions, VizSnapshot, VizNode, VizEdge, NodeClickHandler, LaidOutNode } from "./types.ts";
export { layoutColony, hitTest, buildEdgesFromNodes, lerpLayout } from "./layout.ts";
export { ARCHETYPE_HUE, DEPTH, GLOW, glowColor, hsla } from "./palette.ts";
export { createBackground, drawBackground, updateBackground } from "./background.ts";
export { drawArchetype, drawConnection } from "./archetypes.ts";
export {
  spawnFlash,
  spawnSparks,
  syncEdgeFlows,
  drawParticles,
  drawFlashes,
} from "./particles.ts";
export { DEMO_SNAPSHOT, demoLoop } from "./demo-snapshot.ts";
