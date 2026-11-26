import { createColony, type ColonyState } from "../sim/colony.ts";
import { createEnv } from "../sim/environment.ts";

export const SAVE_VERSION = 1;
const KEY = "polyps.save.v1";

interface SaveBlob {
  version: number;
  savedAt: number;
  state: ColonyState;
}

export function saveGame(state: ColonyState): void {
  const blob: SaveBlob = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    // ignore quota
  }
}

export function loadGame(): ColonyState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const blob = JSON.parse(raw) as SaveBlob;
    if (!blob || blob.version !== SAVE_VERSION || !blob.state) return null;
    return migrate(blob.state);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Fill missing fields if older shape sneaks in. */
function migrate(raw: ColonyState): ColonyState {
  const base = createColony();
  return {
    ...base,
    ...raw,
    resources: { ...base.resources, ...raw.resources },
    env: { ...createEnv(), ...raw.env },
    structures: Array.isArray(raw.structures) ? raw.structures : base.structures,
    adaptations: Array.isArray(raw.adaptations) ? raw.adaptations : [],
    relics: Array.isArray(raw.relics) ? raw.relics : [],
    flags: Array.isArray(raw.flags) ? raw.flags : ["started"],
    rates: raw.rates ?? base.rates,
    activeSynergies: raw.activeSynergies ?? [],
    gameSpeed: raw.gameSpeed ?? 1.35,
  };
}
