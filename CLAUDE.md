# CLAUDE.md — WARPATH

## What is this project?

WARPATH is a tactical roguelike battle simulator — a browser game built with TypeScript + Vite. No frameworks, no external runtime dependencies. Audio is synthesized via Web Audio API, visuals are Canvas 2D particles, UI is vanilla DOM.

## Quick Start

```bash
npm install          # Install dev dependencies (TypeScript, Vite)
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Type-check + production build to dist/
npm run preview      # Serve production build locally
```

## Repository Layout

```
warpath/
├── index.html               # DOM structure — screens as <div class="screen"> elements
├── style.css                # All CSS — variables, layouts, battle HUD, animations
├── warpath.html             # ORIGINAL monolithic file (preserved as reference)
├── package.json             # Vite + TypeScript dev deps only
├── tsconfig.json            # Strict TypeScript, ES2020 target, bundler resolution
├── vite.config.ts           # Minimal Vite config
└── src/
    ├── main.ts              # Entry point — screen routing, game flow orchestration
    ├── types.ts             # ALL shared interfaces — the contract everything works against
    ├── audio/
    │   ├── engine.ts        # Web Audio: init, toggle, sfx(), music start/stop
    │   └── tracks.ts        # Constants: pentatonic scale, bass patterns, pad freqs, tempos
    ├── battle/
    │   ├── engine.ts        # Round loop, damage calc (cDmg), win/loss, battle flow
    │   ├── tactics.ts       # Tactical UI bar: Rally, Brace, Special + speed controls
    │   ├── renderer.ts      # Canvas draw loop: particles, projectiles, flashes
    │   └── particles.ts     # Particle init/step/kill/revive, faction formations
    ├── campaign/
    │   ├── state.ts         # GameState singleton (G), freshState(), utilities (P, S, C, F, ri)
    │   ├── map.ts           # Map screen: army display, encounter generation
    │   ├── rewards.ts       # Post-battle: 3 random skill cards, claim logic
    │   └── events.ts        # Random events (7 types) + rest stop (4 options)
    ├── factions/
    │   ├── index.ts         # 10 factions: stats, specials, flavor text, warrior names
    │   ├── behaviors.ts     # Particle configs: aggression, speed, formation per faction
    │   └── skills.ts        # 30 skills, 4 hero perks, combo name generator
    └── ui/
        ├── screens.ts       # showScreen(id) — hide all, show one
        └── components.ts    # Reusable HTML: statRow(), tagSpan()
```

## Architecture Overview

### Module Dependency Graph (top = no deps, bottom = imports most)

```
Layer 0 (no src/ imports):  types.ts, audio/tracks.ts, ui/screens.ts, ui/components.ts
Layer 1 (data only):        factions/index.ts, factions/behaviors.ts, factions/skills.ts
Layer 2 (services):         audio/engine.ts, campaign/state.ts
Layer 3 (features):         battle/particles.ts, battle/renderer.ts, battle/tactics.ts
                            campaign/map.ts, campaign/rewards.ts, campaign/events.ts
Layer 4 (orchestration):    battle/engine.ts
Layer 5 (entry):            main.ts
```

### Circular Dependency Avoidance

`main.ts` needs to call functions in campaign modules, and campaign modules need to call back into `main.ts` for screen transitions. This is solved with a **callback registration pattern**:

```typescript
// campaign/map.ts — declares nullable slots
let _showPre: ((enemy: EnemyDef) => void) | null = null;
export function registerMapCallbacks(showPre, showRest, showEvent) { ... }

// main.ts — registers real implementations at startup
registerMapCallbacks(showPre, showRest, showEvent);
registerRewardCallback(() => showMap());
registerEventCallback(handleProgressDone);
```

Used in: `campaign/map.ts`, `campaign/rewards.ts`, `campaign/events.ts`.

### State Management

**Single mutable `GameState`** in `campaign/state.ts`:
- Access: `getGameState()` / `setGameState()`
- Contains: faction, army size, gold, skills, heroes, battle number, permanent bonuses

**Battle state** in `battle/engine.ts`: `battleSpeed`, `battleActive`, `tacState`

**Particle state** in `battle/particles.ts`: `particles[]`, `projs[]`, `flashes[]`

**Audio state** in `audio/engine.ts`: `AudioContext`, gain nodes, oscillator arrays

### HTML ↔ TypeScript Bridge

Functions are exposed on `window` in `main.ts` so HTML `onclick` attributes work:
```typescript
(window as unknown as Record<string, unknown>).startCampaign = startCampaign;
```

## Key Types (types.ts)

