# Sim contract (content → lead)

Reviewed against `origin/main` `src/sim/modifiers.ts` (2026-11-26).

## Required evaluator extensions

`modifierApplies` currently handles `minStructures`, `env`, `adjacentTags` only.

Content pack now also emits:

| Field | Meaning | Example |
|-------|---------|---------|
| `maxStructures` | count must be `<= n` | Silent Reef: `tentacle: 0` |
| `forbidAdjacentTags` | none of these tags adjacent | optional future |

**Bug fixed in content:** `minStructures: { tentacle: 0 }` never matched (count `< 0` is impossible). Replaced with `maxStructures: { tentacle: 0 }`.

Suggested patch in sim:

```ts
if (w.maxStructures) {
  for (const [id, n] of Object.entries(w.maxStructures)) {
    if ((ctx.structureCounts[id] ?? 0) > (n ?? 0)) return false;
  }
}
if (w.forbidAdjacentTags?.length) {
  for (const t of w.forbidAdjacentTags) {
    if (ctx.adjacentTags.includes(t)) return false;
  }
}
```

## Rivalries

Import `SYNERGY_RIVALRIES` from `synergies.ts`. When both `a` and `b` active, multiply both synergy channel bags by `rivalryMult`.

## Hard caps

See `HARD_CAPS` in `balance.ts` — especially waste-loop convert.rate mult ≤ 2.0.

## Visual archetypes

New structures reuse existing archetypes (`filter_plate`→membrane, `nest`→bud, `lumophore`→sensor). No new archetype enum required for v1.
