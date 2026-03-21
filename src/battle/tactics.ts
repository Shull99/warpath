import type { FactionDef } from '../types.ts';
import { sfx } from '../audio/engine.ts';

export interface TacticalState {
  rally: number;
  brace: number;
  spec: number;
  _fireSpec?: boolean;
  rallyLeft: number;
  braceLeft: number;
  cp: number;
}

export function freshTacticalState(): TacticalState {
  return { rally: 0, brace: 0, spec: 0, rallyLeft: 0, braceLeft: 0, cp: 3 };
}

export function buildTacticsBar(
  bar: HTMLElement,
  fA: FactionDef,
  tac: TacticalState,
  battleActive: boolean,
  battleSpeed: number,
  onSpeedChange: (speed: number) => void,
): void {
  bar.innerHTML = '';

  // Command Points display
  const cpDiv = document.createElement('div');
  cpDiv.className = 'cp-display';
  cpDiv.innerHTML = `<span class="cp-label">CP</span>${Array.from({ length: 3 }, (_, i) => `<span class="cp-pip${i < tac.cp ? ' active' : ''}">${i < tac.cp ? '◆' : '◇'}</span>`).join('')}`;
  bar.appendChild(cpDiv);

  // Rally (1 CP)
  const rBtn = document.createElement('button');
  const rDisabled = tac.rally > 0 || !battleActive || tac.cp < 1;
  rBtn.className = 'tac-btn rally' + (tac.rally > 0 ? ' cd' : '') + (tac.cp < 1 && tac.rally <= 0 ? ' no-cp' : '');
  rBtn.innerHTML = `🗡 RALLY` + (tac.rally > 0 ? ` <span style="color:var(--muted)">(${tac.rally})</span>` : ' <span class="cp-cost">1CP</span>');
  rBtn.title = 'ATK +25 for 3 rounds (costs 1 Command Point)';
  rBtn.disabled = rDisabled;
  rBtn.onclick = () => {
    if (rDisabled) return;
    tac.cp--;
    tac.rally = 6;
    tac.rallyLeft = 3;
    sfx('tactic');
    buildTacticsBar(bar, fA, tac, battleActive, battleSpeed, onSpeedChange);
  };
  bar.appendChild(rBtn);

  // Brace (1 CP)
  const bBtn = document.createElement('button');
  const bDisabled = tac.brace > 0 || !battleActive || tac.cp < 1;
  bBtn.className = 'tac-btn brace' + (tac.brace > 0 ? ' cd' : '') + (tac.cp < 1 && tac.brace <= 0 ? ' no-cp' : '');
  bBtn.innerHTML = `🛡 BRACE` + (tac.brace > 0 ? ` <span style="color:var(--muted)">(${tac.brace})</span>` : ' <span class="cp-cost">1CP</span>');
  bBtn.title = 'DEF +30 for 3 rounds (costs 1 Command Point)';
  bBtn.disabled = bDisabled;
  bBtn.onclick = () => {
    if (bDisabled) return;
    tac.cp--;
    tac.brace = 6;
    tac.braceLeft = 3;
    sfx('tactic');
    buildTacticsBar(bar, fA, tac, battleActive, battleSpeed, onSpeedChange);
  };
  bar.appendChild(bBtn);

  // Special (2 CP)
  const sBtn = document.createElement('button');
  const sDisabled = tac.spec > 0 || !battleActive || tac.cp < 2;
  sBtn.className = 'tac-btn spec' + (tac.spec > 0 ? ' cd' : '') + (tac.cp < 2 && tac.spec <= 0 ? ' no-cp' : '');
  sBtn.innerHTML = `⚡ ${fA.special}` + (tac.spec > 0 ? ` <span style="color:var(--muted)">(${tac.spec})</span>` : ' <span class="cp-cost">2CP</span>');
  sBtn.title = `${fA.special}: ${fA.spDesc} (costs 2 Command Points)`;
  sBtn.disabled = sDisabled;
  sBtn.onclick = () => {
    if (sDisabled) return;
    tac.cp -= 2;
    tac.spec = 8;
    tac._fireSpec = true;
    sfx('tactic');
    buildTacticsBar(bar, fA, tac, battleActive, battleSpeed, onSpeedChange);
  };
  bar.appendChild(sBtn);

  // Speed controls
  const sw = document.createElement('div');
  sw.className = 'speed-btns';
  [{ l: '1×', v: 1100 }, { l: '2×', v: 550 }, { l: '3×', v: 280 }].forEach(sp => {
    const b = document.createElement('button');
    b.className = 'spd-btn' + (battleSpeed === sp.v ? ' active' : '');
    b.textContent = sp.l;
    b.onclick = () => {
      onSpeedChange(sp.v);
      bar.querySelectorAll('.spd-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      sfx('click');
    };
    sw.appendChild(b);
  });
  bar.appendChild(sw);
}
