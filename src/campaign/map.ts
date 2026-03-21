import type { EnemyDef, FactionDef } from '../types.ts';
import { FACTIONS } from '../factions/index.ts';
import { getGameState } from './state.ts';
import { P, C, F } from './state.ts';
import { showScreen } from '../ui/screens.ts';
import { setMusicMode, sfx } from '../audio/engine.ts';

/** Navigate to the map screen and render army + encounters */
export function showMap(): void {
  const G = getGameState();
  showScreen('map-screen');
  setMusicMode('menu');

  G.act = Math.ceil((G.bn + 1) / 4);
  document.getElementById('m-act')!.textContent = String(G.act);
  document.getElementById('m-bat')!.textContent = String(G.bn + 1);
  document.getElementById('m-gold')!.textContent = String(G.gold);
  document.getElementById('m-kills')!.textContent = F(G.tk);
  renderArmy();
  renderWarCouncil();
  renderEnc();
}

function renderArmy(): void {
  const G = getGameState();
  const el = document.getElementById('abox')!;
  const pct = G.cs / G.mx * 100;
  const hh = G.heroes.map(h =>
    `<div class="hr"><span class="hn${h.alive ? '' : ' hd'}">${h.alive ? '⭐' : '💀'} ${h.name}</span><span class="hp">${h.perk.n}: ${h.perk.d}</span></div>`
  ).join('');
  const sk = G.skills.map(s => `<span class="sk" data-tip="${s.d}">${s.n}</span>`).join('');
  el.innerHTML = `<div class="an">${G.f.emoji} ${G.f.name.toUpperCase()}</div>
    <div class="hprow"><div class="hpbar"><div class="hpfill" style="width:${pct}%"></div></div><div class="hptxt">${F(G.cs)} / ${F(G.mx)}</div></div>
    <div class="army-stats">
      <span class="stat-chip atk">⚔ ATK ${G.f.atk + G.pAtk}</span>
      <span class="stat-chip def">🛡 DEF ${G.f.def + G.pDef}</span>
      <span class="stat-chip spd">⚡ SPD ${G.f.spd + (G.bSpd || 0)}</span>
      ${G.pDM > 0 ? `<span class="stat-chip dmg">💥 DMG ×${(1 + G.pDM).toFixed(1)}</span>` : ''}
      ${G.pDg > 0 ? `<span class="stat-chip dge">👻 DODGE ${(G.pDg * 100).toFixed(0)}%</span>` : ''}
    </div>
    <div class="heroes">${hh}</div>${sk ? '<div class="sk-wrap">' + sk + '</div>' : ''}`;
}

function renderWarCouncil(): void {
  const G = getGameState();
  const el = document.getElementById('wcouncil')!;
  el.innerHTML = '';
  const hAmt = Math.max(1, Math.floor(G.mx * 0.2));
  const rAmt = Math.max(1, Math.floor(G.mx * 0.12));
  const opts = [
    { n: '🏥 HEAL', d: `+${F(hAmt)} troops`, cost: 30, fn: () => { G.cs = Math.min(G.mx, G.cs + hAmt); } },
    { n: '📯 RECRUIT', d: `+${F(rAmt)} troops & max`, cost: 50, fn: () => { G.mx += rAmt; G.cs += rAmt; } },
    { n: '⚔ TRAIN', d: '+5 ATK, +5 DEF', cost: 40, fn: () => { G.pAtk += 5; G.pDef += 5; } },
    { n: '🔨 FORGE', d: 'Dmg ×1.15', cost: 60, fn: () => { G.pDM += 0.15; } },
  ];
  opts.forEach(o => {
    const locked = G.gold < o.cost;
    const b = document.createElement('button');
    b.className = 'wc-btn' + (locked ? ' locked' : '');
    b.innerHTML = `<span class="wc-name">${o.n}</span><span class="wc-desc">${o.d}</span><span class="wc-cost">💰${o.cost}</span>`;
    if (!locked) {
      b.onclick = () => {
        G.gold -= o.cost;
        o.fn();
        sfx('gold');
        renderArmy();
        renderWarCouncil();
        document.getElementById('m-gold')!.textContent = String(G.gold);
      };
    }
    el.appendChild(b);
  });
}

function difficultyLabel(enemy: EnemyDef): string {
  const G = getGameState();
  const ratio = enemy.size / G.cs;
  if (ratio < 0.6) return '<span class="diff easy">EASY</span>';
  if (ratio < 0.9) return '<span class="diff medium">MEDIUM</span>';
  if (ratio < 1.3) return '<span class="diff hard">HARD</span>';
  return '<span class="diff deadly">DEADLY</span>';
}

