/**
 * Autopilot balance harness.
 * Simulates predatory / photo / symbiotic / colonial pathways.
 * Reports time-to-unlock, bottlenecks, infinite-loop detection, dominant-strategy flags.
 */

import { ADAPTATIONS, STRUCTURE_BY_ID } from "./content-pack.ts";
import {
  applyCommand,
  assertFiniteState,
  createInitialState,
  listAdaptable,
  listBuildable,
  snapshot,
  tick,
} from "./reference-sim.ts";
import type { Pathway, SimSnapshot, SimState, StructureId } from "./types.ts";

export type PathwayKey = "predatory" | "photo" | "symbiotic" | "colonial";

export interface UnlockEvent {
  id: string;
  kind: "structure" | "adaptation" | "flag";
  time: number;
}

export interface Bottleneck {
  resource: string;
  time: number;
  detail: string;
}

export interface PathwayReport {
  pathway: PathwayKey;
  durationSec: number;
  unlocks: UnlockEvent[];
  timeToFirstUnlock: number | null;
  timeToPathwayFork: number | null;
  timeToPrestigeVisible: number | null;
  bottlenecks: Bottleneck[];
  infiniteLoopSuspected: boolean;
  loopDetail?: string;
  final: SimSnapshot;
  geneticEarned: number;
  structureCounts: Record<string, number>;
  adaptations: string[];
}

export interface HarnessSummary {
  reports: PathwayReport[];
  dominantStrategies: string[];
  deadEnds: string[];
  risks: string[];
  targets: {
    unlockMin: number;
    unlockMax: number;
    forkMin: number;
    forkMax: number;
    prestigeMin: number;
    prestigeMax: number;
  };
  targetMisses: string[];
}

const PATHWAY_BUILD_PRIORITY: Record<PathwayKey, StructureId[]> = {
  predatory: [
    "absorber",
    "tentacle",
    "chamber",
    "sensor",
    "venom",
    "vessel",
    "membrane",
    "mineral_gland",
  ],
  photo: [
    "absorber",
    "tentacle",
    "chamber",
    "symbiont",
    "membrane",
    "vessel",
    "bud",
  ],
  symbiotic: [
    "absorber",
    "tentacle",
    "chamber",
    "bacteria",
    "waste_symbiont",
    "symbiont",
    "vessel",
    "membrane",
  ],
  colonial: [
    "absorber",
    "tentacle",
    "chamber",
    "symbiont",
    "membrane",
    "bud",
    "vessel",
  ],
};

const PATHWAY_ADAPT_PRIORITY: Record<PathwayKey, string[]> = {
  predatory: ["grasp_reflex", "ambush_venom", "metabolic_trim", "spore_drift_key"],
  photo: ["chloroplast_bloom", "light_armor", "spore_drift_key"],
  symbiotic: ["mutual_gut", "toxin_bargain", "metabolic_trim", "spore_drift_key"],
  colonial: ["budding_rhythm", "colony_pulse", "chloroplast_bloom", "spore_drift_key"],
};

const PATHWAY_ADAPT_FILTER: Record<PathwayKey, Pathway[]> = {
  predatory: ["predatory", "metabolic", "hybrid"],
  photo: ["photo", "hybrid", "metabolic"],
  symbiotic: ["symbiotic", "metabolic", "hybrid", "photo"],
  colonial: ["colonial", "photo", "hybrid"],
};

function countStructures(state: SimState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of state.structures) {
    out[s.defId] = (out[s.defId] ?? 0) + 1;
  }
  return out;
}

function pickBuild(
  state: SimState,
  pathway: PathwayKey,
): StructureId | null {
  const buildable = listBuildable(state);
  if (buildable.length === 0) return null;
  const priority = PATHWAY_BUILD_PRIORITY[pathway];
  for (const id of priority) {
    const hit = buildable.find((b) => b.id === id);
    if (hit) return hit.id;
  }
  // Prefer anything that advances unlock graph
  return buildable[0]?.id ?? null;
}

function pickAdapt(state: SimState, pathway: PathwayKey): string | null {
  const adaptable = listAdaptable(state).filter((a) =>
    PATHWAY_ADAPT_FILTER[pathway].includes(a.pathway),
  );
  if (adaptable.length === 0) return null;
  for (const id of PATHWAY_ADAPT_PRIORITY[pathway]) {
    if (adaptable.some((a) => a.id === id)) return id;
  }
  return adaptable[0]?.id ?? null;
}

