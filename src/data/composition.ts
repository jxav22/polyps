/**
 * Composition cookbook — decision forks for lead/UI/journal.
 * Not runtime-evaluated; documents intended interactions.
 */

export interface CompositionFork {
  id: string;
  title: string;
  chooseA: string;
  chooseB: string;
  /** Why neither is strictly dominant */
  tension: string;
  relatedSynergies: string[];
  relatedAdaptations: string[];
}

export const COMPOSITION_FORKS: CompositionFork[] = [
  {
    id: "feed_style",
    title: "How do you eat?",
    chooseA: "Tentacles + sensors (active hunt, energy tax)",
    chooseB: "Absorbers + filter plates (passive, current-gated)",
    tension:
      "Hunt spikes in dusk/predator fronts; filters win bright flood shear and lean water. Mixing dilutes both.",
    relatedSynergies: ["sensor_hunt", "filter_rim", "lean_recycle", "bait_hunt"],
    relatedAdaptations: ["grasp_reflex", "current_sail"],
  },
  {
    id: "waste_policy",
    title: "Live with waste or vent it?",
    chooseA: "Close the Waste Loop (bacteria / detrital symbiont)",
    chooseB: "Overflow Valve + thrift (bleed minerals, stay clean)",
    tension:
      "Loop needs constant effluent; clean thrift starves recyclers and misses detritus rain.",
    relatedSynergies: ["waste_loop", "armored_loop", "dual_symbiont", "thermal_gut"],
    relatedAdaptations: ["mutual_gut", "toxin_bargain", "overflow_valve", "partner_lock"],
  },
  {
    id: "light_strategy",
    title: "Trust the sun or fake it?",
    chooseA: "Photo-Shield + day bloom (real light)",
    chooseB: "False Dawn lumophore (night energy, upkeep burn)",
    tension:
      "Shielded noon peaks higher; false dawn softens nights but never matches bright flood and taxes energy.",
    relatedSynergies: ["photo_shield", "colonial_bloom", "false_dawn", "bloom_shield"],
    relatedAdaptations: ["chloroplast_bloom", "shade_debt", "light_armor", "guest_tax"],
  },
  {
    id: "colony_shape",
    title: "Stack daughters or ferry them?",
    chooseA: "Brood Nest cheap buds (predator magnet)",
    chooseB: "Vessel grid + Spawn Ferry (logistics cost)",
    tension:
      "Nests spam biomass fast and paint a target; ferries scale safer but need midgame vessels and shear.",
    relatedSynergies: ["colonial_bloom", "brood_nest", "vessel_grid", "spawn_ferry"],
    relatedAdaptations: ["budding_rhythm", "thin_walls", "vessel_instinct", "signal_cascade"],
  },
  {
    id: "defense_posture",
    title: "Armor the core or bait the fringe?",
    chooseA: "Membrane veil (blunt pressure, dull current feed)",
    chooseB: "Bait Hunt lumophore (nutrient spikes, invite predators)",
    tension:
      "Armor stabilises photo/waste cores; bait accelerates predatory snowballs until a front arrives.",
    relatedSynergies: ["photo_shield", "armored_loop", "bait_hunt", "sensor_hunt"],
    relatedAdaptations: ["light_armor", "current_sail", "armored_loop"],
  },
  {
    id: "metabolic_tempo",
    title: "Slow burn or catalyst spike?",
    chooseA: "Tight Cycles / Slow Burn (efficient, patient)",
    chooseB: "Catalyst Spike on warm_ebb (burst convert, waste debt)",
    tension:
      "Patience wins long lean phases; spikes print energy in heat then choke without a waste sink.",
    relatedSynergies: ["thermal_gut", "waste_loop", "anoxic_grid"],
    relatedAdaptations: ["tight_cycles", "slow_burn", "heat_tolerant", "catalyst_spike"],
  },
  {
    id: "hybrid_tax",
    title: "Specialise or generalise?",
    chooseA: "Pure pathway peaks (photo / predatory / loop)",
    chooseB: "Hybrids (reef hunter, dusk gardener, commune ferment)",
    tension:
      "Pures explode in their weather and crater outside it; hybrids flatten peaks and raise floors — prestige Hybrid Knot locks the compromise.",
    relatedSynergies: ["night_ambush", "ferment_commune", "dual_symbiont", "reef_hunter"],
    relatedAdaptations: ["reef_hunter", "dusk_gardener", "commune_ferment", "armored_loop"],
  },
  {
    id: "teeth_or_stillness",
    title: "Teeth or stillness?",
    chooseA: "Sensor Hunt / Bait Hunt / Red Tide (active, loud)",
    chooseB: "Silent Reef / Lean Armor (passive, veiled)",
    tension:
      "Loud builds feast on dusk and fronts; silent builds win lean shear and crash when you bolt arms back on (rivalry).",
    relatedSynergies: ["sensor_hunt", "bait_hunt", "red_tide", "silent_reef", "lean_armor"],
    relatedAdaptations: ["grasp_reflex", "ambush_venom", "current_sail"],
  },
  {
    id: "waste_architecture",
    title: "Where does the mess live?",
    chooseA: "Dual Symbiont / Guest Guard (guests on the gut)",
    chooseB: "Fringe Ferment (bacteria on vessel rim)",
    tension:
      "Core guests tax nutrients but shine in storms; rim logistics need vessels and weaken double-guest bonuses (rivalry).",
    relatedSynergies: ["dual_symbiont", "guest_guard", "fringe_ferment", "waste_loop"],
    relatedAdaptations: ["mutual_gut", "guest_tax", "partner_lock"],
  },
  {
    id: "genetic_source",
    title: "How do you evolve?",
    chooseA: "Novelty Engine (sensors + vault + weather change)",
    chooseB: "Colonial Bloom / Polyp City (conformist daughters)",
    tension:
      "Novelty needs disturbance and phase churn; bloom wants stable bright water — rivalry soft-nerfs running both.",
    relatedSynergies: ["novelty_engine", "colonial_bloom", "spore_pressure"],
    relatedAdaptations: ["hunter_memory", "polyp_city", "solar_vaulting"],
  },
  {
    id: "armor_ceiling",
    title: "How much veil?",
    chooseA: "Photo-Shield / Guest Guard (1–2 membranes)",
    chooseB: "Overveil trap (4+ membranes)",
    tension:
      "First veils save guests; stacking past the peak blinds filters and current feed — Overveil is a documented footgun.",
    relatedSynergies: ["photo_shield", "guest_guard", "overveil", "filter_rim"],
    relatedAdaptations: ["light_armor", "thin_walls"],
  },
  {
    id: "body_plan",
    title: "One lump or core–fringe?",
    chooseA: "Compact mixed colony (simple, flexible)",
    chooseB: "Core–Fringe Split via vessels (specialised, brittle if mixed)",
    tension:
      "Compact is forgiving; core–fringe pays when rim and core stay tagged apart and collapses if you jam tentacles into the gut.",
    relatedSynergies: ["core_fringe", "vessel_grid", "hunt_grid", "fringe_ferment"],
    relatedAdaptations: ["vessel_instinct", "signal_cascade"],
  },
];

