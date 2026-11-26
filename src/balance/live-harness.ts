/**
 * Autopilot harness bound to real src/sim.
 * Local QA runner — lead can adopt from store bridge.
 *
 *   npx tsx src/balance/live-harness.ts
 */
import { writeFileSync } from "node:fs";
import { ADAPTATIONS, ADAPTATIONS_BY_ID } from "../data/adaptations.ts";
import { AUTOPILOTS, PACE, START_RESOURCES } from "../data/balance.ts";
import { STRUCTURES } from "../data/structures.ts";
import {
  applyCommand,
  createColony,
  snapshot,
  type ColonyState,
  type SimSnapshot,
} from "../sim/colony.ts";
import { canAfford } from "../sim/resources.ts";
import { countByDef, isUnlocked } from "../sim/structures.ts";
import { tick } from "../sim/tick.ts";

export type PathwayKey = keyof typeof AUTOPILOTS;

export interface PathwayReport {
  pathway: string;
  durationSec: number;
  timeToFirstUnlock: number | null;
  timeToPathwayFork: number | null;
  timeToPrestigeVisible: number | null;
  structureCounts: Record<string, number>;
  adaptations: string[];
  final: SimSnapshot;
  geneticEarned: number;
  infiniteLoopSuspected: boolean;
  loopDetail?: string;
  bottlenecks: string[];
  notes: string[];
}

const FORK: Record<string, string[]> = {
  predatory: ["venom", "sensor"],
  photo: ["symbiont"],
  symbiotic: ["bacteria", "waste_symbiont"],
  colonial: ["bud", "nest"],
  metabolic: ["mineral_gland", "filter_plate"],
};

function buildable(state: ColonyState): string[] {
  const counts = countByDef(state.structures);
  return STRUCTURES.filter((def) => {
    if (!isUnlocked(def as never, counts, state.resources.genetic, state.flags)) {
      return false;
    }
    if (def.maxCount !== undefined && (counts[def.id] ?? 0) >= def.maxCount) {
      return false;
    }
    return canAfford(state.resources, def.cost);
  }).map((d) => d.id);
}

function adaptable(state: ColonyState): string[] {
  return ADAPTATIONS.filter(
    (a) =>
      !state.adaptations.includes(a.id) &&
      !state.relics.includes(a.id) &&
      state.resources.genetic >= a.costGenetic,
  ).map((a) => a.id);
}

function pickBuild(state: ColonyState, pathway: string): string | null {
  const counts = countByDef(state.structures);
  const can = new Set(buildable(state));
  if (can.size === 0) return null;
  if ((counts.tentacle ?? 0) < 1 && can.has("tentacle")) return "tentacle";
  if ((counts.chamber ?? 0) < 1 && can.has("chamber")) return "chamber";

  const order = AUTOPILOTS[pathway as PathwayKey] ?? AUTOPILOTS.photo;
  const forkIds = FORK[pathway] ?? [];
  for (const id of order) {
    if (id === "absorber" && (counts.chamber ?? 0) >= 1) continue;
    if (
      id === "chamber" &&
      forkIds.some((f) => can.has(f)) &&
      !forkIds.some((f) => counts[f])
    ) {
      continue;
    }
    if (can.has(id)) return id;
  }
  for (const id of order) {
    if (can.has(id)) return id;
  }
  return null;
}

function pickAdapt(state: ColonyState, pathway: string): string | null {
  const can = adaptable(state);
  if (!can.length) return null;
  const ranked = can
    .map((id) => ADAPTATIONS_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => {
      const as = a!.pathway === pathway || a!.pathway === "hybrid" ? 0 : 1;
      const bs = b!.pathway === pathway || b!.pathway === "hybrid" ? 0 : 1;
      return as - bs || a!.costGenetic - b!.costGenetic;
    });
  return ranked[0]?.id ?? null;
}

function detectLoop(
  samples: { t: number; n: number; e: number; w: number; structs: number }[],
): string | undefined {
  if (samples.length < 6) return;
  const w = samples.slice(-6);
  if (!w.every((s) => s.structs === w[0].structs)) return;
  for (const key of ["n", "e", "w"] as const) {
    const vals = w.map((s) => s[key]);
    if (vals[0] > 1 && vals[vals.length - 1] / vals[0] > 8) {
      return `${key} grew ${(vals[vals.length - 1] / vals[0]).toFixed(1)}x with no new structures`;
    }
  }
}