function detectResourceStall(
  history: { t: number; genetic: number; biomass: number; energy: number }[],
): Bottleneck | null {
  if (history.length < 8) return null;
  const recent = history.slice(-8);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = last.t - first.t;
  if (dt < 30) return null;
  if (last.genetic - first.genetic < 0.05) {
    return {
      resource: "genetic",
      time: last.t,
      detail: `Genetic nearly flat over ${dt.toFixed(0)}s (${first.genetic.toFixed(2)}→${last.genetic.toFixed(2)})`,
    };
  }
  if (last.biomass < 1 && last.energy < 0.5) {
    return {
      resource: "biomass/energy",
      time: last.t,
      detail: "Colony starved: biomass and energy both near zero",
    };
  }
  return null;
}

/**
 * Detect conversion loops that produce unbounded growth without player sinks.
 * Heuristic: any resource doubles twice within a short window while structure
 * count is unchanged → suspected infinite amplify.
 */
function detectInfiniteLoop(
  samples: { t: number; nutrients: number; energy: number; waste: number; structs: number }[],
): { suspected: boolean; detail?: string } {
  if (samples.length < 6) return { suspected: false };
  const window = samples.slice(-6);
  const structsStable = window.every((s) => s.structs === window[0].structs);
  if (!structsStable) return { suspected: false };

  for (const key of ["nutrients", "energy", "waste"] as const) {
    const vals = window.map((s) => s[key]);
    const growth =
      vals[0] > 1 && vals[vals.length - 1] / vals[0] > 8 && vals.every((v, i, a) => i === 0 || v >= a[i - 1] * 0.95);
    if (growth) {
      return {
        suspected: true,
        detail: `${key} grew ${(vals[vals.length - 1] / vals[0]).toFixed(1)}x with no new structures (${window[0].t.toFixed(0)}–${window[window.length - 1].t.toFixed(0)}s)`,
      };
    }
  }
  return { suspected: false };
}

export function runPathway(
  pathway: PathwayKey,
  durationSec = 900,
  decisionInterval = 2,
): PathwayReport {
  const state = createInitialState(0);
  const unlocks: UnlockEvent[] = [];
  const seenStructures = new Set<string>(["absorber"]);
  const seenAdaptations = new Set<string>();
  const seenFlags = new Set<string>();
  const bottlenecks: Bottleneck[] = [];
  const history: { t: number; genetic: number; biomass: number; energy: number }[] = [];
  const loopSamples: {
    t: number;
    nutrients: number;
    energy: number;
    waste: number;
    structs: number;
  }[] = [];

  let timeToFirstUnlock: number | null = null;
  let timeToPathwayFork: number | null = null;
  let timeToPrestigeVisible: number | null = null;
  let infiniteLoopSuspected = false;
  let loopDetail: string | undefined;
  let decisionAcc = 0;
  const startGenetic = state.resources.genetic;

  const step = 0.25;
  for (let t = 0; t < durationSec; t += step) {
    tick(state, step);
    assertFiniteState(state);
    decisionAcc += step;

    // Track unlocks
    for (const s of state.structures) {
      if (!seenStructures.has(s.defId)) {
        seenStructures.add(s.defId);
        unlocks.push({ id: s.defId, kind: "structure", time: state.time });
        if (timeToFirstUnlock === null && s.defId !== "absorber") {
          timeToFirstUnlock = state.time;
        }
      }
    }
    for (const a of state.adaptations) {
      if (!seenAdaptations.has(a)) {
        seenAdaptations.add(a);
        unlocks.push({ id: a, kind: "adaptation", time: state.time });
        const def = ADAPTATIONS.find((x) => x.id === a);
        if (
          timeToPathwayFork === null &&
          def &&
          (def.pathway === pathway ||
            (pathway === "photo" && def.pathway === "photo") ||
            (pathway === "predatory" && def.pathway === "predatory") ||
            (pathway === "symbiotic" && def.pathway === "symbiotic") ||
            (pathway === "colonial" && def.pathway === "colonial"))
        ) {
          timeToPathwayFork = state.time;
        }
      }
    }
    for (const f of state.flags) {
      if (!seenFlags.has(f)) {
        seenFlags.add(f);
        unlocks.push({ id: f, kind: "flag", time: state.time });
        if (f === "prestige_ready" && timeToPrestigeVisible === null) {
          timeToPrestigeVisible = state.time;
        }
      }
    }

    // Pathway fork also when pathway-defining structure appears
    const forkStructs: Record<PathwayKey, string> = {
      predatory: "venom",
      photo: "symbiont",
      symbiotic: "bacteria",
      colonial: "bud",
    };
    if (
      timeToPathwayFork === null &&
      seenStructures.has(forkStructs[pathway])
    ) {
      timeToPathwayFork = state.time;
    }

    if (decisionAcc >= decisionInterval) {
      decisionAcc = 0;
      // Adapt first if possible (spend genetic), else build
      const adaptId = pickAdapt(state, pathway);
      if (adaptId) {
        applyCommand(state, { type: "adapt", adaptationId: adaptId });
      } else {
        const buildId = pickBuild(state, pathway);
        if (buildId) {
          applyCommand(state, { type: "build", structureId: buildId });
        }
      }

      history.push({
        t: state.time,
        genetic: state.resources.genetic,
        biomass: state.resources.biomass,
        energy: state.resources.energy,
      });
      loopSamples.push({
        t: state.time,
        nutrients: state.resources.nutrients,
        energy: state.resources.energy,
        waste: state.resources.waste,
        structs: state.structures.length,
      });

      const stall = detectResourceStall(history);
      if (stall && !bottlenecks.some((b) => b.detail === stall.detail)) {
        bottlenecks.push(stall);
      }
      const loop = detectInfiniteLoop(loopSamples);
      if (loop.suspected) {
        infiniteLoopSuspected = true;
        loopDetail = loop.detail;
      }
    }
  }

  // First unlock: first non-starter structure built or chamber/tentacle
  if (timeToFirstUnlock === null) {
    const first = unlocks.find(
      (u) => u.kind === "structure" && u.id !== "absorber",
    );
    timeToFirstUnlock = first?.time ?? null;
  }

  return {
    pathway,
    durationSec,
    unlocks,
    timeToFirstUnlock,
    timeToPathwayFork,
    timeToPrestigeVisible,
    bottlenecks,
    infiniteLoopSuspected,
    loopDetail,
    final: snapshot(state),
    geneticEarned: state.resources.genetic - startGenetic + state.adaptations.reduce((s, id) => {
      const a = ADAPTATIONS.find((x) => x.id === id);
      return s + (a?.costGenetic ?? 0);
    }, 0),
    structureCounts: countStructures(state),
    adaptations: [...state.adaptations],
  };
}

