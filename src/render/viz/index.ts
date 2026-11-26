/**
 * Polyps colony visuals — barrel export for `src/render/`.
 *
 * Copy this folder into the Vite app as `src/render/` (or import paths accordingly).
 */

export {
  ColonyRenderer,
  vizNodesFromSim,
} from "./colony-renderer";
export type { ColonyRendererOptions, VizSnapshot, VizNode, VizEdge, NodeClickHandler, LaidOutNode } from "./types";
export { layoutColony, hitTest, buildEdgesFromNodes, lerpLayout } from "./layout";
export { ARCHETYPE_HUE, DEPTH, GLOW, glowColor, hsla } from "./palette";
export { createBackground, drawBackground, updateBackground } from "./background";
export { drawArchetype, drawConnection } from "./archetypes";
export {
  spawnFlash,
  spawnSparks,
  syncEdgeFlows,
  drawParticles,
  drawFlashes,
  drawFlowBeads,
  drawBuildConduit,
  spawnAbsorb,
} from "./particles";
export { DEMO_SNAPSHOT, demoLoop } from "./demo-snapshot";