export function runLivePathway(pathway: string, durationSec = 900): PathwayReport {
  let state = createColony();
  const notes: string[] = [];
  notes.push(
    `createColony start B=${state.resources.biomass} M=${state.resources.minerals}; data/balance START B=${START_RESOURCES.biomass} M=${START_RESOURCES.minerals}`,
  );

  const seen = new Set<string>(["absorber"]);
  let timeToFirstUnlock: number | null = null;
  let timeToPathwayFork: number | null = null;
  let timeToPrestigeVisible: number | null = null;
  let decisionAcc = 0;
  const bottlenecks: string[] = [];
  const loopSamples: {
    t: number;
    n: number;
    e: number;
    w: number;
    structs: number;
  }[] = [];
  let infiniteLoopSuspected = false;
  let loopDetail: string | undefined;
  const startGenetic = state.resources.genetic;
  let spentGenetic = 0;
  let lastBiomass = state.resources.biomass;
  let stagnant = 0;

  const step = 0.25;
  for (let t = 0; t < durationSec; t += step) {
    state = tick(state, step);
    decisionAcc += step;

    for (const s of state.structures) {
      if (!seen.has(s.defId)) {
        seen.add(s.defId);
        if (timeToFirstUnlock === null && s.defId !== "absorber") {
          timeToFirstUnlock = state.time;
        }
      }
    }
    if (timeToPathwayFork === null) {
      for (const id of FORK[pathway] ?? []) {
        if (seen.has(id)) {
          timeToPathwayFork = state.time;
          break;
        }
      }
    }
    if (
      timeToPrestigeVisible === null &&
      (state.resources.genetic >= 15 ||
        state.flags.some((f) => f.includes("prestige") || f.includes("spore")))
    ) {
      timeToPrestigeVisible = state.time;
    }

    if (decisionAcc >= 2) {
      decisionAcc = 0;
      const counts = countByDef(state.structures);
      const spine = (counts.tentacle ?? 0) >= 1 && (counts.chamber ?? 0) >= 1;
      const buildId = pickBuild(state, pathway);
      if (!spine) {
        if (buildId) state = applyCommand(state, { type: "build", structureId: buildId });
      } else {
        const adaptId = pickAdapt(state, pathway);
        if (adaptId) {
          const cost = ADAPTATIONS_BY_ID[adaptId]?.costGenetic ?? 0;
          const before = state.adaptations.length;
          state = applyCommand(state, { type: "adapt", adaptationId: adaptId });
          if (state.adaptations.length > before) spentGenetic += cost;
        } else if (buildId) {
          state = applyCommand(state, { type: "build", structureId: buildId });
        }
      }

      loopSamples.push({
        t: state.time,
        n: state.resources.nutrients,
        e: state.resources.energy,
        w: state.resources.waste,
        structs: state.structures.length,
      });
      const loop = detectLoop(loopSamples);
      if (loop) {
        infiniteLoopSuspected = true;
        loopDetail = loop;
      }

      if (state.resources.biomass <= lastBiomass + 0.01 && spine) {
        stagnant += 2;
        if (stagnant >= 90 && bottlenecks.length < 4) {
          bottlenecks.push(
            `@${state.time.toFixed(0)}s biomass≈${state.resources.biomass.toFixed(1)} E=${state.resources.energy.toFixed(1)} M=${state.resources.minerals.toFixed(1)} W=${state.resources.waste.toFixed(1)}`,
          );
          stagnant = 0;
        }
      } else stagnant = 0;
      lastBiomass = state.resources.biomass;
    }
  }

  return {
    pathway,
    durationSec,
    timeToFirstUnlock,
    timeToPathwayFork,
    timeToPrestigeVisible,
    structureCounts: countByDef(state.structures),
    adaptations: [...state.adaptations],
    final: snapshot(state),
    geneticEarned: state.resources.genetic - startGenetic + spentGenetic,
    infiniteLoopSuspected,
    loopDetail,
    bottlenecks,
    notes,
  };
}

export function runLiveHarness(durationSec = 900) {
  const pathways = ["predatory", "photo", "symbiotic", "colonial", "metabolic"];
  return {
    reports: pathways.map((p) => runLivePathway(p, durationSec)),
    pace: PACE,
  };
}

function fmt(n: number | null): string {
  return n === null ? "—" : n.toFixed(0);
}

export function formatLiveMarkdown(summary: ReturnType<typeof runLiveHarness>): string {
  const lines = [
    "# Live sim harness results",
    "",
    `Generated: ${new Date().toISOString()}`,
    "Engine: real `src/sim` (createColony / tick / applyCommand)",
    "",
    "| Pathway | 1st unlock | Fork | Prestige~ | Genetic | Loop? | Structures |",
    "|---|---:|---:|---:|---:|---|---|",
  ];
  for (const r of summary.reports) {
    lines.push(
      `| ${r.pathway} | ${fmt(r.timeToFirstUnlock)} | ${fmt(r.timeToPathwayFork)} | ${fmt(r.timeToPrestigeVisible)} | ${r.geneticEarned.toFixed(1)} | ${r.infiniteLoopSuspected ? "YES" : "no"} | \`${JSON.stringify(r.structureCounts)}\` |`,
    );
  }
  lines.push("", "## Detail");
  for (const r of summary.reports) {
    lines.push("", `### ${r.pathway}`);
    lines.push(`- Adaptations: ${r.adaptations.join(", ") || "(none)"}`);
    const res = r.final.resources;
    lines.push(
      `- Final: N=${res.nutrients.toFixed(1)} E=${res.energy.toFixed(1)} B=${res.biomass.toFixed(1)} G=${res.genetic.toFixed(1)} M=${res.minerals.toFixed(1)} W=${res.waste.toFixed(1)}`,
    );
    for (const b of r.bottlenecks) lines.push(`- Bottleneck: ${b}`);
    for (const n of r.notes) lines.push(`- Note: ${n}`);
    if (r.loopDetail) lines.push(`- Loop: ${r.loopDetail}`);
  }
  lines.push("", "## Pace targets", "```", JSON.stringify(summary.pace, null, 2), "```");
  return lines.join("\n");
}

const duration = Number(process.env.HARNESS_DURATION ?? 900);
const summary = runLiveHarness(duration);
const md = formatLiveMarkdown(summary);
const out = process.env.HARNESS_OUT ?? "live-harness-results.md";
writeFileSync(out, md);
console.log(md);
console.log(`\nWrote ${out}`);
