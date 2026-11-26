/**
 * Deep-sea bioluminescent palette — submarine, not SaaS.
 * Teal / cyan / violet accents on near-black water.
 */

export const DEPTH = {
  abyss: "#02060c",
  deep: "#061018",
  mid: "#0a1c28",
  shallows: "#0e2a36",
} as const;

export const GLOW = {
  teal: "#2ee6c8",
  cyan: "#5ce1ff",
  azure: "#3aa7ff",
  violet: "#8b6cff",
  magenta: "#c45cff",
  amber: "#ffb35c",
  lime: "#7dff9a",
  coral: "#ff6b6b",
  ivory: "#d8f0ff",
} as const;

/** Archetype → default hue (degrees) if sim omits */
export const ARCHETYPE_HUE: Record<string, number> = {
  core: 185,
  tentacle: 168,
  chamber: 210,
  symbiont: 95,
  membrane: 195,
  bud: 145,
  sensor: 280,
  vessel: 200,
  venom: 330,
  bacteria: 55,
};

export function hsla(h: number, s: number, l: number, a = 1): string {
  return `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`;
}

export function glowColor(hue: number, alpha = 1, lightness = 62): string {
  return hsla(hue, 78, lightness, alpha);
}

export function membraneColor(hue: number, alpha = 0.35): string {
  return hsla(hue, 45, 42, alpha);
}

export function inkColor(alpha = 1): string {
  return `rgba(2, 8, 14, ${alpha})`;
}

export function causticColor(light: number, alpha: number): string {
  const a = alpha * (0.35 + light * 0.65);
  return `rgba(90, 210, 230, ${a})`;
}
