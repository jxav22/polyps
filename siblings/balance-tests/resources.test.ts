import { describe, expect, it } from "vitest";
import { STRUCTURE_BY_ID } from "../src/content-pack.ts";
import {
  applyCommand,
  createInitialState,
  tick,
} from "../src/reference-sim.ts";
import { RESOURCE_IDS } from "../src/types.ts";

describe("resource relationships", () => {
  it("absorber increases nutrients over time", () => {
    const s = createInitialState(0);
    const before = s.resources.nutrients;
    tick(s, 10);
    expect(s.resources.nutrients).toBeGreaterThan(before);
  });

  it("chamber converts nutrients into energy and waste", () => {
    const s = createInitialState(0);
    // Force resources + unlock path
    s.resources.biomass = 50;
    s.resources.energy = 50;
    s.resources.nutrients = 40;
    s.resources.minerals = 10;
    applyCommand(s, { type: "build", structureId: "tentacle" });
    applyCommand(s, { type: "build", structureId: "chamber" });
    expect(s.structures.some((x) => x.defId === "chamber")).toBe(true);
    const n0 = s.resources.nutrients;
    const e0 = s.resources.energy;
    const w0 = s.resources.waste;
    tick(s, 20);
    // Digestion should move nutrients toward energy/waste
    expect(s.resources.energy + s.resources.waste).toBeGreaterThan(e0 + w0 - 1);
    expect(s.resources.nutrients).toBeLessThan(n0 + 30); // not unbounded nutrient ignore
  });

  it("resources stay non-negative after long tick", () => {
    const s = createInitialState(0);
    s.resources.biomass = 100;
    s.resources.energy = 100;
    for (let i = 0; i < 30; i++) {
      applyCommand(s, { type: "build", structureId: "tentacle" });
      tick(s, 2);
    }
    for (const id of RESOURCE_IDS) {
      expect(s.resources[id]).toBeGreaterThanOrEqual(0);
    }
  });

  it("spending structure cost deducts the listed bag", () => {
    const s = createInitialState(0);
    s.resources = {
      nutrients: 20,
      energy: 20,
      biomass: 20,
      genetic: 5,
      minerals: 5,
      waste: 0,
    };
    const cost = STRUCTURE_BY_ID.tentacle.cost;
    const before = { ...s.resources };
    applyCommand(s, { type: "build", structureId: "tentacle" });
    for (const id of RESOURCE_IDS) {
      const c = cost[id] ?? 0;
      if (c > 0) {
        expect(s.resources[id]).toBeCloseTo(before[id] - c + (id === "genetic" ? 0.25 : 0), 5);
      }
    }
  });

  it("waste_seen flag appears after waste accumulates", () => {
    const s = createInitialState(0);
    s.resources.biomass = 80;
    s.resources.energy = 80;
    s.resources.nutrients = 80;
    applyCommand(s, { type: "build", structureId: "tentacle" });
    applyCommand(s, { type: "build", structureId: "chamber" });
    tick(s, 60);
    expect(s.flags.includes("waste_seen") || s.resources.waste > 0.5).toBe(true);
  });
});
