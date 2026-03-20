// ── Shared interfaces for the entire Warpath game ──

export interface FactionDef {
  id: string;
  name: string;
  emoji: string;
  atk: number;
  def: number;
  spd: number;
  morale: number;
  special: string;
  spDesc: string;
  sFn: (self: BattleSide, enemy?: BattleSide) => void;
  fl: string[];
}

export interface ParticleBehavior {
  aggr: number;
  spread: number;
  spd: number;
  erratic: number;
  ranged: boolean;
  projRate?: number;
  pSize: number;
  formation: string;
  charge?: boolean;
  teleport?: boolean;
}

export interface Skill {
  n: string;
  d: string;
  t: string;
  fn: (self: GameState, enemy?: GameState) => void;
}

export interface HeroPerk {
  n: string;
  d: string;
  fn: (state: GameState) => void;
}

export interface Hero {
  name: string;
  perk: HeroPerk;
  alive: boolean;
}

export interface GameState {
  mode: string;
  f: FactionDef;
  mx: number;
  cs: number;
  gold: number;
  pAtk: number;
  pDef: number;
  pDM: number;
  pDg: number;
  ls: boolean;
  bGene: boolean;
  mom: boolean;
  fort: boolean;
  regen: number;
  recr: number;
  scav: number;
  bSpd: number;
  skills: { n: string; d: string; t: string }[];
  heroes: Hero[];
  bn: number;
  tk: number;
  act: number;
}

export interface BattleSide {
  [key: string]: unknown;
  id: string;
  name: string;
  emoji: string;
  atk: number;
  def: number;
  spd: number;
  morale: number;
  special: string;
  spDesc: string;
  sFn: (self: BattleSide, enemy?: BattleSide) => void;
  fl: string[];
  ss: number;
  cs: number;
  tAtk: number;
  tDef: number;
  eDmg: number;
  dg: number;
  pAtk: number;
  pDef: number;
  pDM: number;
  pDg: number;
  ls: boolean;
  bGene: boolean;
  mom: boolean;
  fort: boolean;
  bSpd: number;
  gSpec: boolean;
  _tr: number;
  _rr: number;
  regen?: number;
  scav?: number;
  recr?: number;
}

export interface EnemyDef extends FactionDef {
  size: number;
  isBoss: boolean;
}

export interface Stance {
  id: string;
  n: string;
  d: string;
  ap: (side: BattleSide) => void;
}

export interface Particle {
  tm: 'a' | 'b';
  fid: string;
  al: boolean;
  op: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sz: number;
  fr: number;
}

export interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  tm: string;
  life: number;
  spd: number;
  col: string;
}

export interface Flash {
  x: number;
  y: number;
  r: number;
  l: number;
  ml: number;
  c: string;
}

export interface RandomEvent {
  t: string;
  tx: string;
  ch: { l: string; fn: () => void }[];
}

export interface TDEnemy {
  id: number;
  pathIdx: number;
  prog: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  spd: number;
  alive: boolean;
  dmg: number;
}

export interface TDState {
  castleHp: number;
  maxCastleHp: number;
  enemies: TDEnemy[];
  wave: number;
  spawnTimer: number;
  spawnCount: number;
  active: boolean;
  debugOverlay: boolean;
}
