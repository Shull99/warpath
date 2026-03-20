# Copilot Instructions — WARPATH

## Project Overview

WARPATH is a tactical roguelike battle simulator built with **TypeScript + Vite**. It features campaign mode (12 battles with permadeath), sandbox mode (pick both sides), faction-specific particle animations, a Web Audio synthesizer for music/SFX, and a tactical combat system with real-time decisions.

The game was intentionally split into small, single-responsibility modules (50–150 lines each) to enable effective AI-assisted development. Each file can be understood in isolation with `types.ts` as the shared contract.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Bundler:** Vite 6
- **Runtime:** Browser (DOM + Canvas 2D + Web Audio API)
- **No frameworks** — vanilla DOM manipulation, no React/Vue/Angular
- **No external runtime dependencies** — everything is generated in-browser (audio is synthesized, graphics are canvas particles)

## Build & Dev Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Project Structure

```
warpath/
  src/
    main.ts              — Entry point, screen routing, orchestrates all modules
    types.ts             — Shared interfaces (THE contract everything works against)
    audio/
      engine.ts          — AudioContext init, sfx(), toggleAudio(), music start/stop
      tracks.ts          — Pentatonic scale, bass patterns, pad frequencies, tempos
    battle/
      engine.ts          — Battle round loop, damage calculation, win/loss logic
      tactics.ts         — Rally/Brace/Special button bar with cooldowns
      renderer.ts        — Canvas 2D draw loop (particles, projectiles, flashes)
      particles.ts       — Faction-specific particle formations, movement, projectiles
    campaign/
      state.ts           — GameState singleton, freshState(), utility functions (P, S, C, F, ri)
      map.ts             — Campaign map screen, encounter generation, army display
      rewards.ts         — Post-battle skill selection screen
      events.ts          — Random events (Deserters, Plague, Mercenary, etc.) and rest stops
    factions/
      index.ts           — 10 faction definitions (stats, specials, flavor text, warrior names)
      behaviors.ts       — Particle behavior configs (aggression, speed, formation type)
      skills.ts          — 30 skills, 4 hero perks, combo name generator
    ui/
      screens.ts         — showScreen() — hides all .screen elements, shows target
      components.ts      — Reusable HTML builders (statRow, tagSpan)
  index.html             — DOM structure (screens as div.screen elements)
  style.css              — All CSS (variables, screen layouts, battle HUD, animations)
  vite.config.ts         — Vite configuration
  tsconfig.json          — TypeScript strict config
```

## Architecture Patterns

### Module Dependency Flow

```
types.ts ← (no imports, everything depends on this)
  ↑
factions/{index,behaviors,skills}.ts ← (data-only, import types)
audio/tracks.ts ← (constants only, no imports)
  ↑
audio/engine.ts ← (imports tracks)
campaign/state.ts ← (imports types, exports G + utilities)
ui/{screens,components}.ts ← (no game imports, pure DOM helpers)
  ↑
campaign/{map,rewards,events}.ts ← (import state, factions, audio, ui)
battle/{particles,renderer,tactics}.ts ← (import factions, audio)
battle/engine.ts ← (imports everything in battle/, campaign/state, factions)
  ↑
main.ts ← (imports everything, orchestrates the game)
```

### Circular Dependency Avoidance

Modules that would create circular imports use a **callback registration pattern**:

```typescript
// In campaign/map.ts — declares nullable callback slots
let _showPre: ((enemy: EnemyDef) => void) | null = null;
export function registerMapCallbacks(showPre, showRest, showEvent) { ... }

// In main.ts — registers actual implementations at startup
registerMapCallbacks(showPre, showRest, showEvent);
registerRewardCallback(() => showMap());
registerEventCallback(handleProgressDone);
```

Three modules use this pattern: `campaign/map.ts`, `campaign/rewards.ts`, `campaign/events.ts`.

### Global State

The single source of truth is `G: GameState` in `campaign/state.ts`, accessed via `getGameState()` and `setGameState()`. Battle-specific mutable state lives in `battle/engine.ts` (battleSpeed, battleActive, tacState) and `battle/particles.ts` (particles, projs, flashes).

### HTML ↔ TypeScript Bridge

HTML `onclick` attributes call functions exposed on `window` by `main.ts`:

```typescript
(window as unknown as Record<string, unknown>).startCampaign = startCampaign;
```

