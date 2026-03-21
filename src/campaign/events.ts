import type { RandomEvent, EnemyDef } from '../types.ts';
import { HERO_PERKS } from '../factions/skills.ts';
import { getGameState } from './state.ts';
import { sfx } from '../audio/engine.ts';
import { showScreen } from '../ui/screens.ts';
import { F, P } from './state.ts';

let _onEventDone: (() => void) | null = null;
let _showPre: ((enemy: EnemyDef) => void) | null = null;
let _showMapFn: (() => void) | null = null;

export function registerEventCallback(onDone: () => void, showPre?: (enemy: EnemyDef) => void, showMapFn?: () => void): void {
  _onEventDone = onDone;
  if (showPre) _showPre = showPre;
  if (showMapFn) _showMapFn = showMapFn;
}

function makeEvents(): RandomEvent[] {
  const G = getGameState();
  return [
    {
      t: 'DESERTERS', tx: 'Defeated soldiers offer to join. Loyalty questionable.', ch: [
        { l: 'Accept (+20% troops, -10 DEF)', fn: () => { const n = Math.floor(G.mx * 0.2); G.mx += n; G.cs += n; G.pDef = Math.max(0, G.pDef - 10); } },
        { l: 'Turn away', fn: () => { } },
      ],
    },
    {
      t: 'ANCIENT ARMOURY', tx: 'Powerful but cursed weapons.', ch: [
        { l: 'Take (+25 ATK, -15 DEF)', fn: () => { G.pAtk += 25; G.pDef = Math.max(0, G.pDef - 15); } },
        { l: 'Destroy (+10 DEF)', fn: () => { G.pDef += 10; } },
      ],
    },
    {
      t: 'THE PLAGUE', tx: 'Sickness sweeps camp.', ch: [
        { l: 'Quarantine (-15% troops, +15 DEF)', fn: () => { G.cs = Math.ceil(G.cs * 0.85); G.pDef += 15; } },
        { l: 'Push through (-25%)', fn: () => { G.cs = Math.ceil(G.cs * 0.75); } },
      ],
    },
    {
      t: 'MERCENARY', tx: 'A fighter wants a duel to join you.', ch: [
        {
          l: 'Accept (-10% troops, gain hero)', fn: () => {
            G.cs = Math.ceil(G.cs * 0.9);
            const pk = P(HERO_PERKS);
            G.heroes.push({ name: 'The Mercenary', perk: pk, alive: true });
            pk.fn(G);
          },
        },
        { l: 'Decline', fn: () => { } },
      ],
    },
    {
      t: 'MERCHANT CARAVAN', tx: 'Traders offer rare supplies.', ch: [
        { l: 'Buy (+20 ATK, 💰 -50)', fn: () => { if (G.gold >= 50) { G.gold -= 50; G.pAtk += 20; } else { G.pAtk += 5; } } },
        { l: 'Rob them (+40 gold, -10 DEF)', fn: () => { G.gold += 40; G.pDef = Math.max(0, G.pDef - 10); } },
      ],
    },
    {
      t: 'AMBUSH!', tx: 'Enemy patrol hits camp at night.', ch: [
        { l: 'Fight! (-10% troops, +15 ATK)', fn: () => { G.cs = Math.ceil(G.cs * 0.9); G.pAtk += 15; } },
        { l: 'Flee (-5%)', fn: () => { G.cs = Math.ceil(G.cs * 0.95); } },
      ],
    },
    {
      t: 'GOLD MINE', tx: 'Your scouts find an abandoned mine.', ch: [
        { l: 'Send miners (+80 gold, -5% troops)', fn: () => { G.gold += 80; G.cs = Math.ceil(G.cs * 0.95); } },
        { l: 'Ignore (safe)', fn: () => { } },
      ],
    },
  ];
}

export function showEvent(): void {
  showScreen('event-scr');
  const evts = makeEvents();
  const ev = P(evts);
  document.getElementById('ebox')!.innerHTML = `<div class="etitle">${ev.t}</div><div class="etext">${ev.tx}</div><div style="display:flex;flex-direction:column;gap:7px" id="ech"></div>`;

  ev.ch.forEach(c => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.style.cssText = 'width:100%;text-align:left;font-size:.52rem';
    b.textContent = c.l;
    b.onclick = () => {
      c.fn();
      const G = getGameState();
      G.bn++;
      _onEventDone?.();
    };
    document.getElementById('ech')!.appendChild(b);
  });
}

