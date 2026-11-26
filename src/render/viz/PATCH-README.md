# Viz colony renderer — lead apply

Push bridge syncs store → `src/render/viz/` on main. Prefer store as canonical.

**Tarball (optional local unpack):**

```bash
cd /path/to/polyps
tar xzf /cursor/stores/self/internal/patches/viz-colony-renderer.tar.gz
# yields src/render/* and public/viz-demo/* — move TS into src/render/viz/ if matching bridge layout
```

**Copy live store → bridge layout:**

```bash
mkdir -p src/render/viz public/viz-demo
cp /cursor/stores/self/internal/polyps-viz/{types,palette,layout,background,archetypes,particles,colony-renderer,demo-snapshot,index}.ts src/render/viz/
cp /cursor/stores/self/internal/polyps-viz/{hud.css,colony-viz.standalone.js,demo.html,INTEGRATE.md} src/render/viz/
cp /cursor/stores/self/internal/polyps-viz/{demo.html,colony-viz.standalone.js,hud.css} public/viz-demo/
```

Wire: `/cursor/stores/self/internal/polyps-viz/INTEGRATE.md`  
Smoke: `npx serve /cursor/stores/self/internal/polyps-viz -p 5179` → `/demo.html`