function renderEnc(): void {
  const G = getGameState();
  const el = document.getElementById('enc-grid')!;
  el.innerHTML = '';
  const isBoss = (G.bn + 1) % 4 === 0;

  if (isBoss) {
    const b = pickEnemy(true);
    const goldRange = `${Math.floor(60 + b.size * 0.3)}-${Math.floor(100 + b.size * 0.5)}`;
    el.appendChild(mkEnc('boss', 'BOSS BATTLE', `${b.emoji} ${b.name} — ${F(b.size)} troops ${difficultyLabel(b)}`, `💰 ~${goldRange} gold reward`, b));
  } else {
    const opts: { t: string; d?: EnemyDef }[] = [];
    opts.push({ t: 'battle', d: pickEnemy(false) });

    const r2 = Math.random();
    if (r2 < 0.3 && G.bn > 0) opts.push({ t: 'rest' });
    else if (r2 < 0.5 && G.bn > 0) opts.push({ t: 'recruit' });
    else opts.push({ t: 'battle', d: pickEnemy(false) });

    const r3 = Math.random();
    if (r3 < 0.3 && G.bn > 1) opts.push({ t: 'event' });
    else if (r3 < 0.45) opts.push({ t: 'scout', d: pickEnemy(false) });
    else opts.push({ t: 'battle', d: pickEnemy(false) });

    if (!opts.some(o => o.t === 'battle')) opts[0] = { t: 'battle', d: pickEnemy(false) };

    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    shuffled.forEach(o => {
      if (o.t === 'battle') {
        const goldRange = `${Math.floor(20 + o.d!.size * 0.2)}-${Math.floor(40 + o.d!.size * 0.4)}`;
        el.appendChild(mkEnc('battle', 'BATTLE', `${o.d!.emoji} ${o.d!.name} — ${F(o.d!.size)} ${difficultyLabel(o.d!)}`, `💰 ~${goldRange} gold + skill`, o.d!));
      } else if (o.t === 'rest') {
        el.appendChild(mkEnc('rest', 'REST STOP', 'Your army finds shelter.', 'Spend gold to heal & upgrade'));
      } else if (o.t === 'recruit') {
        el.appendChild(mkEnc('recruit', 'WANDERING WARBAND', 'Displaced soldiers seek a leader.', 'Recruit troops for gold'));
      } else if (o.t === 'scout') {
        el.appendChild(mkEnc('scout', 'SCOUT REPORT', `Intel on ${o.d!.emoji} ${o.d!.name}`, 'Prepare before engaging', o.d!));
      } else {
        el.appendChild(mkEnc('event', '??? EVENT', 'Something stirs...', 'Unknown outcome'));
      }
    });
  }
}

// Lazy-imported to avoid circular dependency
let _showPre: ((enemy: EnemyDef) => void) | null = null;
let _showRest: (() => void) | null = null;
let _showEvent: (() => void) | null = null;
let _showRecruit: (() => void) | null = null;
let _showScout: ((enemy: EnemyDef) => void) | null = null;

export function registerMapCallbacks(
  showPre: (enemy: EnemyDef) => void,
  showRest: () => void,
  showEvent: () => void,
  showRecruit?: () => void,
  showScout?: (enemy: EnemyDef) => void,
): void {
  _showPre = showPre;
  _showRest = showRest;
  _showEvent = showEvent;
  if (showRecruit) _showRecruit = showRecruit;
  if (showScout) _showScout = showScout;
}

function mkEnc(type: string, title: string, desc: string, reward: string, eData?: EnemyDef): HTMLDivElement {
  const c = document.createElement('div');
  c.className = `ec ${type}`;
  c.innerHTML = `<div class="et">${title}</div><div class="ed">${desc}</div><div class="er">${reward}</div>`;
  c.onclick = () => {
    if (type === 'battle' || type === 'boss') _showPre?.(eData!);
    else if (type === 'rest') _showRest?.();
    else if (type === 'recruit') _showRecruit?.();
    else if (type === 'scout') _showScout?.(eData!);
    else _showEvent?.();
  };
  return c;
}

export function pickEnemy(boss: boolean): EnemyDef {
  const G = getGameState();
  const av = FACTIONS.filter(f => f.id !== G.f.id);
  const f = { ...P(av) } as FactionDef & { size: number; isBoss: boolean };
  const sc = 1 + G.bn * 0.15 + (G.act - 1) * 0.1;
  let sz = Math.round(G.mx * (0.6 + Math.random() * 0.5) * sc);
  if (boss) sz = Math.round(sz * 1.4);
  sz = C(sz, 20, 5000);
  const sb = Math.floor(G.bn * 2 + (boss ? 10 : 0));
  f.atk += sb;
  f.def += sb;
  return { ...f, size: sz, isBoss: boss };
}
