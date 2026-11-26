import { STRUCTURE_MAP } from "../data/structures.ts";
import { ADAPTATION_MAP } from "../data/adaptations.ts";
import {
  availableAdaptations,
  unlockedStructures,
  type ColonyState,
  type SimCommand,
  type SimSnapshot,
} from "../sim/colony.ts";
import { RESOURCE_IDS, RESOURCE_LABELS, type ResourceId } from "../sim/resources.ts";
import { ENV_IDS } from "../sim/environment.ts";

export interface HudApi {
  root: HTMLElement;
  render(snap: SimSnapshot, state: ColonyState, selectedSlot: number | null): void;
  onCommand: (cmd: SimCommand) => void;
}

const ENV_LABELS: Record<string, string> = {
  light: "Light",
  temperature: "Temp",
  ambientNutrients: "Ambience",
  current: "Current",
  predatorPressure: "Predators",
  disturbance: "Surge",
};

export function createHud(mount: HTMLElement): HudApi {
  const root = document.createElement("div");
  root.className = "hud";
  mount.appendChild(root);

  const api: HudApi = {
    root,
    onCommand: () => {},
    render(snap, state, selectedSlot) {
      const unlocked = unlockedStructures(state);
      const adapts = availableAdaptations(state);
      const selected = snap.structures.find((s) => s.slot === selectedSlot);
      const selectedDef = selected ? STRUCTURE_MAP[selected.defId] : null;

      root.innerHTML = `
        <header class="brand-bar">
          <div class="brand">POLYPS</div>
          <div class="whisper">${escapeHtml(snap.message)}</div>
          <div class="meta">
            <span>${formatTime(snap.time)}</span>
            <span>Drift ${snap.prestige}</span>
          </div>
        </header>

        <aside class="vitals">
          ${RESOURCE_IDS.map((id) => resourceChip(id, snap)).join("")}
        </aside>

        <aside class="env-ribbon">
          ${ENV_IDS.map((id) => {
            const v = snap.env[id] ?? 0;
            return `<div class="env-pip" title="${ENV_LABELS[id]}">
              <span>${ENV_LABELS[id]}</span>
              <i style="--v:${v}"></i>
            </div>`;
          }).join("")}
        </aside>

        <div class="grow-dock">
          <div class="dock-title">Grow</div>
          <div class="grow-grid">
            ${unlocked
              .filter((id) => id !== "absorber")
              .map((id) => {
                const d = STRUCTURE_MAP[id]!;
                const afford = canShowAfford(snap, d.cost);
                return `<button class="grow-btn ${afford ? "" : "dim"}" data-build="${id}" title="${escapeHtml(d.description)}">
                  <strong>${escapeHtml(d.name)}</strong>
                  <small>${costLine(d.cost)}</small>
                </button>`;
              })
              .join("")}
          </div>
        </div>

        <div class="side-panel">
          ${
            selectedDef
              ? `<div class="inspect">
                  <h3>${escapeHtml(selectedDef.name)}</h3>
                  <p>${escapeHtml(selectedDef.description)}</p>
                  <p class="tags">${selectedDef.tags.map((t) => `<em>${t}</em>`).join(" ")}</p>
                  ${
                    selected && selected.slot !== 0
                      ? `<button data-sell="${selected.slot}" class="ghost">Resorb</button>`
                      : ""
                  }
                </div>`
              : `<div class="inspect mute"><p>Touch a polyp organ to inspect. Empty rings await growth.</p></div>`
          }

          ${
            snap.activeSynergies.length
              ? `<div class="syn-list"><div class="dock-title">Synergies</div>${snap.activeSynergies
                  .map((s) => `<div class="syn">${formatSyn(s)}</div>`)
                  .join("")}</div>`
              : ""
          }

          ${
            adapts.length
              ? `<div class="adapt-list"><div class="dock-title">Adapt</div>${adapts
                  .map((a) => {
                    const ok = snap.resources.genetic >= a.costGenetic;
                    return `<button class="adapt-btn ${ok ? "" : "dim"}" data-adapt="${a.id}">
                      <strong>${escapeHtml(a.name)}</strong>
                      <small>${a.pathway} · ${a.costGenetic} genetic</small>
                    </button>`;
                  })
                  .join("")}</div>`
              : ""
          }

          <div class="ops">
            ${
              snap.flags.includes("seen_prestige_ui") ||
              snap.flags.includes("can-prestige") ||
              snap.flags.includes("prestige_ready")
                ? `<button class="prestige" data-prestige="1">Spore Drift</button>
                   <p class="mute" style="margin:0.35rem 0 0;font-size:0.75rem">Release spores — relics endure.</p>`
                : snap.flags.includes("pathway_committed")
                  ? `<p class="mute" style="margin:0;font-size:0.75rem">Lineage deepens — Spore Drift opens ~12 min in (lifetime genetic ≥16).</p>`
                  : snap.flags.includes("seen_midgame")
                    ? `<p class="mute" style="margin:0;font-size:0.75rem">Compose a synergy — Drift waits on lineage, not stockpile.</p>`
                    : ""
            }
            <button class="ghost" data-save="1">Save</button>
            <button class="ghost" data-reset="1">New Colony</button>
          </div>
        </div>

        <div class="tutorial ${snap.tutorialStep >= 3 ? "fade" : ""}">
          ${tutorialText(snap.tutorialStep)}
        </div>
      `;

      root.querySelectorAll("[data-build]").forEach((el) => {
        el.addEventListener("click", () => {
          const structureId = (el as HTMLElement).dataset.build!;
          api.onCommand({ type: "build", structureId });
        });
      });
      root.querySelectorAll("[data-sell]").forEach((el) => {
        el.addEventListener("click", () => {
          api.onCommand({ type: "sell", slot: Number((el as HTMLElement).dataset.sell) });
        });
      });
      root.querySelectorAll("[data-adapt]").forEach((el) => {
        el.addEventListener("click", () => {
          api.onCommand({ type: "adapt", adaptationId: (el as HTMLElement).dataset.adapt });
        });
      });
      root.querySelector("[data-prestige]")?.addEventListener("click", () => {
        api.onCommand({ type: "prestige" });
      });
      // save/reset handled via custom events
      root.querySelector("[data-save]")?.addEventListener("click", () => {
        root.dispatchEvent(new CustomEvent("polyps-save"));
      });
      root.querySelector("[data-reset]")?.addEventListener("click", () => {
        root.dispatchEvent(new CustomEvent("polyps-reset"));
      });

      void ADAPTATION_MAP; // keep import used for future inspect
    },
  };

  return api;
}

