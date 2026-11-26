import { describe, expect, it } from "vitest";
import { applyCommand, createColony, snapshot } from "./colony.ts";
import { simulate, tick } from "./tick.ts";

describe("polyps sim", () => {
  it("starts with an absorber and positive nutrients over time", () => {
    const s0 = createColony();
    expect(s0.structures[0]?.defId).toBe("absorber");
    const s1 = tick(s0, 2);
    expect(s1.resources.nutrients).toBeGreaterThan(s0.resources.nutrients);
    expect(s1.time).toBeGreaterThan(s0.time);
  });

  it("builds chamber and converts nutrients to energy", () => {
    let s = createColony();
    s = {
      ...s,
      resources: { ...s.resources, biomass: 20, minerals: 5, energy: 10 },
    };
    s = applyCommand(s, { type: "build", structureId: "chamber" });
    expect(s.structures.some((x) => x.defId === "chamber")).toBe(true);
    // grow chamber to maturity
    s = simulate(s, 3);
    const before = s.resources.energy;
    // feed nutrients
    s = { ...s, resources: { ...s.resources, nutrients: 40 } };
    s = simulate(s, 5);
    expect(s.resources.energy).toBeGreaterThan(before);
    expect(s.resources.waste).toBeGreaterThan(0);
  });

  it("activates waste-loop synergy with chamber + bacteria", () => {
    let s = createColony();
    s = {
      ...s,
      resources: {
        nutrients: 30,
        energy: 20,
        biomass: 40,
        genetic: 5,
        minerals: 20,
        waste: 10,
      },
    };
    s = applyCommand(s, { type: "build", structureId: "chamber" });
    s = applyCommand(s, { type: "build", structureId: "bacteria" });
    s = simulate(s, 4);
    expect(s.activeSynergies).toContain("syn-waste-loop");
  });

  it("snapshot is serializable and prestige requires maturity", () => {
    const s = createColony();
    const snap = snapshot(s);
    expect(snap.structures.length).toBe(1);
    const blocked = applyCommand(s, { type: "prestige" });
    expect(blocked.prestige).toBe(0);
    expect(blocked.message).toMatch(/young|Drift/i);
  });

  it("deterministic for same seed sequence of ticks", () => {
    const a = simulate(createColony(), 30);
    const b = simulate(createColony(), 30);
    expect(a.resources).toEqual(b.resources);
    expect(a.env.light).toBeCloseTo(b.env.light, 5);
  });
});