Dynamically created elements use direct `.onclick` handlers.

## Key Interfaces (types.ts)

| Interface | Purpose | Key Fields |
|-----------|---------|------------|
| `FactionDef` | Faction template | `id, name, emoji, atk, def, spd, morale, special, sFn` |
| `BattleSide` | Runtime battle state per side | `ss (start size), cs (current), tAtk/tDef (temp bonuses), eDmg, dg` |
| `GameState` | Campaign progress | `f (faction), mx, cs, gold, skills[], heroes[], bn (battle#)` |
| `EnemyDef` | Enemy extends FactionDef | `size, isBoss` |
| `Skill` | Acquirable skill | `n (name), d (desc), t (type), fn (apply callback)` |
| `HeroPerk` | Hero ability | `n, d, fn (apply to GameState)` |
| `Stance` | Pre-battle formation | `id, n, d, ap (apply to BattleSide)` |
| `Particle` | Canvas dot | `tm (team), fid (faction), al (alive), x, y, vx, vy` |
| `ParticleBehavior` | Faction visual style | `aggr, spread, spd, erratic, formation, ranged, projRate` |

## Common Tasks & Which Files to Edit

### Add a new faction
1. **`factions/index.ts`** — Add entry to `FACTIONS` array and `WARRIOR_NAMES`
2. **`factions/behaviors.ts`** — Add particle behavior to `BEHAVIORS`
3. **`types.ts`** — No changes needed (generic interfaces)

### Add a new skill
1. **`factions/skills.ts`** — Add entry to `SKILLS` array

### Change damage formula
1. **`battle/engine.ts`** — Edit `cDmg()` function

### Add a new battle tactic
1. **`battle/tactics.ts`** — Add button in `buildTacticsBar()`
2. **`battle/engine.ts`** — Handle new tactic in tick loop

### Add a new event
1. **`campaign/events.ts`** — Add entry to `makeEvents()` return array

### Add a new screen
1. **`index.html`** — Add `<div class="screen" id="new-screen">` markup
2. **`style.css`** — Add styles
3. **`ui/screens.ts`** — No changes needed (`showScreen()` is generic)
4. **`main.ts`** — Add routing logic and expose handlers on `window`

### Change music/SFX
1. **`audio/tracks.ts`** — Edit scale, bass patterns, pad frequencies, tempos
2. **`audio/engine.ts`** — Edit `sfx()` for new sound effects, `startMusic()` for generation

### Modify particle visuals
1. **`factions/behaviors.ts`** — Tune aggression, speed, formation, projectile rate
2. **`battle/particles.ts`** — Edit movement logic, formations, projectile behavior
3. **`battle/renderer.ts`** — Edit canvas drawing (colors, glow, sizes)

## Coding Conventions

- **No comments** unless explaining complex logic — the code is self-documenting
- **Short variable names** in battle math (sA/sB for sides, tAtk/tDef for temp bonuses) — matches original game style
- **Descriptive exports** — public API uses full names (`showMap`, `freshTacticalState`, `initParticles`)
- **Type imports** use `import type` where possible
- **Skill/Perk callbacks** use `fn: (state) => void` pattern — mutate the passed state directly
- **DOM manipulation** is direct (`document.getElementById`, `element.innerHTML`) — no virtual DOM
- **CSS classes** are terse (`.fc`, `.ec`, `.sc`, `.rc`) matching the original compact style
- **All audio is synthesized** — no asset files, pure Web Audio API oscillators

## Game Flow Summary

```
Title Screen
  ├── Campaign → Faction Select → Map (12 battles)
  │     ├── Battle → Pre-battle (stance) → Battle Engine → Reward (skill)
  │     ├── Rest Stop → Spend gold to heal/recruit/train
  │     ├── Random Event → Choose consequence
  │     └── Boss (every 4th) → Battle → Reward
  │     └── After 12 battles → Victory Screen
  │     └── Army dies → Game Over Screen
  └── Sandbox → Pick 2 factions + sizes → Battle → Results
```

## Important Notes

- **No test framework** is set up — the game is validated by playing it
- **No external assets** — fonts loaded from Google Fonts CDN, everything else generated
- The original `warpath.html` is preserved in the repo as reference
- Battle speed can be 1×/2×/3× (1100ms/550ms/280ms per round)
- Maximum 100 rounds per battle, then the side with more troops wins