export function showRest(): void {
  const G = getGameState();
  showScreen('rest-scr');
  document.getElementById('rest-gold')!.textContent = String(G.gold);

  const el = document.getElementById('rest-opts')!;
  el.innerHTML = '';
  const hAmt = Math.floor(G.mx * 0.25);
  const rAmt = Math.floor(G.mx * 0.15);

  const opts = [
    { n: 'REST & HEAL', d: `Recover ${F(hAmt)} troops (25%)`, cost: 25, fn: () => { G.cs = Math.min(G.mx, G.cs + hAmt); } },
    { n: 'RECRUIT', d: `+${F(rAmt)} fresh troops & raise max`, cost: 40, fn: () => { G.mx += rAmt; G.cs += rAmt; } },
    { n: 'TRAINING', d: '+5 ATK, +5 DEF permanently', cost: 35, fn: () => { G.pAtk += 5; G.pDef += 5; } },
    { n: 'FORGE WEAPONS', d: 'Dmg ×1.15 permanently', cost: 50, fn: () => { G.pDM += 0.15; } },
  ];

  opts.forEach(o => {
    const locked = G.gold < o.cost;
    const c = document.createElement('div');
    c.className = 'roc' + (locked ? ' locked' : '');
    c.innerHTML = `<div class="rcn">${o.n}</div><div class="rcd">${o.d}</div><div class="cost">💰 ${o.cost} gold${locked ? ' — NOT ENOUGH' : ''}</div>`;
    if (!locked) {
      c.onclick = () => {
        G.gold -= o.cost;
        o.fn();
        sfx('gold');
        G.bn++;
        _onEventDone?.();
      };
    }
    el.appendChild(c);
  });
}

export function skipRest(): void {
  const G = getGameState();
  G.bn++;
  _onEventDone?.();
}

export function showRecruit(): void {
  const G = getGameState();
  showScreen('rest-scr');
  document.getElementById('rest-gold')!.textContent = String(G.gold);

  const el = document.getElementById('rest-opts')!;
  el.innerHTML = '';
  const scoutCount = Math.max(1, Math.floor(G.mx * 0.08));
  const soldierCount = Math.max(2, Math.floor(G.mx * 0.15));
  const veteranCount = Math.max(3, Math.floor(G.mx * 0.25));

  const opts = [
    { n: 'HIRE SCOUTS', d: `+${F(scoutCount)} light troops`, cost: 15, fn: () => { G.mx += scoutCount; G.cs += scoutCount; } },
    { n: 'RECRUIT SOLDIERS', d: `+${F(soldierCount)} troops & raise max`, cost: 35, fn: () => { G.mx += soldierCount; G.cs += soldierCount; } },
    { n: 'HIRE VETERANS', d: `+${F(veteranCount)} elite troops, +3 ATK`, cost: 55, fn: () => { G.mx += veteranCount; G.cs += veteranCount; G.pAtk += 3; } },
  ];

  const titleEl = document.querySelector('#rest-scr h2');
  if (titleEl) titleEl.textContent = '📯 WANDERING WARBAND';

  opts.forEach(o => {
    const locked = G.gold < o.cost;
    const c = document.createElement('div');
    c.className = 'roc' + (locked ? ' locked' : '');
    c.innerHTML = `<div class="rcn">${o.n}</div><div class="rcd">${o.d}</div><div class="cost">💰 ${o.cost} gold${locked ? ' — NOT ENOUGH' : ''}</div>`;
    if (!locked) {
      c.onclick = () => {
        G.gold -= o.cost;
        o.fn();
        sfx('gold');
        G.bn++;
        _onEventDone?.();
      };
    }
    el.appendChild(c);
  });
}

export function showScout(enemy: EnemyDef): void {
  const G = getGameState();
  showScreen('event-scr');
  const ratio = enemy.size / G.cs;
  const diff = ratio < 0.6 ? 'EASY' : ratio < 0.9 ? 'MEDIUM' : ratio < 1.3 ? 'HARD' : 'DEADLY';
  const yourAtk = G.f.atk + G.pAtk;
  const yourDef = G.f.def + G.pDef;

  document.getElementById('ebox')!.innerHTML = `<div class="etitle">📜 SCOUT REPORT</div>
    <div class="etext">
      <div style="margin-bottom:8px">Your scouts report on <b style="color:var(--red)">${enemy.emoji} ${enemy.name}</b>:</div>
      <div class="scout-grid">
        <div class="scout-col"><div class="scout-label" style="color:var(--green)">YOUR ARMY</div>
          <div>Troops: <b>${F(G.cs)}</b></div>
          <div>ATK: <b>${yourAtk}</b></div>
          <div>DEF: <b>${yourDef}</b></div></div>
        <div class="scout-vs">VS</div>
        <div class="scout-col"><div class="scout-label" style="color:var(--red)">ENEMY</div>
          <div>Troops: <b>${F(enemy.size)}</b></div>
          <div>ATK: <b>${enemy.atk}</b></div>
          <div>DEF: <b>${enemy.def}</b></div></div>
      </div>
      <div style="text-align:center;margin-top:8px">Difficulty: <b style="color:${diff === 'EASY' ? 'var(--green)' : diff === 'MEDIUM' ? 'var(--gold)' : 'var(--red)'}">${diff}</b></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:7px" id="ech"></div>`;

  const engBtn = document.createElement('button');
  engBtn.className = 'btn red';
  engBtn.style.cssText = 'width:100%;text-align:center;font-size:.52rem';
  engBtn.textContent = `⚔ ENGAGE ${enemy.name.toUpperCase()}`;
  engBtn.onclick = () => { _showPre?.(enemy); };
  document.getElementById('ech')!.appendChild(engBtn);

  const retreatBtn = document.createElement('button');
  retreatBtn.className = 'btn';
  retreatBtn.style.cssText = 'width:100%;text-align:left;font-size:.52rem';
  retreatBtn.textContent = 'Retreat (return to map)';
  retreatBtn.onclick = () => { _showMapFn?.(); };
  document.getElementById('ech')!.appendChild(retreatBtn);
}
