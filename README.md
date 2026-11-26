# Polyps

**Play:** [https://jxav22.github.io/polyps/](https://jxav22.github.io/polyps/)  
*(GitHub Pages — goes live after the bridge pushes `main` + Pages is enabled on `/docs` or `gh-pages` / Actions.)*

Systems-heavy incremental evolution: a primitive aquatic polyp becomes a specialised biological colony through compositional synergies.

## Stack (not Godot)

**Vite + TypeScript + Canvas 2D** in the browser. This is intentional for the sprint:

- Instant web preview and static `dist/` deploy (GitHub Pages / itch.io)
- Pure TS simulation is unit-tested (Vitest) and deterministic
- Sibling agents ship data packs and viz as plain TS modules

There is **no Godot project** in this repo.

## Local / dev

```bash
npm install
npm run dev          # http://localhost:5173/polyps/ (base path matches Pages)
```

```bash
npm test             # sim unit tests
npm run build        # static production site → dist/
npm run preview      # serve dist locally (same /polyps/ base)
npm run balance      # pathway autopilot harness
npm run zip:itch     # zip dist/ for itch.io HTML5 upload
```

`vite.config.ts` sets `base: "/polyps/"` for the project Pages URL. For a custom domain at site root, change `base` to `'/'`.

## itch.io

```bash
npm run zip:itch
```

Rebuilds `dist/` with `base: './'` (itch-safe relative URLs) and writes `polyps-itch.zip`. Upload as an **HTML5** game; entry = `index.html`.  

For GitHub Pages, use `npm run build` instead (`base: /polyps/`).

## Loop

1. **Absorb** nutrients (starter Absorber)
2. **Digest** via a Chamber → energy + waste
3. **Grow** tentacles, symbionts, bacteria, vessels…
4. Feel **synergies** (waste loop, sensor hunt, colonial bloom, vessel grid, photo-shield)
5. **Adapt** with genetic insight; optionally **Spore Drift** (prestige)

Saves write to `localStorage` (`polyps.save.v1`).

## Layout

```
src/
  sim/       # pure deterministic simulation
  data/      # structures, adaptations, synergies, prestige
  render/    # ColonyRenderer (Canvas 2D)
  ui/        # HUD
  save/      # versioned localStorage
  balance/   # autopilot harness
dist/        # static site from npm run build (Pages / itch)
```

## Docs

See store `docs/` for DESIGN / EXTENDING / HANDOFF.
