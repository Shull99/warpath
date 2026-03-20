import type { FactionDef } from '../types.ts';
import { sfx } from '../audio/engine.ts';

export interface TacticalState {
  rally: number;
  brace: number;
  spec: number;
  _fireSpec?: boolean;
  rallyLeft: number;
  braceLeft: number;
}

export function freshTacticalState(): TacticalState {
  return { rally: 0, brace: 0, spec: 0, rallyLeft: 0, braceLeft: 0 };
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

  // Rally
  const rBtn = document.createElement('button');
  rBtn.className = 'tac-btn rally' + (tac.rally > 0 ? ' cd' : '');
  rBtn.innerHTML = `🗡 RALLY` + (tac.rally > 0 ? ` <span style="color:var(--muted)">(${tac.rally})</span>` : '');
  rBtn.disabled = tac.rally > 0 || !battleActive;
  rBtn.onclick = () => {
    if (tac.rally > 0 || !battleActive) return;
    tac.rally = 6;
    tac.rallyLeft = 3;
    sfx('tactic');
    buildTacticsBar(bar, fA, tac, battleActive, battleSpeed, onSpeedChange);
  };
  bar.appendChild(rBtn);

  // Brace
  const bBtn = document.createElement('button');
  bBtn.className = 'tac-btn brace' + (tac.brace > 0 ? ' cd' : '');
  bBtn.innerHTML = `🛡 BRACE` + (tac.brace > 0 ? ` <span style="color:var(--muted)">(${tac.brace})</span>` : '');
  bBtn.disabled = tac.brace > 0 || !battleActive;
  bBtn.onclick = () => {
    if (tac.brace > 0 || !battleActive) return;
    tac.brace = 6;
    tac.braceLeft = 3;
    sfx('tactic');
    buildTacticsBar(bar, fA, tac, battleActive, battleSpeed, onSpeedChange);
  };
  bar.appendChild(bBtn);

  // Special
  const sBtn = document.createElement('button');
  sBtn.className = 'tac-btn spec' + (tac.spec > 0 ? ' cd' : '');
  sBtn.innerHTML = `⚡ ${fA.special}` + (tac.spec > 0 ? ` <span style="color:var(--muted)">(${tac.spec})</span>` : '');
  sBtn.disabled = tac.spec > 0 || !battleActive;
  sBtn.onclick = () => {
    if (tac.spec > 0 || !battleActive) return;
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