export function runHarness(durationSec = 900): HarnessSummary {
  const pathways: PathwayKey[] = [
    "predatory",
    "photo",
    "symbiotic",
    "colonial",
  ];
  const reports = pathways.map((p) => runPathway(p, durationSec));

  const targets = {
    unlockMin: 120,
    unlockMax: 180,
    forkMin: 300,
    forkMax: 480,
    prestigeMin: 720,
    prestigeMax: 900,
  };

  const targetMisses: string[] = [];
  for (const r of reports) {
    if (r.timeToFirstUnlock === null) {
      targetMisses.push(`${r.pathway}: never unlocked a second structure`);
    } else if (
      r.timeToFirstUnlock < targets.unlockMin * 0.25 ||
      r.timeToFirstUnlock > targets.unlockMax * 2
    ) {
      // Soft: first build may be earlier than 2 min with autopilot — flag only extremes
      if (r.timeToFirstUnlock > targets.unlockMax * 1.5) {
        targetMisses.push(
          `${r.pathway}: first unlock at ${r.timeToFirstUnlock.toFixed(0)}s (target ${targets.unlockMin}–${targets.unlockMax}s)`,
        );
      }
    }
    if (r.timeToPathwayFork === null) {
      targetMisses.push(`${r.pathway}: pathway fork never reached`);
    } else if (r.timeToPathwayFork > targets.forkMax * 1.25) {
      targetMisses.push(
        `${r.pathway}: fork at ${r.timeToPathwayFork.toFixed(0)}s (target ≤${targets.forkMax}s)`,
      );
    }
    if (r.timeToPrestigeVisible === null) {
      targetMisses.push(`${r.pathway}: prestige not visible within ${durationSec}s`);
    } else if (r.timeToPrestigeVisible > targets.prestigeMax * 1.2) {
      targetMisses.push(
        `${r.pathway}: prestige at ${r.timeToPrestigeVisible.toFixed(0)}s (target ≤${targets.prestigeMax}s)`,
      );
    }
  }

  // Dominant strategy: one pathway reaches prestige much faster and earns more genetic
  const withPrestige = reports.filter((r) => r.timeToPrestigeVisible !== null);
  const dominantStrategies: string[] = [];
  if (withPrestige.length >= 2) {
    const sorted = [...withPrestige].sort(
      (a, b) => (a.timeToPrestigeVisible ?? 9e9) - (b.timeToPrestigeVisible ?? 9e9),
    );
    const best = sorted[0];
    const second = sorted[1];
    if (
      best.timeToPrestigeVisible !== null &&
      second.timeToPrestigeVisible !== null &&
      second.timeToPrestigeVisible > best.timeToPrestigeVisible * 1.5
    ) {
      dominantStrategies.push(
        `${best.pathway} reaches prestige ${(second.timeToPrestigeVisible / best.timeToPrestigeVisible).toFixed(1)}x faster than ${second.pathway}`,
      );
    }
  }
  const geneticSorted = [...reports].sort(
    (a, b) => b.geneticEarned - a.geneticEarned,
  );
  if (
    geneticSorted[0].geneticEarned > geneticSorted[geneticSorted.length - 1].geneticEarned * 2.5 &&
    geneticSorted[0].geneticEarned > 5
  ) {
    dominantStrategies.push(
      `${geneticSorted[0].pathway} earns ${geneticSorted[0].geneticEarned.toFixed(1)} genetic vs ${geneticSorted[geneticSorted.length - 1].pathway} ${geneticSorted[geneticSorted.length - 1].geneticEarned.toFixed(1)} (>2.5x)`,
    );
  }

  const deadEnds = reports
    .filter(
      (r) =>
        r.timeToPathwayFork === null ||
        (r.bottlenecks.length > 0 && r.timeToPrestigeVisible === null),
    )
    .map((r) => {
      const why =
        r.timeToPathwayFork === null
          ? "no pathway fork"
          : r.bottlenecks.map((b) => b.detail).join("; ");
      return `${r.pathway}: ${why}`;
    });

  const risks: string[] = [];
  for (const r of reports) {
    if (r.infiniteLoopSuspected) {
      risks.push(`INFINITE LOOP (${r.pathway}): ${r.loopDetail}`);
    }
    if ((r.final.resources.waste ?? 0) > 80) {
      risks.push(`${r.pathway}: waste toxicity high (${r.final.resources.waste.toFixed(0)})`);
    }
    // minerals soft-lock
    const needsMinerals = Object.entries(r.structureCounts).some(([id]) => {
      const cost = STRUCTURE_BY_ID[id]?.cost.minerals ?? 0;
      return cost >= 2;
    });
    if (needsMinerals && r.final.resources.minerals < 0.5 && r.timeToPrestigeVisible === null) {
      risks.push(`${r.pathway}: possible minerals soft-lock`);
    }
  }
  if (dominantStrategies.length) {
    risks.push(...dominantStrategies.map((d) => `DOMINANT: ${d}`));
  }

  return {
    reports,
    dominantStrategies,
    deadEnds,
    risks,
    targets,
    targetMisses,
  };
}

