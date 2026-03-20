import '../style.css';
import type { BattleSide, EnemyDef, Stance } from './types.ts';
import { FACTIONS, WARRIOR_NAMES } from './factions/index.ts';
import { SKILLS, HERO_PERKS } from './factions/skills.ts';
import { toggleAudio, setMusicMode, sfx, initAudioListeners } from './audio/engine.ts';
import { freshState, freshSandboxState, getGameState, setGameState, S, F, P } from './campaign/state.ts';
import { showScreen } from './ui/screens.ts';
import { statRow } from './ui/components.ts';
import { showMap, registerMapCallbacks } from './campaign/map.ts';
import { showReward, claim, registerRewardCallback } from './campaign/rewards.ts';
import { showEvent, showRest, skipRest, registerEventCallback } from './campaign/events.ts';
import { engage as battleEngage } from './battle/engine.ts';
import { stopAnimLoop } from './battle/renderer.ts';

// ── Module state ──
let selF: typeof FACTIONS[number] | null = null;
let curEnemy: EnemyDef | null = null;
let curStance: Stance | null = null;

// ── Screen routing ──
function toTitle(): void {
  stopAnimLoop();
  showScreen('title-screen');
  setMusicMode('menu');
}

// ── Faction select ──
function startCampaign(): void {
  const el = document.getElementById('fcards')!;
  el.innerHTML = '';
  selF = null;
  FACTIONS.forEach(f => {
    const c = document.createElement('div');
    c.className = 'fc';
    c.innerHTML = `<span class="emoji">${f.emoji}</span><div class="fname">${f.name}</div><div class="fstat">ATK ${f.atk} · DEF ${f.def} · SPD ${f.spd}</div><div class="fsp">✦ ${f.special}: ${f.spDesc}</div>`;
    c.onclick = () => {
      el.querySelectorAll('.fc').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      selF = f;
      (document.getElementById('begin-btn') as HTMLButtonElement).disabled = false;
    };
    el.appendChild(c);
  });
  (document.getElementById('begin-btn') as HTMLButtonElement).disabled = true;
  showScreen('faction-screen');
}

function beginCampaign(): void {
  if (!selF) return;
  setGameState(freshState(selF));
  const G = getGameState();
  const names = S(WARRIOR_NAMES[selF.id] || ['Hero-1', 'Hero-2', 'Hero-3']);
  const perks = S([...HERO_PERKS]);
  for (let i = 0; i < 3; i++) {
    const h = { name: names[i]!, perk: perks[i]!, alive: true };
    G.heroes.push(h);
    perks[i]!.fn(G);
  }
  showMap();
}

// ── Pre-battle ──
function showPre(enemy: EnemyDef): void {
  curEnemy = enemy;
  curStance = null;
  showScreen('prebattle');

  document.getElementById('eprev')!.innerHTML = `${enemy.isBoss ? '<div style="margin-bottom:4px"><span class="tag gold">BOSS</span></div>' : ''}
    <div class="en">${enemy.emoji} ${enemy.name}</div><div class="es">${F(enemy.size)} troops</div>
    <div class="est"><span>ATK <b>${enemy.atk}</b></span><span>DEF <b>${enemy.def}</b></span><span>SPD <b>${enemy.spd}</b></span></div>
    <div style="font-size:.48rem;color:var(--gldim);margin-top:6px">✦ ${enemy.special}: ${enemy.spDesc}</div>`;

  const G = getGameState();
  const g = document.getElementById('sgrid')!;
  g.innerHTML = '';
  const stances: Stance[] = [
    { id: 'agg', n: 'AGGRESSIVE', d: 'ATK +30%, DEF -20%', ap: s => { s.tAtk += Math.round(s.atk * 0.3); s.tDef -= Math.round(s.def * 0.2); } },
    { id: 'def', n: 'DEFENSIVE', d: 'DEF +30%, ATK -20%', ap: s => { s.tDef += Math.round(s.def * 0.3); s.tAtk -= Math.round(s.atk * 0.2); } },
    { id: 'bal', n: 'BALANCED', d: 'No modifiers. Trust the build.', ap: () => { } },
    { id: 'spc', n: 'UNLEASH', d: `Guaranteed ${G.f.special} round 1`, ap: s => { s.gSpec = true; } },
  ];

  stances.forEach(st => {
    const c = document.createElement('div');
    c.className = 'sc';
    c.innerHTML = `<div class="sn">${st.n}</div><div class="sd">${st.d}</div>`;
    c.onclick = () => {
      g.querySelectorAll('.sc').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      curStance = st;
      (document.getElementById('eng-btn') as HTMLButtonElement).disabled = false;
    };
    g.appendChild(c);
  });
  (document.getElementById('eng-btn') as HTMLButtonElement).disabled = true;
}

