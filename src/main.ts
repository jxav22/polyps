import "./style.css";
import "./render/viz/hud.css";
import {
  applyCommand,
  createColony,
  snapshot,
  type ColonyState,
} from "./sim/colony.ts";
import { tick } from "./sim/tick.ts";
import { STRUCTURE_MAP } from "./data/structures.ts";
import { ColonyRenderer, vizNodesFromSim } from "./render/viz/index.ts";
import { createHud } from "./ui/hud.ts";
import { clearSave, loadGame, saveGame } from "./save/save.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.classList.add("polyps-shell");
app.innerHTML = `<div id="stage"></div>`;
const stage = app.querySelector<HTMLDivElement>("#stage")!;
const canvas = document.createElement("canvas");
canvas.id = "colony";
stage.appendChild(canvas);

let state: ColonyState = loadGame() ?? createColony();
let selectedSlot: number | null = 0;
let lastSave = 0;
let lastStructCount = state.structures.length;
let lastPrestige = state.prestige;

const renderer = new ColonyRenderer(canvas, {
  interactive: true,
  showVessels: true,
  particleScale: 1,
});
const hud = createHud(app);

function pushViz(): void {
  const snap = snapshot(state);
  renderer.setSnapshot({
    time: snap.time,
    env: {
      light: snap.env.light,
      current: snap.env.current,
      disturbance: snap.env.disturbance,
    },
    nodes: vizNodesFromSim(snap.structures, STRUCTURE_MAP),
  });
  const sel = snap.structures.find((s) => s.slot === selectedSlot);
  renderer.setSelectedId(sel?.id ?? null);
}

hud.onCommand = (cmd) => {
  const before = state.structures.length;
  state = applyCommand(state, cmd);
  if (cmd.type === "build" || cmd.type === "prestige" || cmd.type === "adapt") {
    saveGame(state);
  }
  pushViz();
  if (state.structures.length > before) {
    const newest = state.structures[state.structures.length - 1];
    if (newest) renderer.flashNode(newest.id, 1.2);
  }
  if (cmd.type === "prestige" && state.prestige > lastPrestige) {
    renderer.flashAt(0, 0, 200, 1.6);
    lastPrestige = state.prestige;
  }
};

hud.root.addEventListener("polyps-save", () => {
  saveGame(state);
  state = { ...state, message: "Colony remembered." };
});

hud.root.addEventListener("polyps-reset", () => {
  clearSave();
  state = createColony();
  selectedSlot = 0;
  lastStructCount = 1;
  lastPrestige = 0;
  pushViz();
});

renderer.onNodeClick((node) => {
  if (!node) {
    selectedSlot = null;
    return;
  }
  selectedSlot = node.slot ?? selectedSlot;
  renderer.flashNode(node.id, 0.45);
});

window.addEventListener("resize", () => {
  renderer.resize();
  pushViz();
});
renderer.resize();
pushViz();

let last = performance.now();
let acc = 0;
const STEP = 1 / 30;
let hudAcc = 0;
let lastSelected: number | null = selectedSlot;
let lastMessage = state.message;

function frame(now: number) {
  const raw = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += raw;
  while (acc >= STEP) {
    state = tick(state, STEP);
    acc -= STEP;
  }

  const snap = snapshot(state);
  if (state.structures.length !== lastStructCount) {
    lastStructCount = state.structures.length;
  }
  pushViz();
  renderer.draw(now / 1000);

  hudAcc += raw;
  const selectionChanged = lastSelected !== selectedSlot;
  const messageChanged = lastMessage !== state.message;
  if (hudAcc > 0.2 || selectionChanged || messageChanged) {
    hud.render(snap, state, selectedSlot);
    hudAcc = 0;
    lastSelected = selectedSlot;
    lastMessage = state.message;
  }

  if (now - lastSave > 15000) {
    saveGame(state);
    lastSave = now;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

(window as unknown as { __polyps: { getState: () => ColonyState } }).__polyps = {
  getState: () => state,
};
