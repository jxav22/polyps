import { describe, expect, it } from "vitest";
import {
  applyCommand,
  createInitialState,
  serializeState,
  snapshot,
  tick,
} from "../src/reference-sim.ts";

describe("tick determinism", () => {
  it("same seed + same dt sequence → identical snapshots", () => {
    const a = createInitialState(0);
    const b = createInitialState(0);
    for (let i = 0; i < 40; i++) {
      tick(a, 0.25);
      tick(b, 0.25);
      if (i % 5 === 0) {
        applyCommand(a, { type: "build", structureId: "tentacle" });
        applyCommand(b, { type: "build", structureId: "tentacle" });
      }
    }
    expect(serializeState(a)).toBe(serializeState(b));
    expect(snapshot(a)).toEqual(snapshot(b));
  });

  it("batched dt matches stepped dt (fixed substep)", () => {
    const stepped = createInitialState(0);
    const batched = createInitialState(0);
    for (let i = 0; i < 20; i++) tick(stepped, 0.25);
    tick(batched, 5);
    expect(serializeState(stepped)).toBe(serializeState(batched));
  });

  it("time advances monotonically", () => {
    const s = createInitialState(0);
    let prev = s.time;
    for (let i = 0; i < 10; i++) {
      tick(s, 1);
      expect(s.time).toBeGreaterThan(prev);
      prev = s.time;
    }
  });
});
