export type EnvId =
  | "light"
  | "temperature"
  | "ambientNutrients"
  | "current"
  | "predatorPressure"
  | "disturbance";

export const ENV_IDS: EnvId[] = [
  "light",
  "temperature",
  "ambientNutrients",
  "current",
  "predatorPressure",
  "disturbance",
];

export interface EnvState {
  light: number;
  temperature: number;
  ambientNutrients: number;
  current: number;
  predatorPressure: number;
  disturbance: number;
  /** seconds into current day cycle */
  phase: number;
}

export function createEnv(): EnvState {
  return {
    light: 0.55,
    temperature: 0.5,
    ambientNutrients: 0.7,
    current: 0.35,
    predatorPressure: 0.15,
    disturbance: 0,
    phase: 0,
  };
}

/** Soft cyclic environment — never wipes progress. */
export function tickEnvironment(env: EnvState, dt: number): EnvState {
  const day = 90; // seconds per day cycle (accelerated early game)
  const phase = (env.phase + dt) % day;
  const t = (phase / day) * Math.PI * 2;

  const light = clamp01(0.45 + 0.4 * Math.sin(t) + 0.05 * Math.sin(t * 3));
  const temperature = clamp01(0.5 + 0.2 * Math.sin(t + 0.8));
  const ambientNutrients = clamp01(0.55 + 0.25 * Math.sin(t * 0.7 + 1.2) + 0.1 * Math.cos(t * 2));
  const current = clamp01(0.3 + 0.35 * Math.sin(t * 1.3 + 2) + 0.1 * Math.sin(t * 5));
  let predatorPressure = clamp01(0.1 + 0.25 * Math.sin(t * 0.5 + 3) + 0.05 * Math.sin(t * 7));
  let disturbance = env.disturbance * Math.exp(-dt * 0.35);

  // Rare soft disturbances
  if (Math.sin(phase * 0.17) > 0.97 && Math.cos(phase * 0.41) > 0.9) {
    disturbance = Math.min(1, disturbance + 0.45);
    predatorPressure = Math.min(1, predatorPressure + 0.2);
  }

  return {
    light,
    temperature,
    ambientNutrients,
    current,
    predatorPressure,
    disturbance,
    phase,
  };
}

export function envRecord(env: EnvState): Record<EnvId, number> {
  return {
    light: env.light,
    temperature: env.temperature,
    ambientNutrients: env.ambientNutrients,
    current: env.current,
    predatorPressure: env.predatorPressure,
    disturbance: env.disturbance,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
