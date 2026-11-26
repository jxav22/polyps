/**
 * Versioned save roundtrip helpers — shape contracts for tests & lead save/.
 */

import {
  deserializeState,
  serializeState,
  snapshot,
  type createInitialState,
} from "./reference-sim.ts";
import type { ResourceBag, SimSnapshot, SimState } from "./types.ts";
import { ENV_IDS, RESOURCE_IDS } from "./types.ts";

export const SAVE_VERSION = 1;

export interface SaveBlobV1 {
  v: 1;
  savedAt: number;
  snapshot: SimSnapshot;
  /** opaque engine fields */
  engine: {
    nextStructureId: number;
    unlockedStructures: string[];
    tickIndex: number;
  };
}

export function toSaveBlob(state: SimState): SaveBlobV1 {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    snapshot: snapshot(state),
    engine: {
      nextStructureId: state.nextStructureId,
      unlockedStructures: [...state.unlockedStructures],
      tickIndex: state.tickIndex,
    },
  };
}

export function fromSaveBlob(blob: SaveBlobV1): SimState {
  if (blob.v !== 1) throw new Error(`Unsupported save v${(blob as { v: number }).v}`);
  const raw = serializeState({
    time: blob.snapshot.time,
    resources: blob.snapshot.resources,
    structures: blob.snapshot.structures,
    adaptations: blob.snapshot.adaptations,
    env: blob.snapshot.env,
    flags: blob.snapshot.flags,
    prestige: blob.snapshot.prestige,
    relics: blob.snapshot.relics,
    nextStructureId: blob.engine.nextStructureId,
    unlockedStructures: new Set(blob.engine.unlockedStructures),
    tickIndex: blob.engine.tickIndex,
  });
  return deserializeState(raw);
}

export function assertSnapshotShape(snap: SimSnapshot): void {
  if (typeof snap.time !== "number") throw new Error("snapshot.time");
  for (const id of RESOURCE_IDS) {
    if (typeof snap.resources[id] !== "number") {
      throw new Error(`snapshot.resources.${id}`);
    }
  }
  if (!Array.isArray(snap.structures)) throw new Error("snapshot.structures");
  for (const s of snap.structures) {
    if (typeof s.id !== "string" || typeof s.defId !== "string") {
      throw new Error("structure id/defId");
    }
    if (typeof s.slot !== "number" || !Array.isArray(s.neighbors)) {
      throw new Error("structure slot/neighbors");
    }
  }
  if (!Array.isArray(snap.adaptations)) throw new Error("adaptations");
  for (const eid of ENV_IDS) {
    if (typeof snap.env[eid] !== "number") throw new Error(`env.${eid}`);
  }
  if (!Array.isArray(snap.flags)) throw new Error("flags");
  if (typeof snap.prestige !== "number") throw new Error("prestige");
  if (!Array.isArray(snap.relics)) throw new Error("relics");
}

export function assertResourceNonNegative(bag: ResourceBag): void {
  for (const id of RESOURCE_IDS) {
    if (bag[id] < 0) throw new Error(`negative ${id}`);
  }
}

/** Re-export for consumers that only import save */
export { serializeState, deserializeState, snapshot };
export type { SimState };
// silence unused import type when bundlers tree-shake oddly
void 0 as unknown as typeof createInitialState;
