import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  deserializeState,
  serializeState,
  snapshot,
  tick,
} from "../src/reference-sim.ts";
import {
  assertSnapshotShape,
  fromSaveBlob,
  toSaveBlob,
} from "../src/save.ts";

describe("save roundtrip shapes", () => {
  it("serialize → deserialize preserves economy state", () => {
    const s = createInitialState(0);
    s.resources.biomass = 40;
    s.resources.energy = 40;
    applyCommand(s, { type: "build", structureId: "tentacle" });
    tick(s, 12);
    applyCommand(s, { type: "build", structureId: "chamber" });
    tick(s, 8);

    const raw = serializeState(s);
    const restored = deserializeState(raw);
    expect(serializeState(restored)).toBe(raw);

    tick(s, 5);
    tick(restored, 5);
    expect(serializeState(restored)).toBe(serializeState(s));
  });

  it("snapshot shape matches interface contract", () => {
    const s = createInitialState(0);
    tick(s, 3);
    const snap = snapshot(s);
    expect(() => assertSnapshotShape(snap)).not.toThrow();
  });

  it("SaveBlobV1 roundtrip", () => {
    const s = createInitialState(0);
    tick(s, 4);
    const blob = toSaveBlob(s);
    expect(blob.v).toBe(1);
    expect(() => assertSnapshotShape(blob.snapshot)).not.toThrow();
    const restored = fromSaveBlob(blob);
    expect(restored.time).toBe(s.time);
    expect(restored.resources).toEqual(s.resources);
    expect(restored.structures).toEqual(s.structures);
  });
});