/** Soft anti-dominance notes for harness */
export const ANTI_DOMINANCE = [
  "Waste Loop efficiency must consume upkeep or hit diminishing returns — no free infinite nutrients.",
  "Photo-Shield must not erase night entirely; False Dawn is strictly weaker than noon.",
  "Vessel Grid alone should not beat specialised adjacency without a cluster payload.",
  "Brood Nest predator mult must make unarmored nest+3 buds negative EV under Predator Front.",
  "Bait Hunt + Sensor Hunt stacked still lose to Membrane under sustained predatorPressure > 0.7.",
  "Catalyst Spike without waste sink should soft-lock energy within ~30s of warm_ebb.",
  "Silent Reef must lose hard once tentacle count > 0 (identity break).",
  "Overveil at 4+ membranes should be worse than 2 membranes for net nutrient+energy.",
  "Novelty Engine under static bright env must underproduce genetic vs a roaming sensor build.",
  "Red Tide without any waste sink should still soft-lock despite reduced waste penalty.",
  "Core–Fringe mixed penalty must make accidental mixing worse than never splitting.",
] as const;

export interface ComboChain {
  id: string;
  name: string;
  steps: string[];
  payoff: string;
  failureMode: string;
}

/** Multi-step discovery arcs for journal / midgame */
export const COMBO_CHAINS: ComboChain[] = [
  {
    id: "loop_then_guard",
    name: "Loop → Guard",
    steps: ["waste_loop", "dual_symbiont", "guest_guard"],
    payoff: "Storm-proof recycled core that feeds tenants first.",
    failureMode: "Nutrient tithe starves absorbers; need filter rim or lean phase to refill.",
  },
  {
    id: "hunt_then_cloud",
    name: "Hunt → Cloud",
    steps: ["sensor_hunt", "bait_hunt", "red_tide"],
    payoff: "Predation snowball that weaponises waste.",
    failureMode: "Photo and silent paths collapse; Predator Front without membrane ends the run.",
  },
  {
    id: "grid_then_split",
    name: "Grid → Split",
    steps: ["vessel_grid", "hunt_grid", "core_fringe"],
    payoff: "Specialised body plan with photo/waste core and kill rim.",
    failureMode: "Mixing tags cancels the split; anoxic events demand fringe ferment backup.",
  },
  {
    id: "bloom_then_ferry",
    name: "Bloom → Ferry",
    steps: ["colonial_bloom", "brood_nest", "spawn_ferry"],
    payoff: "Fast daughters that don't smother — if shear arrives.",
    failureMode: "Nest predator spike during Predator Front; no vessels → crowd tax.",
  },
  {
    id: "vault_the_weather",
    name: "Vault the Weather",
    steps: ["sensor_hunt", "spore_pressure", "novelty_engine"],
    payoff: "Genetic engine that loves phase changes and fronts.",
    failureMode: "Camping bright flood starves novelty; rivalry with colonial bloom.",
  },
  {
    id: "still_survival",
    name: "Still Survival",
    steps: ["lean_recycle", "silent_reef", "lean_armor"],
    payoff: "Thin-soup fortress without teeth.",
    failureMode: "Rich plume + overveil = missed feast and blind filters.",
  },
];
