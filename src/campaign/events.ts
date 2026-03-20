import type { RandomEvent } from '../types.ts';
import { HERO_PERKS } from '../factions/skills.ts';
import { getGameState } from './state.ts';
import { sfx } from '../audio/engine.ts';
import { showScreen } from '../ui/screens.ts';
import { F, P } from './state.ts';

let _onEventDone: (() => void) | null = null;

export function registerEventCallback(onDone: () => void): void {
  _onEventDone = onDone;
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
    { n: 'REST & HEAL', d: `Recover ${F(hAmt)} troops (25%)`, cost: 40, fn: () => { G.cs = Math.min(G.mx, G.cs + hAmt); } },
    { n: 'RECRUIT', d: `+${F(rAmt)} fresh troops & raise max`, cost: 60, fn: () => { G.mx += rAmt; G.cs += rAmt; } },
    { n: 'TRAINING', d: '+6 ATK, +6 DEF permanently', cost: 50, fn: () => { G.pAtk += 6; G.pDef += 6; } },
    { n: 'FORGE WEAPONS', d: 'Dmg ×1.25 permanently', cost: 75, fn: () => { G.pDM += 0.25; } },
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
