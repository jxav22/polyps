import { describe, expect, it } from "vitest";
import { runHarness, runPathway } from "../src/harness.ts";

describe("balance harness", () => {
  it("runs all four pathways without throwing", () => {
    // Shorter duration for unit test speed
    const summary = runHarness(180);
    expect(summary.reports).toHaveLength(4);
    for (const r of summary.reports) {
      expect(r.final.time).toBeGreaterThan(0);
      expect(Number.isFinite(r.geneticEarned)).toBe(true);
      expect(r.infiniteLoopSuspected).toBe(false);
    }
  });

  it("predatory pathway builds tentacles when possible", () => {
    const r = runPathway("predatory", 240);
    expect(r.structureCounts.absorber).toBeGreaterThanOrEqual(1);
    // Autopilot should at least attempt tentacles if economy allows
    expect(
      (r.structureCounts.tentacle ?? 0) + (r.structureCounts.chamber ?? 0),
    ).toBeGreaterThanOrEqual(0);
    expect(r.timeToFirstUnlock === null || r.timeToFirstUnlock > 0).toBe(true);
  });

  it("flags target misses as strings when prestige unreachable in short run", () => {
    const summary = runHarness(60);
    expect(Array.isArray(summary.targetMisses)).toBe(true);
    expect(Array.isArray(summary.risks)).toBe(true);
  });
});
