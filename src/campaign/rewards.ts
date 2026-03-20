import { SKILLS } from '../factions/skills.ts';
import { getGameState } from './state.ts';
import { sfx } from '../audio/engine.ts';
import { showScreen } from '../ui/screens.ts';

import type { Skill } from '../types.ts';

let selReward: (Skill & { skip?: boolean }) | { n: string; d: string; t: string; skip: true } | null = null;
let _onClaim: (() => void) | null = null;

export function registerRewardCallback(onClaim: () => void): void {
  _onClaim = onClaim;
}

export function showReward(): void {
  const G = getGameState();
  showScreen('reward');
  selReward = null;
  document.getElementById('claim-btn')!.setAttribute('disabled', '');
  document.getElementById('rsub')!.textContent = `Battle ${G.bn}/12 — 💰 ${G.gold} gold`;

  const el = document.getElementById('rcards')!;
  el.innerHTML = '';
  const owned = new Set(G.skills.map(s => s.n));
  const shuffled = [...SKILLS].sort(() => Math.random() - 0.5);
  const avail = shuffled.filter(s => !owned.has(s.n)).slice(0, 3);

  if (!avail.length) {
    selReward = { n: '', d: '', t: '', skip: true };
    document.getElementById('claim-btn')!.removeAttribute('disabled');
    (document.getElementById('claim-btn') as HTMLButtonElement).textContent = 'CONTINUE';
    el.innerHTML = '<div style="color:var(--muted);font-size:.55rem">All skills acquired.</div>';
    return;
  }

  (document.getElementById('claim-btn') as HTMLButtonElement).textContent = 'CLAIM & CONTINUE';

  avail.forEach(sk => {
    const c = document.createElement('div');
    c.className = 'rc';
    const tc: Record<string, string> = { atk: 'red', def: 'green', dmg: 'gold', debuff: 'purple', both: 'cyan', heal: 'green', grow: 'gold' };
    c.innerHTML = `<span class="tag ${tc[sk.t] || 'green'} rt">${sk.t.toUpperCase()}</span><div class="rn">${sk.n}</div><div class="rd">${sk.d}</div>`;
    c.onclick = () => {
      el.querySelectorAll('.rc').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      selReward = sk;
      document.getElementById('claim-btn')!.removeAttribute('disabled');
    };
    el.appendChild(c);
  });
}

export function claim(): void {
  if (!selReward) return;
  const G = getGameState();
  if (!selReward.skip) {
    G.skills.push({ n: selReward.n, d: selReward.d, t: selReward.t });
    const skill = SKILLS.find(s => s.n === selReward!.n);
    if (skill && skill.fn.length < 2) skill.fn(G as unknown as Parameters<typeof skill.fn>[0]);
    sfx('evolve');
  }
  _onClaim?.();
}