export function formatHarnessMarkdown(summary: HarnessSummary): string {
  const lines: string[] = [];
  lines.push("# Balance Harness Results");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Pathway table");
  lines.push("");
  lines.push(
    "| Pathway | 1st unlock (s) | Fork (s) | Prestige (s) | Genetic | Loop? | Bottlenecks |",
  );
  lines.push("|---|---:|---:|---:|---:|---|---|");
  for (const r of summary.reports) {
    lines.push(
      `| ${r.pathway} | ${fmt(r.timeToFirstUnlock)} | ${fmt(r.timeToPathwayFork)} | ${fmt(r.timeToPrestigeVisible)} | ${r.geneticEarned.toFixed(1)} | ${r.infiniteLoopSuspected ? "YES" : "no"} | ${r.bottlenecks.length} |`,
    );
  }
  lines.push("");
  lines.push("## Target misses");
  if (summary.targetMisses.length === 0) lines.push("- None");
  else summary.targetMisses.forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push("## Dominant strategies");
  if (summary.dominantStrategies.length === 0) lines.push("- None flagged");
  else summary.dominantStrategies.forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push("## Dead ends");
  if (summary.deadEnds.length === 0) lines.push("- None");
  else summary.deadEnds.forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push("## Risks");
  if (summary.risks.length === 0) lines.push("- None");
  else summary.risks.forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push("## Per-pathway detail");
  for (const r of summary.reports) {
    lines.push("");
    lines.push(`### ${r.pathway}`);
    lines.push(`- Structures: ${JSON.stringify(r.structureCounts)}`);
    lines.push(`- Adaptations: ${r.adaptations.join(", ") || "(none)"}`);
    lines.push(
      `- Final resources: N=${r.final.resources.nutrients.toFixed(1)} E=${r.final.resources.energy.toFixed(1)} B=${r.final.resources.biomass.toFixed(1)} G=${r.final.resources.genetic.toFixed(1)} M=${r.final.resources.minerals.toFixed(1)} W=${r.final.resources.waste.toFixed(1)}`,
    );
    if (r.loopDetail) lines.push(`- Loop: ${r.loopDetail}`);
    for (const b of r.bottlenecks) {
      lines.push(`- Bottleneck @${b.time.toFixed(0)}s [${b.resource}]: ${b.detail}`);
    }
  }
  return lines.join("\n");
}

function fmt(n: number | null): string {
  return n === null ? "—" : n.toFixed(0);
}
