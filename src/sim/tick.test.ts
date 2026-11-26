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

  it("builds tentacle then chamber and converts nutrients to energy", () => {
    let s = createColony();
    s = {
      ...s,
      resources: { ...s.resources, biomass: 40, minerals: 10, energy: 20, nutrients: 20 },
    };
    s = applyCommand(s, { type: "build", structureId: "tentacle" });
    expect(s.structures.some((x) => x.defId === "tentacle")).toBe(true);
    s = applyCommand(s, { type: "build", structureId: "chamber" });
    expect(s.structures.some((x) => x.defId === "chamber")).toBe(true);
    s = simulate(s, 3);
    const before = s.resources.energy;
    s = { ...s, resources: { ...s.resources, nutrients: 40 } };
    s = simulate(s, 5);
    expect(s.resources.energy).toBeGreaterThan(before);
    expect(s.resources.waste).toBeGreaterThan(0);
  });

  it("activates waste_loop synergy with chamber + bacteria", () => {
    let s = createColony();
    s = {
      ...s,
      resources: {
        nutrients: 40,
        energy: 30,
        biomass: 80,
        genetic: 10,
        minerals: 20,
        waste: 10,
      },
    };
    s = applyCommand(s, { type: "build", structureId: "tentacle" });
    s = applyCommand(s, { type: "build", structureId: "chamber" });
    s = applyCommand(s, { type: "build", structureId: "bacteria" });
    s = simulate(s, 4);
    expect(s.activeSynergies).toContain("waste_loop");
  });

  it("snapshot is serializable and prestige requires maturity", () => {
    const s = createColony();
    const snap = snapshot(s);
    expect(snap.structures.length).toBe(1);
    const blocked = applyCommand(s, { type: "prestige" });
    expect(blocked.prestige).toBe(0);
    expect(blocked.message).toMatch(/young|spore|Drift|genetic/i);
  });

  it("deterministic for same seed sequence of ticks", () => {
    const a = simulate(createColony(), 30);
    const b = simulate(createColony(), 30);
    expect(a.resources).toEqual(b.resources);
    expect(a.env.light).toBeCloseTo(b.env.light, 5);
  });

  it("maxStructures gates Silent Reef (no tentacles)", () => {
    let s = createColony();
    s = {
      ...s,
      resources: {
        nutrients: 40,
        energy: 30,
        biomass: 80,
        genetic: 10,
        minerals: 20,
        waste: 5,
      },
    };
    // absorber only — should be eligible for silent_reef if recipe is max tentacle 0
    s = simulate(s, 2);
    const withoutArms = s.activeSynergies.includes("silent_reef");
    s = applyCommand(s, { type: "build", structureId: "tentacle" });
    s = simulate(s, 2);
    const withArms = s.activeSynergies.includes("silent_reef");
    // If pack defines silent_reef, tentacles must disable it
    if (withoutArms || withArms) {
      expect(withArms).toBe(false);
    }
  });
});
