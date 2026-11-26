# Feel notes (viz)

Quick cues for lead / QA while playtesting:

| Action | Expected feedback |
|--------|-------------------|
| Hover structure | ~8% scale-up + soft outline |
| Click structure | Select ping (short ring) + double heartbeat ring |
| Build / grow | Parent→child **conduit** grows with tip bloom; birth veil/pop; `birth` flash with spokes + rings |
| Upgrade | `upgrade` bloom + dual shockwave + sparks |
| Nutrient flow | Cyan orbs + chevron beads along vessels; absorb sparkle on arrival |
| Energy flow | Lime streaks (symbiont edges) |
| Waste flow | Amber **diamonds** on bacteria/chamber loops |
| High current | Tentacles lean/wave harder; colony sway |
| Disturbance | Colony jitter; membrane tightens; murk haze |
| High light | Symbiont clusters brighten / shimmer |
| Idle | Whole-colony breath scale (~0.8%) |

**Resource legend (particles):** cyan orb = nutrients · lime streak = energy · amber diamond = waste

API: `renderer.flashNode(id, strength?, "upgrade"|"select"|"birth")`
