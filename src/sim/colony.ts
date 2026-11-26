import { ADAPTATION_DEFS, ADAPTATION_MAP } from "../data/adaptations.ts";
import { STRUCTURE_MAP } from "../data/structures.ts";
import {
  addBag,
  canAfford,
  clampBag,
  emptyBag,
  pay,
  type ResourceBag,
} from "./resources.ts";
import {
  createEnv,
  envRecord,
  type EnvState,
} from "./environment.ts";
import {
  countByDef,
  isUnlocked,
  MAX_SLOTS,
  neighborSlots,
  type StructureInstance,
} from "./structures.ts";

export interface SimCommand {
  type: "build" | "sell" | "adapt" | "prestige" | "assign";
  structureId?: string;
  adaptationId?: string;
  slot?: number;
}

export interface SimSnapshot {
  time: number;
  resources: ResourceBag;
  structures: { id: string; defId: string; slot: number; neighbors: number[]; growth: number }[];
  adaptations: string[];
  env: ReturnType<typeof envRecord>;
  flags: string[];
  prestige: number;
  relics: string[];
  rates: Partial<ResourceBag>;
  tutorialStep: number;
  message: string;
  activeSynergies: string[];
}

export interface ColonyState {
  time: number;
  resources: ResourceBag;
  structures: StructureInstance[];
  adaptations: string[];
  env: EnvState;
  flags: string[];
  prestige: number;
  relics: string[];
  nextId: number;
  /** last tick net rates for UI */
  rates: Partial<ResourceBag>;
  tutorialStep: number;
  message: string;
  activeSynergies: string[];
  /** soft caps scale with prestige */
  gameSpeed: number;
}

export function createColony(): ColonyState {
  const core: StructureInstance = {
    id: "s0",
    defId: "absorber",
    slot: 0,
    neighbors: neighborSlots(0),
    growth: 1,
  };
  return {
    time: 0,
    resources: {
      nutrients: 6,
      energy: 3,
      biomass: 8,
      genetic: 0,
      minerals: 2,
      waste: 0,
    },
    structures: [core],
    adaptations: [],
    env: createEnv(),
    flags: ["started"],
    prestige: 0,
    relics: [],
    nextId: 1,
    rates: emptyBag(),
    tutorialStep: 0,
    message: "Absorb. Digest. Grow.",
    activeSynergies: [],
    gameSpeed: 1.35, // accelerate early game
  };
}

export function snapshot(state: ColonyState): SimSnapshot {
  return {
    time: state.time,
    resources: { ...state.resources },
    structures: state.structures.map((s) => ({
      id: s.id,
      defId: s.defId,
      slot: s.slot,
      neighbors: [...s.neighbors],
      growth: s.growth,
    })),
    adaptations: [...state.adaptations],
    env: envRecord(state.env),
    flags: [...state.flags],
    prestige: state.prestige,
    relics: [...state.relics],
    rates: { ...state.rates },
    tutorialStep: state.tutorialStep,
    message: state.message,
    activeSynergies: [...state.activeSynergies],
  };
}

export function applyCommand(state: ColonyState, cmd: SimCommand): ColonyState {
  switch (cmd.type) {
    case "build":
      return buildStructure(state, cmd.structureId!, cmd.slot);
    case "sell":
      return sellStructure(state, cmd.slot!);
    case "adapt":
      return buyAdaptation(state, cmd.adaptationId!);
    case "prestige":
      return sporeDrift(state);
    default:
      return state;
  }
}

function occupiedSlots(state: ColonyState): Set<number> {
  return new Set(state.structures.map((s) => s.slot));
}

function firstFreeSlot(state: ColonyState): number | null {
  const used = occupiedSlots(state);
  for (let i = 1; i < MAX_SLOTS; i++) {
    if (!used.has(i)) return i;
  }
  return null;
}

