import type { EnemyDef, FactionDef } from '../types.ts';
import { FACTIONS } from '../factions/index.ts';
import { getGameState } from './state.ts';
import { P, C, F } from './state.ts';
import { showScreen } from '../ui/screens.ts';
import { setMusicMode } from '../audio/engine.ts';

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
    <div style="font-size:.5rem;color:var(--muted);margin-top:3px">ATK ${G.f.atk + G.pAtk} · DEF ${G.f.def + G.pDef} · SPD ${G.f.spd + (G.bSpd || 0)}${G.pDM > 0 ? ' · DMG ×' + (1 + G.pDM).toFixed(1) : ''}${G.pDg > 0 ? ' · DODGE ' + (G.pDg * 100).toFixed(0) + '%' : ''}</div>
    <div class="heroes">${hh}</div>${sk ? '<div class="sk-wrap">' + sk + '</div>' : ''}`;
}

function renderEnc(): void {
  const G = getGameState();
  const el = document.getElementById('enc-grid')!;
  el.innerHTML = '';
  const isBoss = (G.bn + 1) % 4 === 0;

  if (isBoss) {
    const b = pickEnemy(true);
    el.appendChild(mkEnc('boss', 'BOSS BATTLE', `${b.emoji} ${b.name} — ${F(b.size)} troops`, '💰 80-150 gold reward', b));
  } else {
    const opts: { t: string; d?: EnemyDef }[] = [];
    opts.push({ t: 'battle', d: pickEnemy(false) });
    if (Math.random() < 0.4 && G.bn > 0) opts.push({ t: 'rest' }); else opts.push({ t: 'battle', d: pickEnemy(false) });
    if (Math.random() < 0.3 && G.bn > 1) opts.push({ t: 'event' }); else opts.push({ t: 'battle', d: pickEnemy(false) });
    if (!opts.some(o => o.t === 'battle')) opts[0] = { t: 'battle', d: pickEnemy(false) };

    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    shuffled.forEach(o => {
      if (o.t === 'battle') el.appendChild(mkEnc('battle', 'BATTLE', `${o.d!.emoji} ${o.d!.name} — ${F(o.d!.size)}`, '💰 30-80 gold + upgrade', o.d!));
      else if (o.t === 'rest') el.appendChild(mkEnc('rest', 'REST STOP', 'Your army finds shelter.', 'Spend gold to recover.'));
      else el.appendChild(mkEnc('event', '??? EVENT', 'Something stirs...', 'Unknown outcome.'));
    });
  }
}

// Lazy-imported to avoid circular dependency
let _showPre: ((enemy: EnemyDef) => void) | null = null;
let _showRest: (() => void) | null = null;
let _showEvent: (() => void) | null = null;

export function registerMapCallbacks(
  showPre: (enemy: EnemyDef) => void,
  showRest: () => void,
  showEvent: () => void,
): void {
  _showPre = showPre;
  _showRest = showRest;
  _showEvent = showEvent;
}

function mkEnc(type: string, title: string, desc: string, reward: string, eData?: EnemyDef): HTMLDivElement {
  const c = document.createElement('div');
  c.className = `ec ${type}`;
  c.innerHTML = `<div class="et">${title}</div><div class="ed">${desc}</div><div class="er">${reward}</div>`;
  c.onclick = () => {
    if (type === 'battle' || type === 'boss') _showPre?.(eData!);
    else if (type === 'rest') _showRest?.();
    else _showEvent?.();
  };
  return c;
}

export function pickEnemy(boss: boolean): EnemyDef {
  const G = getGameState();
  const av = FACTIONS.filter(f => f.id !== G.f.id);
  const f = { ...P(av) } as FactionDef & { size: number; isBoss: boolean };
  const sc = 1 + G.bn * 0.2 + (G.act - 1) * 0.15;
  let sz = Math.round(G.mx * (0.7 + Math.random() * 0.6) * sc);
  if (boss) sz = Math.round(sz * 1.5);
  sz = C(sz, 200, 50000);
  const sb = Math.floor(G.bn * 3 + (boss ? 15 : 0));
  f.atk += sb;
  f.def += sb;
  return { ...f, size: sz, isBoss: boss };
}
