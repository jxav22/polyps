# Polyps

Systems-heavy incremental evolution: a primitive aquatic polyp becomes a specialised biological colony through compositional synergies.

## Why not Godot?

This sprint targets **browser-native TypeScript + Canvas 2D (Vite)** instead of Godot because:

- Cloud/agent VMs may not have Godot available or verifiable quickly
- Pure TS simulation is trivial to unit-test (Vitest) and keep deterministic
- Instant web preview (`npm run dev` / `npm run build`) with no export toolchain
- Sibling agents can contribute data packs and render modules as plain TS

## Play

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm test          # sim unit tests
npm run build     # production web build
npm run preview   # serve the build
npm run balance   # pathway autopilot harness
```

**Do not deploy publicly** without permission — local preview only.

## Loop

1. **Absorb** nutrients (starter Absorber)
2. **Digest** via a Chamber → energy + waste
3. **Grow** tentacles, symbionts, bacteria, vessels…
4. Feel **synergies** (waste loop, sensor hunt, colonial bloom, vessel grid, photo-shield)
5. **Adapt** with genetic insight; optionally **Spore Drift** (prestige)

Saves auto-write to `localStorage` (`polyps.save.v1`).

## Layout

```
src/
  sim/       # pure deterministic simulation
  data/      # structures, adaptations, synergies
  render/    # canvas colony view
  ui/        # organic HUD
  save/      # versioned localStorage
  balance/   # autopilot harness
```

## Docs

See `docs/` in the project store for DESIGN / EXTENDING / HANDOFF after the sprint handoff pass.