```typescript
FactionDef      // {id, name, emoji, atk, def, spd, morale, special, sFn, fl}
BattleSide      // Runtime battle state: {ss, cs, tAtk, tDef, eDmg, dg, pAtk, pDef, ...}
GameState       // Campaign progress: {f, mx, cs, gold, skills, heroes, bn, pAtk, pDef, ...}
EnemyDef        // FactionDef + {size, isBoss}
Skill           // {n, d, t, fn: (self, enemy?) => void}
HeroPerk        // {n, d, fn: (state) => void}
Hero            // {name, perk, alive}
Stance          // {id, n, d, ap: (side) => void}
Particle        // {tm, fid, al, op, x, y, vx, vy, sz, fr}
ParticleBehavior // {aggr, spread, spd, erratic, formation, ranged, projRate, pSize}
Projectile      // {x, y, tx, ty, tm, life, spd, col}
Flash           // {x, y, r, l, ml, c}
RandomEvent     // {t, tx, ch: {l, fn}[]}
```

## Game Flow

```
Title → Campaign → Faction Select → Map Screen (loop 12 times):
  ├── Battle → Stance Select → Battle Engine → Reward (pick 1 of 3 skills)
  ├── Rest Stop → Spend gold (heal/recruit/train/forge)
  ├── Random Event → Choose option
  └── Boss (every 4th battle)
  → Victory (12 battles) or Game Over (army dies)

Title → Sandbox → Pick 2 factions + army sizes → Battle → Results
```

## Damage Formula (battle/engine.ts → `cDmg()`)

```
base = (effective_atk / 100) × min(attacker_troops, defender_troops × 3) × 0.08 × speed_bonus
mitigation = min(0.5, effective_def / 200)
damage = base × (1 - mitigation) × random(0.8..1.2)

Multipliers applied sequentially:
  × (1 + pDM)           if damage skills equipped
  × 2                   if Momentum active (rounds 1-3)
  × 1.6                 if Last Stand (below 30% HP)
  × 2                   if Berserker Gene (below 50% HP)
  × (1 + eDmg)          if extra damage from specials
  × 0.08                if dodge triggered (based on pDg + dg)
```

## How To: Common Tasks

### Add a new faction
1. `factions/index.ts` — Add to `FACTIONS[]` and `WARRIOR_NAMES{}`
2. `factions/behaviors.ts` — Add to `BEHAVIORS{}`
3. That's it. The game automatically renders new factions in all screens.

### Add a new skill
1. `factions/skills.ts` — Add to `SKILLS[]` array with `{n, d, t, fn}`
2. Skills are auto-available as rewards. Debuff-type skills are auto-applied to enemies.

### Add a new event
1. `campaign/events.ts` — Add to array in `makeEvents()`. Each event has a title, text, and choices.

### Modify damage formula
1. `battle/engine.ts` — Edit the `cDmg()` inner function.

### Add a new tactic button
1. `battle/tactics.ts` — Add button creation in `buildTacticsBar()`
2. `battle/tactics.ts` — Add field to `TacticalState` interface
3. `battle/engine.ts` — Handle new tactic in the tick() function

### Add a new screen
1. `index.html` — Add `<div class="screen" id="new-id">` element
2. `style.css` — Add styles
3. `main.ts` — Add logic, expose onclick handlers on `window`

### Change audio
1. `audio/tracks.ts` — Edit scales, bass lines, pad frequencies, tempos
2. `audio/engine.ts` — Edit `sfx()` for new effects, `startMusic()` for music generation

### Change particle visuals
1. `factions/behaviors.ts` — Tune behavior params per faction
2. `battle/particles.ts` — Edit movement/spawning logic
3. `battle/renderer.ts` — Edit canvas drawing code

## Coding Conventions

- **Terse battle-math variables**: `sA`/`sB` (sides), `tAtk`/`tDef` (temp bonuses), `cs` (current strength), `ss` (start strength) — kept from original for consistency
- **Descriptive public API**: `showMap()`, `freshTacticalState()`, `initParticles()`
- **Skill callbacks mutate state directly**: `fn: s => { s.pAtk += 20 }`
- **No comments unless essential** — self-documenting code with clear function names
- **`import type`** for type-only imports
- **Direct DOM manipulation** — `getElementById`, `innerHTML`, `.onclick`
- **All audio synthesized** — no asset files, only Web Audio API oscillators and gain nodes
- **CSS uses terse class names**: `.fc` (faction card), `.ec` (encounter card), `.sc` (stance card), `.rc` (reward card) — matching original style

## Testing

No test framework is configured. The game is validated by running it (`npm run dev`) and playing through campaign and sandbox modes. Type safety is enforced by `tsc --noEmit` (run via `npm run build`).

## Important Gotchas

- `warpath.html` is the original monolithic reference file — don't edit it
- The `dist/` directory is gitignored (build artifact)
- Skills with `fn.length >= 2` take `(self, enemy)` params — those with `fn.length < 2` take only `(self)`
- `GameState` is extended at runtime with hidden `_stance` and `_curEnemy` fields via `as unknown as Record` casts (see `main.ts` → `doEngage()`)
- Battle canvas is fixed at 160px height, width matches container
- Zombie faction's `sFn` has unique revive-the-dead mechanic with a 25% cap
- Maximum 100 battle rounds — then whoever has more troops wins
