# Bridge notes — store balance → main @ 38dd3fa

**Remote tip:** `38dd3fad2de039c8ecc7d9549f6a9766ea21e994` (verified 2026-11-26T15:45Z UTC)  
**Repo path:** `/agent/repos/polyps`  
**Store path:** `/cursor/stores/self/internal/polyps-balance/`

## Verified on remote clone

| Command | Result |
|---|---|
| `git rev-parse HEAD` | `38dd3fa…` matches coordinator tip |
| `npm install` | OK |
| `npm test` | **FAIL** — 4/5 in `src/sim/tick.test.ts` |
| `npm run build` | **FAIL** — `tsc` errors |
| `npm run balance` | exits 0 but prints nothing (module has no CLI main; use `tsx src/balance/run-harness.ts`) |

### Root causes of remote test/build fail (lead)

1. Content merge export names: sim expects `STRUCTURE_MAP` / `ADAPTATION_MAP` / `SYNERGY_MODIFIERS`; data exports `STRUCTURES` / `ADAPTATIONS` / `SYNERGIES`.
2. Data files import `../polyps-interfaces` (missing); should use `./types` or a real interfaces module.
3. `run-harness.ts` needs Node types in `tsconfig` (`"types": ["node"]`) or stay excluded from `tsc` app build.

## Store package (verified on `/agent/polyps-balance-run`)

| Command | Result |
|---|---|
| `npm test` | **PASS** 17/17 |
| `npm run harness` (900s) | Writes `harness-results.md` |

## Files lead should pull from store (newer than main)

- `src/harness.ts` (spine-first, pathway priorities, fork ids)
- `src/reference-sim.ts` (biomass anabolism + energy reserve + ambient energy)
- `src/content-pack.ts` (chamber/tentacle retunes)
- `tests/*` (if not already identical)
- docs: `tuning-recommendations.md`, `content-critique.md`

## Top balance risks (still open)

1. **No biomass producer in content pack** — sim must synthesize biomass or midgame soft-locks after starter bag.
2. **Energy starvation** blocks sensor/symbiont/venom (fork structures) under waste pressure.
3. **Waste toxicity** high without early bacteria/waste_symbiont on non-symbiotic paths.
4. **content `START_RESOURCES` minerals:0 / biomass:2`** — harsher than harness; will miss membrane/symbiont gates.
5. Remote game currently **does not build/test green** after content merge — fix exports before trusting in-repo harness.
