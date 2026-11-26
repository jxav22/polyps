export type ResourceId =
  | "nutrients"
  | "energy"
  | "biomass"
  | "genetic"
  | "minerals"
  | "waste";

export interface ResourceBag {
  nutrients: number;
  energy: number;
  biomass: number;
  genetic: number;
  minerals: number;
  waste: number;
}

export const RESOURCE_IDS: ResourceId[] = [
  "nutrients",
  "energy",
  "biomass",
  "genetic",
  "minerals",
  "waste",
];

export const RESOURCE_LABELS: Record<ResourceId, string> = {
  nutrients: "Nutrients",
  energy: "Energy",
  biomass: "Biomass",
  genetic: "Genetic",
  minerals: "Minerals",
  waste: "Waste",
};

export function emptyBag(): ResourceBag {
  return {
    nutrients: 0,
    energy: 0,
    biomass: 0,
    genetic: 0,
    minerals: 0,
    waste: 0,
  };
}

export function cloneBag(b: ResourceBag): ResourceBag {
  return { ...b };
}

export function addBag(a: ResourceBag, b: Partial<ResourceBag>, scale = 1): ResourceBag {
  const out = cloneBag(a);
  for (const id of RESOURCE_IDS) {
    const v = b[id];
    if (v !== undefined) out[id] += v * scale;
  }
  return out;
}

export function canAfford(have: ResourceBag, cost: Partial<ResourceBag>): boolean {
  for (const id of RESOURCE_IDS) {
    const c = cost[id];
    if (c !== undefined && c > 0 && have[id] < c) return false;
  }
  return true;
}

export function pay(have: ResourceBag, cost: Partial<ResourceBag>): ResourceBag {
  return addBag(have, cost, -1);
}

export function clampBag(b: ResourceBag, caps?: Partial<ResourceBag>): ResourceBag {
  const out = cloneBag(b);
  for (const id of RESOURCE_IDS) {
    out[id] = Math.max(0, out[id]);
    const cap = caps?.[id];
    if (cap !== undefined) out[id] = Math.min(out[id], cap);
  }
  return out;
}

export function softCap(value: number, soft: number, hard: number): number {
  if (value <= soft) return value;
  if (value >= hard) return hard;
  const t = (value - soft) / (hard - soft);
  return soft + (hard - soft) * (1 - Math.pow(1 - t, 1.6));
}