// ── Engage battle ──
function doEngage(): void {
  const G = getGameState();
  const sA: BattleSide = {
    ...G.f, ss: Math.ceil(G.cs), cs: Math.ceil(G.cs),
    tAtk: 0, tDef: 0, eDmg: 0, dg: 0,
    pAtk: G.pAtk, pDef: G.pDef, pDM: G.pDM, pDg: G.pDg,
    ls: G.ls, bGene: G.bGene, mom: G.mom, fort: G.fort,
    bSpd: G.bSpd || 0, gSpec: false, _tr: 0, _rr: 0,
  };
  const eF = curEnemy!;
  const sB: BattleSide = {
    ...eF, ss: eF.size, cs: eF.size,
    tAtk: 0, tDef: 0, eDmg: 0, dg: 0,
    pAtk: Math.floor(G.bn * 2), pDef: Math.floor(G.bn * 1.5), pDM: G.bn * 0.03, pDg: 0,
    ls: false, bGene: false, mom: false, fort: false,
    bSpd: 0, gSpec: false, _tr: 0, _rr: 0,
  };
  if (curStance) curStance.ap(sA);
  G.skills.filter(s => s.t === 'debuff').forEach(sk => {
    const o = SKILLS.find(p => p.n === sk.n);
    if (o) o.fn(sA as unknown as Parameters<typeof o.fn>[0], sB as unknown as Parameters<typeof o.fn>[1]);
  });

  // Stash context for the battle engine
  (G as unknown as Record<string, unknown>)._stance = curStance;
  (G as unknown as Record<string, unknown>)._curEnemy = curEnemy;

  battleEngage(sA, sB, G.f, eF, handleBattleEnd);
}

function handleBattleEnd(won: boolean, aAlive: number, enemyKilled: number, goldEarned: number): void {
  const G = getGameState();
  if (G.mode === 'sandbox') {
    const log = document.getElementById('blog')!;
    setTimeout(() => {
      const d = document.createElement('div');
      d.className = 'll sys';
      d.style.textAlign = 'center';
      d.style.paddingTop = '8px';
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.cssText = 'font-size:.48rem;padding:5px 10px';
      btn.textContent = '← SANDBOX';
      btn.onclick = startSandbox;
      d.appendChild(btn);
      log.appendChild(d);
    }, 1200);
    return;
  }

  if (!won) { showGameOver(); return; }
  G.cs = aAlive;
  G.tk += enemyKilled;
  G.gold += goldEarned;
  sfx('gold');
  if (G.regen > 0) G.cs = Math.min(G.mx, G.cs + Math.floor(G.mx * G.regen));
  if (G.scav > 0) { const sc = Math.floor(enemyKilled * G.scav); G.cs = Math.min(G.mx, G.cs + sc); }
  if (G.recr > 0) { const r = Math.floor(G.mx * G.recr); G.mx += r; G.cs += r; }
  G.bn++;
  setTimeout(() => {
    if (G.bn >= 12) showVictory();
    else showReward();
  }, 1500);
}

// ── End screens ──
function runStats(): string {
  const G = getGameState();
  const hs = G.heroes.filter(h => h.alive).length;
  return `${statRow('Faction', `${G.f.emoji} ${G.f.name}`)}
    ${statRow('Battles', String(G.bn))}
    ${statRow('Kills', F(G.tk))}
    ${statRow('Army', `${F(G.cs)} / ${F(G.mx)}`)}
    ${statRow('Gold', `💰 ${G.gold}`)}
    ${statRow('Heroes', `${hs} / ${G.heroes.length}`)}
    ${statRow('Skills', String(G.skills.length))}
    ${statRow('ATK', String(G.f.atk + G.pAtk))}
    ${statRow('DEF', String(G.f.def + G.pDef))}
    ${G.skills.length ? '<div style="margin-top:6px;font-size:.48rem;color:var(--cyan)">' + G.skills.map(s => s.n).join(', ') + '</div>' : ''}`;
}

function showGameOver(): void {
  showScreen('gameover');
  setMusicMode('menu');
  document.getElementById('go-stats')!.innerHTML = runStats();
  sfx('defeat');
}

function showVictory(): void {
  showScreen('victory');
  setMusicMode('menu');
  document.getElementById('vic-stats')!.innerHTML = runStats();
  sfx('victory');
}

// ── Sandbox ──
let sbA: typeof FACTIONS[number] | null = null;
let sbB: typeof FACTIONS[number] | null = null;

function startSandbox(): void {
  setGameState(freshSandboxState());
  showScreen('sandbox-scr');
  setMusicMode('menu');
  buildSandbox();
}

