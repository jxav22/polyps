# Content Critique — polyps-content

Reviewed: `structures.ts`, `adaptations.ts`, `synergies.ts`  
Against: brief pace targets + reference harness design.

## What’s strong

- Real trade-offs on adaptations (night photo penalty, hunter tax on photo, bud crowd tax).
- Five brief synergies present + extras (`mineral_spine`, `ferment_commune`).
- Unlock graph is intentional: absorber → tentacle → chamber → forks.
- Waste is a first-class pressure, not flavor text.

## Concrete numeric fixes

See also `tuning-recommendations.md`. Highest priority:

1. **`tentacle.upkeep.energy`: `-0.25` → `-0.15`**  
   Early spam soft-locks chamber (needs energy 4 + nutrients 6).

2. **`chamber.cost`: `{ biomass:8, energy:4, nutrients:6 }` → `{ biomass:6, energy:3, nutrients:4 }`**  
   Hit ~2–3 min chamber for humans; autopilot is faster.

3. **`bud.cost.genetic`: `3` → `2` and `requiresGenetic`: `8` → `6`**  
   Colonial fork otherwise slides past 8 min; genetic is also prestige fuel.

4. **`venom.cost.minerals`: `4` → `3`** + ensure `mineral_gland` or ambient minerals keep ≥0.05/s before vessel.  
   Predatory late gate is mineral-starved.

5. **Hard-cap synergy mults on `convert.rate` / waste reclaim at ≤2.0 combined.**  
   `waste_loop` (1.35) × `mutual_gut` (1.4) × adjacency (1.3–1.4) can exceed 2.5× without a sink for outputs → harness loop risk.

6. **`chamber.produce.waste`: `0.25` → `0.18`**  
   Give symbiotic answer time to appear after first chamber.

7. **`vessel.unlock.requiresStructures.chamber`: `2` → `1`**  
   Vessel grid is the anti-crowd tool for colonial; gating on 2 chambers delays the counterplay.

## Design nits (non-blocking)

- Modifier keys like `tag.photo.produce.energy` need a documented resolver in sim — balance reference sim only handles flat resource channels.
- `spore_vault` needs `seen_midgame` flag setter in sim or it never unlocks.
- `waste_symbiont` vs `bacteria` overlap is good fantasy; clarify in UI which closes nutrients vs energy.
- Sensor hue `280` reads purple — viz may want teal/cyan to match submarine palette (viz stream).

## Autopilot expectations

Until lead wires tag modifiers + synergies into tick, harness results understate photo/symbiotic power and may overstate predatory mineral stalls. Re-critique after first green `src/sim` integration.
