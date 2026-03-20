import type { TDEnemy, TDState } from '../types.ts';

export const TD_PATH: { x: number; y: number }[] = [
  { x: 0,   y: 150 },
  { x: 130, y: 150 },
  { x: 130, y: 60  },
  { x: 310, y: 60  },
  { x: 310, y: 240 },
  { x: 490, y: 240 },
  { x: 490, y: 130 },
  { x: 600, y: 130 },
];

const BASE_WAVE_SIZE = 5;
const WAVE_SIZE_MULT = 2;
const MIN_SPAWN_INTERVAL = 0.7;
const BASE_SPAWN_INTERVAL = 2.5;
const SPAWN_INTERVAL_SCALE = 0.12;
const BASE_ENEMY_HP = 2;
const BASE_ENEMY_SPD = 50;
const SPD_PER_WAVE = 8;

let state: TDState = makeFresh();
let nextId = 0;
let _onHit: ((hp: number) => void) | null = null;
let _onOver: (() => void) | null = null;

function makeFresh(): TDState {
  return {
    castleHp: 20, maxCastleHp: 20,
    enemies: [], wave: 1,
    spawnTimer: 0, spawnCount: 0,
    active: false, debugOverlay: false,
  };
}

export function getTDState(): TDState { return state; }

export function startTD(): void {
  state = makeFresh();
  nextId = 0;
  state.active = true;
  console.log('[TD] Tower Defense started. Castle HP:', state.castleHp, '/', state.maxCastleHp);
}

export function registerTDCallbacks(onHit: (hp: number) => void, onOver: () => void): void {
  _onHit = onHit;
  _onOver = onOver;
}

export function toggleTDDebug(): void {
  state.debugOverlay = !state.debugOverlay;
  console.log('[TD] Debug overlay:', state.debugOverlay ? 'ON' : 'OFF');
}

const waveSize = (w: number) => BASE_WAVE_SIZE + w * WAVE_SIZE_MULT;
const spawnInterval = (w: number) => Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - w * SPAWN_INTERVAL_SCALE);

function spawnEnemy(): void {
  const p0 = TD_PATH[0]!;
  const e: TDEnemy = {
    id: nextId++, pathIdx: 0, prog: 0,
    x: p0.x, y: p0.y,
    hp: BASE_ENEMY_HP + state.wave, maxHp: BASE_ENEMY_HP + state.wave,
    spd: BASE_ENEMY_SPD + state.wave * SPD_PER_WAVE,
    alive: true, dmg: 1,
  };
  state.enemies.push(e);
  console.log(`[TD] Enemy #${e.id} spawned — wave ${state.wave}, spd ${e.spd}, hp ${e.hp}`);
}

function moveEnemy(e: TDEnemy, dt: number): boolean {
  let dist = e.spd * dt;
  while (dist > 0) {
    const nxt = e.pathIdx + 1;
    if (nxt >= TD_PATH.length) {
      e.x = TD_PATH[TD_PATH.length - 1]!.x;
      e.y = TD_PATH[TD_PATH.length - 1]!.y;
      return true;
    }
    const from = TD_PATH[e.pathIdx]!;
    const to = TD_PATH[nxt]!;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    const remaining = segLen * (1 - e.prog);
    if (dist >= remaining) {
      dist -= remaining;
      e.pathIdx = nxt;
      e.prog = 0;
    } else {
      e.prog += dist / segLen;
      dist = 0;
    }
  }
  const nxt = e.pathIdx + 1;
  if (nxt < TD_PATH.length) {
    const f = TD_PATH[e.pathIdx]!;
    const t = TD_PATH[nxt]!;
    e.x = f.x + (t.x - f.x) * e.prog;
    e.y = f.y + (t.y - f.y) * e.prog;
  }
  return false;
}

export function tdTick(dt: number): void {
  if (!state.active) return;

  const ws = waveSize(state.wave);
  state.spawnTimer += dt;
  if (state.spawnTimer >= spawnInterval(state.wave) && state.spawnCount < ws) {
    spawnEnemy();
    state.spawnTimer = 0;
    state.spawnCount++;
  }

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (moveEnemy(e, dt)) {
      e.alive = false;
      state.castleHp = Math.max(0, state.castleHp - e.dmg);
      console.log(`[TD] Enemy #${e.id} reached the castle! Castle HP: ${state.castleHp}/${state.maxCastleHp}`);
      if (_onHit) _onHit(state.castleHp);
      if (state.castleHp <= 0 && state.active) {
        state.active = false;
        console.log('[TD] Castle destroyed! Game over.');
        if (_onOver) _onOver();
      }
    }
  }

  state.enemies = state.enemies.filter(e => e.alive);

  if (state.spawnCount >= ws && state.enemies.length === 0) {
    state.wave++;
    state.spawnCount = 0;
    state.spawnTimer = 0;
    console.log(`[TD] Wave ${state.wave} starting!`);
  }
}