function buildSandbox(): void {
  const ar = document.getElementById('sb-arena')!;
  sbA = null;
  sbB = null;
  ar.innerHTML = `<div style="background:var(--panel);border:1px solid var(--gdim);padding:12px"><div style="font-family:Orbitron,monospace;font-size:.55rem;color:var(--green);letter-spacing:.18em;margin-bottom:6px">▶ ALPHA</div><div class="sb-grid" id="sbga"></div>
    <div style="display:flex;align-items:center;gap:6px"><span style="font-size:.5rem;color:var(--muted)">SIZE</span><input type="range" id="sba" min="100" max="10000" value="1000" step="100" style="flex:1;height:3px"><span id="sbav" style="font-size:.6rem;color:var(--green);min-width:45px;text-align:right">1,000</span></div></div>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px;gap:8px"><div style="font-family:Orbitron,monospace;font-size:1.1rem;color:var(--gold)">VS</div><button class="btn gold" id="sbgo" disabled style="font-size:.5rem;padding:7px 12px">ENGAGE</button></div>
    <div style="background:var(--panel);border:1px solid var(--rdim);padding:12px"><div style="font-family:Orbitron,monospace;font-size:.55rem;color:var(--red);letter-spacing:.18em;margin-bottom:6px;text-align:right">BRAVO ◀</div><div class="sb-grid" id="sbgb"></div>
    <div style="display:flex;align-items:center;gap:6px"><span id="sbbv" style="font-size:.6rem;color:var(--red);min-width:45px">1,000</span><input type="range" id="sbb" min="100" max="10000" value="1000" step="100" style="flex:1;height:3px"><span style="font-size:.5rem;color:var(--muted)">SIZE</span></div></div>`;

  (['a', 'b'] as const).forEach(t => {
    const g = document.getElementById(`sbg${t}`)!;
    FACTIONS.forEach(f => {
      const b = document.createElement('button');
      b.className = 'sb-btn';
      b.innerHTML = `<span class="em">${f.emoji}</span>${f.name}`;
      b.onclick = () => {
        g.querySelectorAll('.sb-btn').forEach(x => {
          (x as HTMLElement).style.borderColor = 'var(--border)';
          (x as HTMLElement).style.color = 'var(--muted)';
          (x as HTMLElement).style.background = 'transparent';
        });
        const col = t === 'a' ? 'var(--green)' : 'var(--red)';
        b.style.borderColor = col;
        b.style.color = col;
        b.style.background = t === 'a' ? 'var(--gfaint)' : 'var(--rfaint)';
        if (t === 'a') sbA = f; else sbB = f;
        (document.getElementById('sbgo') as HTMLButtonElement).disabled = !(sbA && sbB);
      };
      g.appendChild(b);
    });

    const sl = document.getElementById(`sb${t}`) as HTMLInputElement;
    const vl = document.getElementById(`sb${t}v`)!;
    sl.oninput = () => { vl.textContent = parseInt(sl.value).toLocaleString(); };
  });

  document.getElementById('sbgo')!.onclick = sbFight;
}

function sbFight(): void {
  if (!sbA || !sbB) return;
  const G = freshSandboxState();
  G.f = sbA;
  setGameState(G);
  curStance = null;
  curEnemy = { isBoss: false } as EnemyDef;

  const szA = parseInt((document.getElementById('sba') as HTMLInputElement).value);
  const szB = parseInt((document.getElementById('sbb') as HTMLInputElement).value);
  const sA: BattleSide = {
    ...sbA, ss: szA, cs: szA, tAtk: 0, tDef: 0, eDmg: 0, dg: 0,
    pAtk: 0, pDef: 0, pDM: 0, pDg: 0, ls: false, bGene: false,
    mom: false, fort: false, bSpd: 0, gSpec: false, _tr: 0, _rr: 0,
  };
  const sB: BattleSide = {
    ...sbB, ss: szB, cs: szB, tAtk: 0, tDef: 0, eDmg: 0, dg: 0,
    pAtk: 0, pDef: 0, pDM: 0, pDg: 0, ls: false, bGene: false,
    mom: false, fort: false, bSpd: 0, gSpec: false, _tr: 0, _rr: 0,
  };

  (G as unknown as Record<string, unknown>)._stance = null;
  (G as unknown as Record<string, unknown>)._curEnemy = curEnemy;

  battleEngage(sA, sB, sbA, sbB, handleBattleEnd);
}

// ── Progress callback for events/rest ──
function handleProgressDone(): void {
  const G = getGameState();
  if (G.bn >= 12) showVictory();
  else showMap();
}

// ── Register callbacks to avoid circular imports ──
registerMapCallbacks(showPre, showRest, showEvent);
registerRewardCallback(() => showMap());
registerEventCallback(handleProgressDone);

// ── Wire up global event handlers ──
initAudioListeners();

// Expose handlers to HTML onclick attributes
(window as unknown as Record<string, unknown>).toggleAudio = toggleAudio;
(window as unknown as Record<string, unknown>).startCampaign = startCampaign;
(window as unknown as Record<string, unknown>).startSandbox = startSandbox;
(window as unknown as Record<string, unknown>).beginCampaign = beginCampaign;
(window as unknown as Record<string, unknown>).engage = doEngage;
(window as unknown as Record<string, unknown>).claim = claim;
(window as unknown as Record<string, unknown>).skipRest = skipRest;
(window as unknown as Record<string, unknown>).toTitle = toTitle;

// Start with menu music
setMusicMode('menu');
