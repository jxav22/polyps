import { describe, expect, it } from "vitest";
import {
  applyCommand,
  assertFiniteState,
  createInitialState,
  tick,
} from "../src/reference-sim.ts";
import { RESOURCE_IDS } from "../src/types.ts";

describe("no NaNs / finiteness", () => {
  it("survives zero dt and huge dt clamp", () => {
    const s = createInitialState(0);
    tick(s, 0);
    tick(s, 1000);
    assertFiniteState(s);
    for (const id of RESOURCE_IDS) {
      expect(Number.isFinite(s.resources[id])).toBe(true);
    }
  });

  it("survives NaN-ish command spam", () => {
    const s = createInitialState(0);
    for (let i = 0; i < 50; i++) {
      applyCommand(s, { type: "build", structureId: "nope" });
      applyCommand(s, { type: "adapt", adaptationId: "missing" });
      applyCommand(s, { type: "sell", structureId: "ghost" });
      tick(s, 0.5);
    }
    assertFiniteState(s);
  });

  it("injected NaN resources are sanitized on tick", () => {
    const s = createInitialState(0);
    s.resources.energy = Number.NaN;
    s.resources.nutrients = Number.POSITIVE_INFINITY;
    tick(s, 1);
    assertFiniteState(s);
    expect(s.resources.energy).toBeGreaterThanOrEqual(0);
    expect(s.resources.nutrients).toBeLessThan(1e9 + 1);
  });
});
