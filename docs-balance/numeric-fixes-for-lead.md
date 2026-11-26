# Numeric fixes for lead

**Latest evidence:** live harness @ `7d7ca2e` (aliases+biomass landed; `npm test` 7/7)  
**File:** `/cursor/stores/self/internal/polyps-balance/live-harness-results.md`  
**Engine:** real `createColony` / `tick` / `applyCommand`

## Critical @ `7d7ca2e` — energy soft-lock before chamber

After first tentacle, energy → 0 within ~60s; chamber needs **E3** (+B6 N4). Autopilot never builds chamber on any pathway.

| Knob | Propose | Why |
|---|---|---|
| `tentacle.upkeep.energy` | −0.15 → **−0.08** (or 0 until chamber exists) | Pre-digest energy death |
| Ambient / absorber energy trickle | **+0.15–0.25/s** light-scaled before chamber | Or delay tentacle unlock until chamber |
| `chamber.cost.energy` | 3 → **1** | Affordable from post-tentacle bag |
| Build order / onboarding | Force chamber before 2nd tentacle | UI + autopilot |

Also: `npm run build` fails — `src/balance/run-harness.ts` imports missing exports from `harness.ts`.

## Live pathway summary (900s wall / ~1200s sim-time)

| Pathway | Fork (sim s) | Prestige~ | Issue |
|---|---:|---:|---|
| predatory | 319 (sensor) | 580 | OK-ish fork; tentacle spam (12) |
| photo | 413 (symbiont) | — | Prestige miss; fork near upper band |
| symbiotic | 546 (bacteria) | — | Fork **late** vs 300–480 target |
| colonial | — | — | **Dead end** — no bud/nest |
| metabolic | — | — | **Dead end** — no gland/filter |

## Concrete numeric changes

### A. Align start bags (critical consistency)

| Source | nutrients | energy | biomass | minerals |
|---|---:|---:|---:|---:|
| `createColony()` today | 6 | 3 | 8 | 2 |
| `data/balance.START_RESOURCES` | 2 | 3 | 2 | 0 |

**Propose one canonical start** (recommend colony values, slightly tighter):

```ts
{ nutrients: 6, energy: 4, biomass: 8, genetic: 0, minerals: 2, waste: 0 }
```

If using balance.ts harsh start (minerals 0, biomass 2), **membrane/symbiont/venom soft-lock** — do not ship that without a mineral trickle ≥0.05/s from t=0.

### B. Unlock / cost retunes (hit fork ≤480 sim-s)

| Knob | Current (content) | Propose | Why (live) |
|---|---|---|---|
| `chamber.cost` | B8 E4 N6 | **B6 E3 N4** | Spine before pathway; live often waits on biomass |
| `tentacle.upkeep.energy` | −0.25 | **−0.15** | 12 tentacles observed; energy pressure |
| `tentacle.maxCount` | 12 | **6** early / soft | Autopilot + players over-invest |
| `symbiont.unlock.requiresGenetic` | 2 | keep 2 | photo fork 413 OK if chamber earlier |
| `bacteria.unlock.requiresGenetic` | 3 | **2** | symbiotic fork 546 too late |
| `bacteria.cost` | B3 E2 N4 | **B3 E1 N3** | Same |
| `sensor.unlock` tentacle:2 genetic:4 | keep counts | genetic **3** | predatory OK at 319; help humans |
| `bud.unlock` chamber+membrane genetic:8 | genetic **6**, membrane optional **OR** vessel:1 | colonial never forked |
| `bud.cost` B15 G3 E6 | **B12 G2 E5** | colonial dead end |
| `vessel.unlock` chamber:2 genetic:5 | **chamber:1 genetic:4** | colonial/metabolic logistics |
| `mineral_gland.unlock` vessel:1 genetic:7 | genetic **5** | metabolic dead end |
| `membrane.cost` B10 M2 E3 | **B8 M1 E2** | colonial gate + photo-shield |

### C. Biomass income (live bug/economy hole)

Live smoke: after tentacle, **biomass never recovers** until somehow capped paths hit softcap via other means.  
`createColony` spends starter biomass; **no structure produces biomass**.

**Propose** one of:

1. Core anabolism in `tick.ts`: convert energy+nutrients→biomass at ~0.4/s with energy reserve 3; or
2. Add `produce: { biomass: 0.05 }` on chamber; or
3. Building refund already gives +0.5 biomass — raise to +1.0 and add idle anabolism

Without this, midgame is “wait for softcap weirdness” not a loop.

### D. Soft caps / prestige signal

Live finals clamp near **N140 E120 W70 B100 M70** — fine as soft walls, but:

| Knob | Propose |
|---|---|
| Prestige visibility flag | Set `prestige_ready` when genetic lifetime ≥ **16** or spore_vault built — harness/UI need a real flag (today harness uses genetic≥15 heuristic) |
| Waste softcap 70 | OK; ensure bacteria/waste_symbiont unlock **before** waste hits ~20 (`SOFT_CAPS.wastePenaltyFull`) |

### E. Synergy / test id hygiene

- Waste-loop active id is not `syn-waste-loop` — update tests to assert `waste_loop` / actual modifier tag.
- Chamber unit test must build **tentacle first** (unlock requires it).

### F. Autopilot / UX

- Cap tentacle recommendation at 3 until sensor/symbiont/bacteria exists.
- Onboarding: chamber cost must be payable within 120–180s from createColony bag.

## Priority order for lead

1. Export aliases (`patches-for-lead.md`) → green build  
2. Biomass income  
3. Align START_RESOURCES ↔ createColony  
4. Colonial bud unlock/cost  
5. Symbiotic bacteria earlier  
6. Tentacle upkeep / maxCount  
