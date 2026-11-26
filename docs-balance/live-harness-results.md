# Live sim harness results

Generated: 2026-11-26T16:22:16.427Z
Engine: real `src/sim` (createColony / tick / applyCommand)

| Pathway | 1st unlock | Fork | Prestige~ | Genetic | Loop? | Structures |
|---|---:|---:|---:|---:|---|---|
| predatory | 3 | 134 | 720 | 100.9 | no | `{"absorber":6,"tentacle":6,"chamber":8,"membrane":8,"sensor":6,"venom":3}` |
| photo | 3 | 41 | 720 | 71.1 | no | `{"absorber":6,"tentacle":6,"chamber":8,"symbiont":10,"membrane":7}` |
| symbiotic | 3 | 38 | 720 | 81.9 | no | `{"absorber":6,"tentacle":6,"chamber":8,"bacteria":10,"membrane":5,"waste_symbiont":2}` |
| colonial | 3 | 200 | 720 | 92.7 | no | `{"absorber":6,"tentacle":6,"chamber":8,"symbiont":10,"vessel":6,"bud":1}` |
| metabolic | 3 | 145 | 720 | 82.6 | no | `{"absorber":6,"tentacle":6,"chamber":8,"bacteria":10,"membrane":4,"filter_plate":3}` |

## Detail

### predatory
- Adaptations: grasp_reflex, chloroplast_bloom, mutual_gut, tight_cycles, budding_rhythm, current_sail, shade_debt, overflow_valve, thin_walls, slow_burn, light_armor, vessel_instinct, heat_tolerant, ambush_venom, toxin_bargain, signal_cascade
- Final: N=140.0 E=120.0 B=140.0 G=5.9 M=70.0 W=70.0
- Bottleneck: @629s biomass≈140.0 E=120.0 M=33.7 W=70.0
- Bottleneck: @760s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @911s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @1041s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Note: createColony start B=8 M=3; data/balance START B=8 M=3

### photo
- Adaptations: grasp_reflex, chloroplast_bloom, mutual_gut, tight_cycles, budding_rhythm, shade_debt, current_sail, overflow_valve, thin_walls, slow_burn, light_armor, vessel_instinct, heat_tolerant
- Final: N=140.0 E=120.0 B=140.0 G=0.1 M=70.0 W=70.0
- Bottleneck: @661s biomass≈140.0 E=120.0 M=33.3 W=70.0
- Bottleneck: @792s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @922s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @1053s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Note: createColony start B=8 M=3; data/balance START B=8 M=3

### symbiotic
- Adaptations: grasp_reflex, mutual_gut, chloroplast_bloom, tight_cycles, budding_rhythm, overflow_valve, current_sail, shade_debt, thin_walls, slow_burn, light_armor, vessel_instinct, heat_tolerant, toxin_bargain
- Final: N=140.0 E=120.0 B=140.0 G=2.9 M=70.0 W=0.0
- Bottleneck: @435s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @566s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @696s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @827s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Note: createColony start B=8 M=3; data/balance START B=8 M=3

### colonial
- Adaptations: grasp_reflex, chloroplast_bloom, mutual_gut, tight_cycles, budding_rhythm, thin_walls, current_sail, shade_debt, overflow_valve, slow_burn, vessel_instinct, light_armor, heat_tolerant, signal_cascade, ambush_venom
- Final: N=140.0 E=120.0 B=140.0 G=5.7 M=70.0 W=70.0
- Bottleneck: @557s biomass≈140.0 E=120.0 M=32.8 W=70.0
- Bottleneck: @687s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @818s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Bottleneck: @948s biomass≈140.0 E=120.0 M=70.0 W=70.0
- Note: createColony start B=8 M=3; data/balance START B=8 M=3

### metabolic
- Adaptations: grasp_reflex, tight_cycles, chloroplast_bloom, mutual_gut, budding_rhythm, slow_burn, current_sail, shade_debt, overflow_valve, thin_walls, heat_tolerant, light_armor, vessel_instinct, ambush_venom
- Final: N=140.0 E=120.0 B=140.0 G=3.6 M=70.0 W=0.0
- Bottleneck: @426s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @557s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @687s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Bottleneck: @818s biomass≈140.0 E=120.0 M=70.0 W=0.0
- Note: createColony start B=8 M=3; data/balance START B=8 M=3

## Pace targets
```
{
  "tentacleSec": [
    60,
    120
  ],
  "chamberSec": [
    120,
    180
  ],
  "firstAdaptationSec": [
    300,
    480
  ],
  "pathwayForkSec": [
    300,
    480
  ],
  "prestigeVisibleSec": [
    720,
    900
  ],
  "firstDriftSec": [
    840,
    1080
  ]
}
```