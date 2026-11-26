# Polyps — Design (GDD)

Systems-heavy incremental evolution: a primitive aquatic polyp becomes a specialised biological colony. Discovery comes from **compositional synergies**, not shop ladders.

## Fantasy

Deep-water organism as UI. Bioluminescent teal/cyan on dark water. You grow organs on a living body; the environment cycles; pathways fork; Spore Drift prestiges the lineage.

## Resources (non-interchangeable)

| Resource | Role |
|----------|------|
| nutrients | Feedstock from absorbers / hunting / ambient |
| energy | Metabolic currency for upkeep and builds |
| biomass | Structural mass |
| genetic | Adaptation / evolution currency |
| minerals | Scarce ingredient for venom, membrane, glands |
| waste | Byproduct; toxic if high; fuel for symbionts/bacteria |

**Core flows:** nutrients → chamber → energy + waste → bacteria/detrital symbiont → nutrients/energy. Minerals gate spikes and armor. Genetic gates forks.

## Structures (v1 pack)

Absorber → Tentacle → Chamber unlocks the mid board: Photosymbiont, Detrital Symbiont, Membrane, Bacteria, Sensor, Vessel, Venom, Bud, Mineral Gland, Filter Plate, Brood Nest, Lumophore, Spore Vault.

Every structure has a downside: tentacles idle-tax energy; chambers emit waste; membranes blunt current feed; vessels alone are sinks; buds crowd without grids; venom dumps waste and eats minerals; nests draw predators; lumophores burn energy to fake light or bait.

## Pathways

| Pathway | Pitch | Soft counter |
|---------|-------|--------------|
| Predatory | Sensors + tentacles/venom ride current & pressure | Waste spikes, night/day mismatch for photo |
| Photo | Symbionts feast in bright flood | Night crash; disturbance without shield |
| Symbiotic | Waste loop closes metabolism | Starves in clean colonies; mineral bleed valves |
| Colonial | Buds + vessel grids, bloom under light | Crowding tax; needs logistics |
| Metabolic | Convert efficiency, thrift, heat riding | Lower raw produce; catalyst waste debt |
| Hybrid | Reef hunter / ferment commune / armored loop | Never hits pure-path peaks |

## Synergies (compositional)

Required: **Waste Loop**, **Sensor Hunt**, **Colonial Bloom**, **Vessel Grid**, **Photo-Shield**.

Extras (24): Mineral Spine, Ferment Commune, Night Ambush, Thermal Gut, Armored Loop, Hunt Grid, Bloom Shield, Lean Recycle, Spore Pressure, Dual Symbiont, Filter Rim, Brood Nest, False Dawn, Bait Hunt, Anoxic Grid, Spawn Ferry, Silent Reef, Red Tide, Core–Fringe, Guest Guard, Novelty Engine, Lean Armor, Overveil (anti), Fringe Ferment.

Synergies fire from adjacency + counts + env — not menu unlocks. **Rivalries** in `synergies.ts` soft-nerf opposing identities (e.g. Silent Reef vs Sensor Hunt). Decision forks + combo chains live in `composition.ts`.

### Interaction sketch

```
chamber ──waste──► bacteria / waste_symbiont ──► nutrients  (Waste Loop)
sensor ──aim──► tentacle / venom (+ current/pressure)       (Sensor Hunt)
bud + chamber + symbiont + high light (+ vessels)           (Colonial Bloom)
vessel ↔ vessel ──transport──► specialised clusters         (Vessel Grid)
membrane + symbiont ──hold──► photo under disturbance       (Photo-Shield)
lumophore + symbiont @ night  /  lumophore + sensor @ hunt  (False Dawn / Bait)
nest + bud ──cheap daughters──► +predator attention         (Brood Nest)
filter_plate @ vessel rim + current                         (Filter Rim)
no tentacles + membrane + filters                           (Silent Reef) ⟂ hunt
venom + filthy gut                                          (Red Tide) ⟂ photo
vessel core≠fringe tags                                     (Core–Fringe)
bacteria on rim vs guests on gut                            (Fringe Ferment ⟂ Dual Symbiont)
4+ membranes                                                (Overveil trap)
```

### Combo chains (journal arcs)

Loop→Guard · Hunt→Cloud · Grid→Split · Bloom→Ferry · Vault the Weather · Still Survival

## Environment

Layered soft cycles (Day–Tide, Nutrient Bloom) plus rare events (Predator Front, Light Storm, Anoxic Pocket, Detritus Rain, Spawn Current, Mineral Upwelling). **Never** delete structures or wipe resources below floors; only bias yields/costs.

## Prestige — Spore Drift

Visible ~12–15 min (`minTime` 720s, genetic ≥15, biomass peak ≥40). Drift keeps relics + pathway unlocks + ~25% genetic (vault relic can raise). Relics encode remembered compositions (fang memory, loop cyst, colony spore, etc.).

## Pace targets (tune globally)

| Beat | Target |
|------|--------|
| Tentacle | 60–120s |
| Chamber / meaningful unlock | 2–3 min |
| First adaptation / pathway fork | 5–8 min |
| Prestige UI visible | 12–15 min |
| First comfortable drift | 14–18 min |

## Onboarding

First 60s: absorb → tentacle → chamber. Then waste awareness, fork tease, env notice, vessel/bud, synergy journal, Spore Drift horizon. Hints dismiss on play, not on click-through.

## Content pack location

- Store: `/cursor/stores/self/internal/polyps-content/`
- Repo: `src/data/` (branch `content/evolution-pack`)
- Interfaces: match `internal/polyps-interfaces.ts` / `src/sim/interfaces.ts`

## Design rules for new content

1. No pure number-go-up — every upgrade creates a decision or interaction.
2. Prefer adjacency/env recipes over flat mults.
3. Hybrids weaken pure-path peaks on purpose.
4. Events bias builds; they do not punish with wipes.
