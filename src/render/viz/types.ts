/**
 * Presentation-facing types for the Polyps colony renderer.
 * Aligns with internal/polyps-interfaces.ts SimSnapshot shapes.
 */

export type VisualArchetype =
  | "core"
  | "tentacle"
  | "chamber"
  | "symbiont"
  | "membrane"
  | "bud"
  | "sensor"
  | "vessel"
  | "venom"
  | "bacteria";

export interface VizNode {
  id: string;
  defId: string;
  archetype: VisualArchetype;
  /** 0–360 degrees; used as bioluminescent tint bias */
  hue: number;
  /** 0.2–2 pulse amplitude */
  pulse: number;
  /** graph neighbors by node id */
  neighbors: string[];
  /** 0–1 growth tween (1 = fully grown) */
  growth?: number;
  /** optional world hint from sim slot layout */
  slot?: number;
}

export interface VizEdge {
  from: string;
  to: string;
  /** nutrient flow intensity 0–1 */
  flow?: number;
}

export interface VizSnapshot {
  time: number;
  nodes: VizNode[];
  edges?: VizEdge[];
  env?: {
    light?: number;
    current?: number;
    disturbance?: number;
  };
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface LaidOutNode extends VizNode {
  pos: Vec2;
  radius: number;
  angle: number;
}

export interface FlashEvent {
  x: number;
  y: number;
  hue: number;
  born: number;
  duration: number;
  strength: number;
  /** "upgrade" = bloom+ring; "select" = soft confirm ping */
  kind?: "upgrade" | "select" | "birth";
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
  kind: "nutrient" | "mote" | "spark" | "waste" | "trail" | "energy";
  /** destination for arrival absorb cue */
  tx?: number;
  ty?: number;
}

export interface ColonyRendererOptions {
  /** CSS color override for clear — usually leave undefined */
  clearColor?: string;
  /** world units mapped into canvas; default auto-fit */
  worldRadius?: number;
  /** show soft connection strands */
  showVessels?: boolean;
  /** particle density multiplier */
  particleScale?: number;
  /** click hit testing */
  interactive?: boolean;
}

export type NodeClickHandler = (node: LaidOutNode | null, event: PointerEvent) => void;
