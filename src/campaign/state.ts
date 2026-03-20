import type { FactionDef, GameState } from '../types.ts';

/** Utility: pick random element from array */
export const P = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!;
/** Utility: random int in [a, b) */
export const ri = (a: number, b: number): number => Math.floor(a + Math.random() * (b - a));
/** Utility: shuffle array */
export const S = <T>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);
/** Utility: clamp */
export const C = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
/** Utility: format number */
export const F = (n: number): string => Math.ceil(Math.max(0, n)).toLocaleString();

export function freshState(f: FactionDef): GameState {
  return {
    mode: 'campaign',
    f: { ...f },
    mx: 1000,
    cs: 1000,
    gold: 100,
    pAtk: 0,
    pDef: 0,
    pDM: 0,
    pDg: 0,
    ls: false,
    bGene: false,
    mom: false,
    fort: false,
    regen: 0,
    recr: 0,
    scav: 0,
    bSpd: 0,
    skills: [],
    heroes: [],
    bn: 0,
    tk: 0,
    act: 1,
  };
}

export function freshSandboxState(): GameState {
  return {
    mode: 'sandbox',
    f: null as unknown as FactionDef,
    heroes: [],
    skills: [],
    bn: 0,
    tk: 0,
    act: 1,
    gold: 0,
    mx: 0,
    cs: 0,
    pAtk: 0,
    pDef: 0,
    pDM: 0,
    pDg: 0,
    ls: false,
    bGene: false,
    mom: false,
    fort: false,
    regen: 0,
    recr: 0,
    scav: 0,
    bSpd: 0,
  };
}

/** Mutable game state — the single source of truth */
export let G: GameState = freshSandboxState();

export function setGameState(state: GameState): void {
  G = state;
}

export function getGameState(): GameState {
  return G;
}
