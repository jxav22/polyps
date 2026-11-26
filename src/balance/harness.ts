/**
 * Autopilot balance harness — simulates pathway builds and flags dead ends / dominance.
 * Run: npm run balance
 */
import { applyCommand, createColony, type ColonyState } from "../sim/colony.ts";
import { simulate } from "../sim/tick.ts";

interface Pathway {
  name: string;
  builds: string[];
  adaptations: string[];
}

const PATHWAYS: Pathway[] = [
  {
    name: "predatory",
    builds: ["chamber", "tentacle", "sensor", "venom", "membrane"],
    adaptations: ["keen-sting"],
  },
  {
    name: "photo",
    builds: ["chamber", "symbiont", "membrane", "vessel", "bud"],
    adaptations: ["chloroplast-bloom"],
  },
  {
    name: "symbiotic",
    builds: ["chamber", "bacteria", "symbiont", "vessel", "bud"],
    adaptations: ["closed-gut"],
  },
  {
    name: "colonial",
    builds: ["chamber", "symbiont", "bud", "vessel", "tentacle"],
    adaptations: ["colony-pulse"],
  },
  {
    name: "metabolic",
    builds: ["chamber", "bacteria", "tentacle", "vessel", "membrane"],
    adaptations: ["closed-gut", "spore-memory"],
  },
];

function rich(s: ColonyState): ColonyState {
  return {
    ...s,
    resources: {
      nutrients: 40,
      energy: 30,
      biomass: 80,
      genetic: 20,
      minerals: 40,
      waste: 5,
    },
  };
}

function runPathway(p: Pathway, seconds: number) {
  let s = rich(createColony());
  let buildIdx = 0;
  s = simulate(s, seconds, (_t, cur) => {
    let next = cur;
    if (buildIdx < p.builds.length && next.resources.biomass > 10) {
      const id = p.builds[buildIdx]!;
      const before = next.structures.length;
      next = applyCommand(next, { type: "build", structureId: id });
      if (next.structures.length > before) buildIdx++;
      else {
        // top up if blocked by cost
        next = rich(next);
      }
    }
    for (const a of p.adaptations) {
      if (!next.adaptations.includes(a) && next.resources.genetic >= 3) {
        next = applyCommand(next, { type: "adapt", adaptationId: a });
      }
    }
    return next;
  });
  return s;
}

function main() {
  console.log("Polyps balance harness\n");
  const rows: { name: string; energy: number; biomass: number; genetic: number; syn: number; structs: number }[] = [];
  for (const p of PATHWAYS) {
    const s = runPathway(p, 240);
    rows.push({
      name: p.name,
      energy: +s.resources.energy.toFixed(1),
      biomass: +s.resources.biomass.toFixed(1),
      genetic: +s.resources.genetic.toFixed(1),
      syn: s.activeSynergies.length,
      structs: s.structures.length,
    });
    const dead =
      s.resources.energy < 1 && s.resources.nutrients < 1 && (s.rates.energy ?? 0) <= 0;
    console.log(
      `${p.name.padEnd(12)} structs=${s.structures.length} E=${s.resources.energy.toFixed(1)} B=${s.resources.biomass.toFixed(1)} G=${s.resources.genetic.toFixed(1)} syn=${s.activeSynergies.join(",") || "-"}` +
        (dead ? " DEAD_END" : ""),
    );
  }
  const energies = rows.map((r) => r.energy);
  const max = Math.max(...energies);
  const min = Math.min(...energies);
  if (max > min * 5 + 20) {
    console.log(`\nWARN dominance: strongest energy ${max} vs weakest ${min}`);
  } else {
    console.log(`\nOK energy spread ${min.toFixed(1)}–${max.toFixed(1)}`);
  }
}

main();