function resourceChip(id: ResourceId, snap: SimSnapshot): string {
  const rate = snap.rates[id] ?? 0;
  const sign = rate >= 0.05 ? "+" : rate <= -0.05 ? "" : "·";
  const rateStr =
    Math.abs(rate) < 0.05 ? "" : `${sign}${rate >= 0 ? rate.toFixed(1) : rate.toFixed(1)}/s`;
  return `<div class="vital" data-res="${id}">
    <span class="label">${RESOURCE_LABELS[id]}</span>
    <span class="val">${formatNum(snap.resources[id])}</span>
    <span class="rate">${rateStr}</span>
  </div>`;
}

function canShowAfford(snap: SimSnapshot, cost: Partial<Record<ResourceId, number>>): boolean {
  for (const id of RESOURCE_IDS) {
    const c = cost[id];
    if (c !== undefined && c > 0 && snap.resources[id] < c) return false;
  }
  return true;
}

function costLine(cost: Partial<Record<ResourceId, number>>): string {
  return RESOURCE_IDS.filter((id) => (cost[id] ?? 0) > 0)
    .map((id) => `${cost[id]} ${RESOURCE_LABELS[id].slice(0, 3).toLowerCase()}`)
    .join(" · ");
}

function formatNum(n: number): string {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(1);
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSyn(id: string): string {
  return id.replace(/^syn-/, "").replace(/-/g, " ");
}

function tutorialText(step: number): string {
  if (step <= 0) return "Grow a <strong>Tentacle</strong> — reach farther, then digest.";
  if (step === 1) return "Grow a <strong>Digestive Chamber</strong> — nutrients become energy (+ waste).";
  if (step === 2) return "Close the loop: <strong>Bacteria</strong> / symbiont, or lean into light / hunt.";
  return "";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
