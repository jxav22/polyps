import "./style.css";
import {
  applyCommand,
  createColony,
  snapshot,
  type ColonyState,
} from "./sim/colony.ts";
import { tick } from "./sim/tick.ts";
import { createColonyView } from "./render/colonyView.ts";
import { createHud } from "./ui/hud.ts";
import { clearSave, loadGame, saveGame } from "./save/save.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<div id="stage"></div>`;
const stage = app.querySelector<HTMLDivElement>("#stage")!;
const canvas = document.createElement("canvas");
stage.appendChild(canvas);

let state: ColonyState = loadGame() ?? createColony();
let selectedSlot: number | null = 0;
let lastSave = 0;

const view = createColonyView(canvas);
const hud = createHud(app);

hud.onCommand = (cmd) => {
  state = applyCommand(state, cmd);
  if (cmd.type === "build" || cmd.type === "prestige") {
    saveGame(state);
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
});

canvas.addEventListener("pointerdown", (e) => {
  const slot = view.hitTest(e.clientX, e.clientY);
  if (slot === null) return;
  selectedSlot = slot;
});

window.addEventListener("resize", () => view.resize());
view.resize();

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
  view.draw(snap, now / 1000, selectedSlot);

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

// Expose for balance harness / debug
(window as unknown as { __polyps: { getState: () => ColonyState } }).__polyps = {
  getState: () => state,
};
