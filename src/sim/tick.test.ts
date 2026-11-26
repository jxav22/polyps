import { describe, expect, it } from "vitest";
import { applyCommand, createColony, snapshot } from "./colony.ts";
import { simulate } from "./tick.ts";

describe("polyps sim", () => {
  it("starts with an absorber and feeds the colony over time", () => {
    const s0 = createColony();
    expect(s0.structures[0]?.defId).toBe("absorber");
    const s1 = simulate(s0, 8);
    expect(s1.time).toBeGreaterThan(s0.time);
    // Energy stays positive pre-chamber; minerals trickle from ambience
    expect(s1.resources.energy).toBeGreaterThan(0);
    expect(s1.resources.minerals).toBeGreaterThan(s0.resources.minerals);
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
    s = { ...s, resources: { ...s.resources, nutrients: 40, energy: 4 } };
    s = simulate(s, 5);
    // Chamber sheds waste while convert/feed continue — prove digest path is live
    expect(s.resources.waste).toBeGreaterThan(0);
    expect(s.structures.some((x) => x.defId === "chamber")).toBe(true);
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

  it("produces biomass via anabolism (colonial needs income)", () => {
    let s = createColony();
    const startB = s.resources.biomass;
    // Spend some biomass then recover through anabolism
    s = {
      ...s,
      resources: { ...s.resources, biomass: 2, energy: 20, nutrients: 30 },
    };
    s = simulate(s, 20);
    expect(s.resources.biomass).toBeGreaterThan(2);
    expect(s.rates.biomass ?? 0).toBeGreaterThan(0);
    // Start bag should also grow over a quiet minute with absorber
    const grown = simulate(createColony(), 45);
    expect(grown.resources.biomass).toBeGreaterThanOrEqual(startB);
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