function buildStructure(state: ColonyState, defId: string, slot?: number): ColonyState {
  const def = STRUCTURE_MAP[defId];
  if (!def) return state;
  const counts = countByDef(state.structures);
  if (def.maxCount !== undefined && (counts[defId] ?? 0) >= def.maxCount) {
    return { ...state, message: `${def.name} already present.` };
  }
  if (!isUnlocked(def, counts, state.resources.genetic, state.flags)) {
    return { ...state, message: `${def.name} is still sealed.` };
  }
  if (!canAfford(state.resources, def.cost)) {
    return { ...state, message: `Not enough mass for ${def.name}.` };
  }
  const target = slot ?? firstFreeSlot(state);
  if (target === null || occupiedSlots(state).has(target)) {
    return { ...state, message: "No open growth slot." };
  }

  const inst: StructureInstance = {
    id: `s${state.nextId}`,
    defId,
    slot: target,
    neighbors: neighborSlots(target),
    growth: 0.15,
  };

  let flags = [...state.flags];
  if (defId === "chamber" && !flags.includes("digested")) flags.push("digested");
  if (defId === "tentacle" && !flags.includes("grew-tentacle")) flags.push("grew-tentacle");
  if (defId === "bacteria" && !flags.includes("waste-loop")) flags.push("waste-loop");
  if (defId === "bud" && !flags.includes("colonial")) flags.push("colonial");

  let tutorialStep = state.tutorialStep;
  let message = `Grew ${def.name}.`;
  if (tutorialStep === 0 && defId === "chamber") {
    tutorialStep = 1;
    message = "Chamber online — nutrients become energy.";
  } else if (tutorialStep <= 1 && defId === "tentacle") {
    tutorialStep = 2;
    message = "Tentacle reaches. Feed the colony.";
  } else if (tutorialStep <= 2 && (defId === "symbiont" || defId === "bacteria")) {
    tutorialStep = 3;
    message = "A pathway opens. Compose synergies.";
  }

  // Biomass trickle from building novelty
  const geneticBonus = defId === "bud" ? 0.5 : 0.15;

  return {
    ...state,
    resources: clampBag(
      addBag(pay(state.resources, def.cost), { genetic: geneticBonus, biomass: 0.5 }),
    ),
    structures: [...state.structures, inst],
    nextId: state.nextId + 1,
    flags,
    tutorialStep,
    message,
  };
}

function sellStructure(state: ColonyState, slot: number): ColonyState {
  if (slot === 0) return { ...state, message: "The absorber is your body." };
  const idx = state.structures.findIndex((s) => s.slot === slot);
  if (idx < 0) return state;
  const inst = state.structures[idx]!;
  const def = STRUCTURE_MAP[inst.defId];
  const refund: Partial<ResourceBag> = {};
  if (def) {
    for (const [k, v] of Object.entries(def.cost)) {
      if (v !== undefined) refund[k as keyof ResourceBag] = v * 0.4;
    }
  }
  const structures = state.structures.filter((_, i) => i !== idx);
  return {
    ...state,
    structures,
    resources: clampBag(addBag(state.resources, refund)),
    message: `Resorbed ${def?.name ?? "tissue"}.`,
  };
}

function buyAdaptation(state: ColonyState, adaptationId: string): ColonyState {
  const def = ADAPTATION_MAP[adaptationId];
  if (!def) return state;
  if (state.adaptations.includes(adaptationId) || state.relics.includes(adaptationId)) {
    return { ...state, message: "Already encoded." };
  }
  if (state.resources.genetic < def.costGenetic) {
    return { ...state, message: "Need more genetic insight." };
  }
  const adaptations = [...state.adaptations, adaptationId];
  const relics = def.permanentRelic ? [...state.relics, adaptationId] : state.relics;
  return {
    ...state,
    adaptations,
    relics,
    resources: clampBag(pay(state.resources, { genetic: def.costGenetic })),
    flags: state.flags.includes("adapted") ? state.flags : [...state.flags, "adapted"],
    message: `Adaptation: ${def.name}`,
  };
}

/** Prestige: Spore Drift — reset colony, keep relics + pathway progress. */
function sporeDrift(state: ColonyState): ColonyState {
  const totalStructures = state.structures.length;
  if (totalStructures < 5 && state.time < 180) {
    return { ...state, message: "Colony too young to drift." };
  }
  const geneticKept = Math.floor(state.resources.genetic * 0.25) + state.prestige;
  const next = createColony();
  return {
    ...next,
    prestige: state.prestige + 1,
    relics: [...new Set([...state.relics, ...state.adaptations.filter((a) => ADAPTATION_MAP[a]?.permanentRelic)])],
    adaptations: [...state.relics],
    resources: {
      ...next.resources,
      genetic: geneticKept + 2,
      biomass: next.resources.biomass + 4 + state.prestige * 2,
      minerals: next.resources.minerals + state.prestige,
    },
    flags: ["started", "drifted", ...state.relics.map((r) => `relic:${r}`)],
    gameSpeed: 1.35 + state.prestige * 0.08,
    message: `Spore Drift #${state.prestige + 1}. Relics endure.`,
    tutorialStep: 3,
  };
}

export function unlockedStructures(state: ColonyState): string[] {
  const counts = countByDef(state.structures);
  return Object.keys(STRUCTURE_MAP).filter((id) =>
    isUnlocked(STRUCTURE_MAP[id]!, counts, state.resources.genetic, state.flags),
  );
}

export function availableAdaptations(state: ColonyState) {
  return ADAPTATION_DEFS.filter(
    (a) => !state.adaptations.includes(a.id) && !state.relics.includes(a.id),
  );
}
