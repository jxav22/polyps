# Polyps balance package (store bridge)

Vitest sim tests + autopilot harness. Lead copies into `src/balance/` + `tests/` on the game repo.

## Run (local disk — store FS breaks `npm` rename)

```bash
rm -rf /tmp/polyps-balance && mkdir -p /tmp/polyps-balance
cp package.json tsconfig.json vitest.config.ts /tmp/polyps-balance/
cp -a src tests /tmp/polyps-balance/
cd /tmp/polyps-balance && npm install && npm test && npm run harness
```

Or use the existing mirror: `/agent/polyps-balance-run`.

## Layout

| Path | Role |
|---|---|
| `src/reference-sim.ts` | Deterministic tick/command until harness binds to live `src/sim` |
| `src/content-pack.ts` | Numbers aligned to content stream (with QA tweaks) |
| `src/harness.ts` | Autopilots: predatory / photo / symbiotic / colonial |
| `src/save.ts` | Save blob shape contracts |
| `tests/*.test.ts` | Determinism, resources, NaN, save roundtrip, harness smoke |
| `tuning-recommendations.md` | Numeric fixes |
| `content-critique.md` | Critique of `polyps-content/` |
| `harness-results.md` | Last 900s autopilot report |

## Bridge to main (`38dd3fa`)

Remote already has an older `src/balance/`. Store is ahead:

- Energy reserve for anabolism (so pathway builds can afford energy costs)
- Spine-first autopilot (tentacle→chamber before adaptations)
- Pathway build priorities / no cross-path leftover spam
- Fork detection includes `sensor` / `waste_symbiont`

Lead: diff store → repo and re-run `npm test` after fixing content export mismatches (`STRUCTURE_MAP`, `SYNERGY_MODIFIERS`, `../polyps-interfaces`).
