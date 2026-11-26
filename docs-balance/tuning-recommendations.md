# Tuning Recommendations

Based on content pack review + reference-sim harness design.
Re-run `npm run harness` after applying and paste results into `harness-results.md`.

## Pace targets (brief)

| Milestone | Target |
|---|---|
| Meaningful unlock | 120–180s |
| Pathway fork | 300–480s |
| Prestige visible | 720–900s |

## Concrete numeric fixes (content pack)

### Early game (absorber → tentacle → chamber)

| Knob | Current | Propose | Why |
|---|---|---|---|
| `tentacle.upkeep.energy` | `-0.25` | `-0.15` | Spam-tentacle soft-locks energy before chamber |
| `chamber.cost.biomass` | `8` | `6` | Align with ~2–3 min chamber under casual play |
| `chamber.cost.energy` | `4` | `3` | Same |
| `chamber.cost.nutrients` | `6` | `4` | Nutrients already gated by tentacle upkeep |
| `START` minerals (lead) | n/a | `≥3` | Membrane/symbiont mineral tax at fork |

### Predatory

| Knob | Current | Propose | Why |
|---|---|---|---|
| `sensor.unlock.requiresGenetic` | `4` | `3` | Fork visibility inside 5–8 min |
| `venom.cost.minerals` | `4` | `3` | Minerals scarce until gland |
| `venom.produce.nutrients` | `0.3` | `0.5` base **or** keep 0.3 but ensure sensor-hunt mult always on under current≥0.35 | Passive venom feels dead without synergy |
| `grasp_reflex.costGenetic` | `4` | `3` | Earlier predatory identity |

### Photo

| Knob | Current | Propose | Why |
|---|---|---|---|
| `symbiont.produce.energy` | `0.7` | keep `0.7` | OK if night penalty exists via adaptation |
| `chloroplast_bloom` night mult | `0.55` | `0.65` | Avoid photo feeling off every cycle |
| `membrane.cost.biomass` | `10` | `8` | Photo-shield / colonial gate |

### Symbiotic / waste

| Knob | Current | Propose | Why |
|---|---|---|---|
| `chamber.produce.waste` | `0.25` | `0.18` | Give 30–60s before toxicity hurts |
| `bacteria.convert.rate` | `0.3` | `0.4` | Close loop before waste soft-cap |
| `waste_symbiont.convert.rate` | `0.45` | keep | Good primary sink |
| Cap stacked waste_loop mults | uncapped | hard cap convert.rate mult ≤ `2.0` | Infinite-loop guard |

### Colonial

| Knob | Current | Propose | Why |
|---|---|---|---|
| `bud.cost.biomass` | `15` | `12` | Hit fork ≤480s |
| `bud.cost.genetic` | `3` | `2` | Genetic is also the prestige currency |
| `bud.unlock.requiresGenetic` | `8` | `6` | |
| `vessel.unlock.requiresStructures.chamber` | `2` | `1` | Colonial bloom needs vessels vs crowd tax |

### Prestige

| Knob | Propose |
|---|---|
| `PRESTIGE_GENETIC_THRESHOLD` | `16–18` with spore_vault genetic `0.08` |
| Ensure midgame flag `seen_midgame` sets by ~8 min | so spore_vault can appear |

## Harness acceptance

- No pathway `INFINITE LOOP`
- No pathway dead-end before fork in 900s autopilot
- Dominant strategy flag only if prestige time ratio >1.5× or genetic >2.5×
- First unlock under autopilot may be ≪2 min (OK); human pace still guided by costs above
