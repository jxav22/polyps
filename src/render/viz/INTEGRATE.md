# Polyps Colony Viz — Integration

**Store path (canonical):** `/cursor/stores/self/internal/polyps-viz/`  
**Bridge/repo mirror:** `src/render/viz/` on `main` (push bridge syncs from store)  
**Live game view today:** `src/render/colonyView.ts` (hex-slot layout wired to sim)  
**This pack:** organic graph morphology (`ColonyRenderer`) — richer feel; drop-in beside or instead of `colonyView`

**Lead patch (optional local apply):**
- `/cursor/stores/self/internal/patches/viz-colony-renderer.tar.gz`
- `/cursor/stores/self/internal/patches/viz-colony-renderer-README.md`

```bash
# Prefer store → src/render/viz (matches bridge layout)
mkdir -p src/render/viz public/viz-demo
cp /cursor/stores/self/internal/polyps-viz/{types,palette,layout,background,archetypes,particles,colony-renderer,demo-snapshot,index}.ts src/render/viz/
cp /cursor/stores/self/internal/polyps-viz/{hud.css,colony-viz.standalone.js,demo.html,INTEGRATE.md} src/render/viz/
cp /cursor/stores/self/internal/polyps-viz/{demo.html,colony-viz.standalone.js,hud.css} public/viz-demo/
```

## Drop-in (Vite / TypeScript)

```ts
import { ColonyRenderer, vizNodesFromSim } from "./render/viz";
// Swap path if modules sit at ./render instead of ./render/viz

const canvas = document.querySelector<HTMLCanvasElement>("#colony")!;
const renderer = new ColonyRenderer(canvas, { interactive: true });

// From sim each tick / after commands:
renderer.setSnapshot({
  time: snapshot.time,
  env: {
    light: snapshot.env.light,
    current: snapshot.env.current,
    disturbance: snapshot.env.disturbance,
  },
  // Pass structure defs so archetype/hue/pulse resolve when not on the instance:
  nodes: vizNodesFromSim(snapshot.structures, defsById),
});

renderer.onNodeClick((node) => {
  if (!node) return;
  // open grow menu / select — presentation only; commands go through sim
  renderer.flashNode(node.id); // upgrade / build feedback
});

function frame(ms: number) {
  renderer.draw(ms / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener("resize", () => renderer.resize());
```

HUD chrome (optional): import `./render/viz/hud.css` (`.polyps-shell`, `.polyps-vitals`, `.polyps-inspect`, `.polyps-grow-hint`).

## No-build smoke demo

Open `demo.html` (needs a static server for fonts/css; or open with the sibling `colony-viz.standalone.js`):

```bash
npx --yes serve /cursor/stores/self/internal/polyps-viz -p 5179
# → http://127.0.0.1:5179/demo.html
```

Repo mirror after merge: `public/viz-demo/demo.html`.

## API surface

| Method | Role |
|--------|------|
| `setSnapshot(VizSnapshot)` | Replace colony graph; new nodes auto growth-tween |
| `draw(timeSeconds)` | Frame; dt derived internally |
| `flashNode(id, strength?)` | Upgrade / build bloom + sparks |
| `flashAt(x,y,hue?,strength?)` | World-space flash (prestige etc.) |
| `onNodeClick(handler)` | Selection; presentation only |
| `resize()` | Call on viewport change |
| `vizNodesFromSim(structures, defs?)` | Map `SimSnapshot.structures` → `VizNode[]` |

## Modules

| File | Responsibility |
|------|----------------|
| `colony-renderer.ts` | Orchestrator |
| `archetypes.ts` | 10 procedural silhouettes |
| `layout.ts` | Organic graph layout |
| `background.ts` | Depth, caustics, motes |
| `particles.ts` | Nutrient flow + flashes |
| `palette.ts` | Submarine colors |
| `hud.css` | Restrained organic HUD |
| `colony-viz.standalone.js` | Single-file browser build |
| `demo.html` / `demo-snapshot.ts` | Wiring samples |

Presentation never mutates sim economy — only reads snapshots and emits click intents.
