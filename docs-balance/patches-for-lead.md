# Patches for lead — **REQUIRED on tip `661a914` / `5f3caf7` bridge**

**Verified 2026-11-27 ~04:52 Pacific/Auckland:** `origin/main` @ `661a914` still does **not** export sim aliases.  
Unpatched `npm test` / `npm run build` **FAIL**. With the three aliases below, **`npm test` → 6/6 PASS** (this worker, local-only).

Content packs export `STRUCTURES_BY_ID` / `ADAPTATIONS_BY_ID` / `SYNERGIES`, but `src/sim/*` and `src/ui/hud.ts` import `STRUCTURE_MAP` / `ADAPTATION_MAP` / `SYNERGY_MODIFIERS` / `ADAPTATION_DEFS`.

## Append these aliases (permanent)

### `src/data/structures.ts`

```ts
/** Alias for sim / HUD imports */
export const STRUCTURE_MAP = STRUCTURES_BY_ID;
```

### `src/data/adaptations.ts`

```ts
/** Alias for sim / HUD imports */
export const ADAPTATION_MAP = ADAPTATIONS_BY_ID;
export const ADAPTATION_DEFS = ADAPTATIONS;
```

### `src/data/synergies.ts`

```ts
/** Flattened synergy modifiers for tick */
export const SYNERGY_MODIFIERS = SYNERGIES.flatMap((s) => s.modifiers);
```

## Also ensure

- `src/polyps-interfaces.ts` exists (present on `661a914` ✓)
- Bridge must not wipe these aliases when overlaying store content packs

## Adopt live harness script

```json
"balance:live": "tsx src/balance/live-harness.ts"
```

## Post-alias live harness note (661a914 + local aliases)

Autopilot stuck at `absorber`+`tentacle` — **never builds chamber** (energy→0, biomass≈5). See `live-harness-results.md` + `numeric-fixes-for-lead.md` (chamber cost / energy reserve / tentacle upkeep).
