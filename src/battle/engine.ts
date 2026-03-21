import type { BattleSide, FactionDef } from '../types.ts';
import { getGameState } from '../campaign/state.ts';
import { sfx, setMusicMode } from '../audio/engine.ts';
import { showScreen } from '../ui/screens.ts';
import { SKILLS } from '../factions/skills.ts';
import { WARRIOR_NAMES } from '../factions/index.ts';
import { randomCombo } from '../factions/skills.ts';
import { initParticles, killParticles, reviveParticles } from './particles.ts';
import { resizeCanvas, startAnimLoop, stopAnimLoop } from './renderer.ts';
import { buildTacticsBar, freshTacticalState } from './tactics.ts';
import type { TacticalState } from './tactics.ts';
import { P, S, C, F, ri } from '../campaign/state.ts';

let battleSpeed = 1100;
let battleActive = false;
let tacState: TacticalState = freshTacticalState();

export type BattleEndCallback = (won: boolean, aAlive: number, enemyKilled: number, goldEarned: number) => void;

export function engage(
  sA: BattleSide,
  sB: BattleSide,
  fA: FactionDef,
  fB: FactionDef,
  onEnd: BattleEndCallback,
): void {
  showScreen('battle-screen');
  setMusicMode('battle');
  const canvas = document.getElementById('bcanvas') as HTMLCanvasElement;
  const ctx = resizeCanvas(canvas);
  battleActive = true;
  battleSpeed = 1100;
  tacState = freshTacticalState();

  runBattle(canvas, ctx, sA, sB, fA, fB, onEnd);
}

function runBattle(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  sA: BattleSide,
  sB: BattleSide,
  fA: FactionDef,
  fB: FactionDef,
  onEnd: BattleEndCallback,
): void {
  stopAnimLoop();
  const G = getGameState();
  const hud = document.getElementById('bhud')!;
  hud.innerHTML = `<div><div class="bhl a" id="hla">${fA.name.toUpperCase()}</div><div class="bbar"><div class="bfa" id="hfa" style="width:100%"></div></div><div class="bnum" id="hna">${F(sA.cs)} / ${F(sA.ss)}</div></div>
    <div class="bctr" id="hrnd">RND 0</div>
    <div><div class="bhl b" id="hlb">${fB.name.toUpperCase()}</div><div class="bbar"><div class="bfb" id="hfb" style="width:100%"></div></div><div class="bnum b" id="hnb">${F(sB.cs)} / ${F(sB.ss)}</div></div>`;

  const log = document.getElementById('blog')!;
  log.innerHTML = '';
  initParticles(canvas, sA.ss, sB.ss, fA.id, fB.id);
  startAnimLoop(canvas, ctx, () => battleActive);

  const bar = document.getElementById('tbar')!;
  const rebuildBar = () => buildTacticsBar(bar, fA, tacState, battleActive, battleSpeed, (v) => { battleSpeed = v; });
  rebuildBar();

  const nA = S(WARRIOR_NAMES[fA.id] || ['Fighter']).slice(0, 4);
  const nB = S(WARRIOR_NAMES[fB.id] || ['Fighter']).slice(0, 4);
  const eSP = S([...SKILLS]);
  const eUsed = new Set<string>();
  let rnd = 0;
  const MAX = 100;

  function al(m: string, c = 'sys'): void {
    const l = document.createElement('div');
    l.className = `ll ${c}`;
    l.textContent = m;
    log.appendChild(l);
    log.scrollTop = log.scrollHeight;
  }

  function uHUD(): void {
    const pa = C(sA.cs / sA.ss * 100, 0, 100);
    const pb = C(sB.cs / sB.ss * 100, 0, 100);
    document.getElementById('hfa')!.style.width = pa + '%';
    document.getElementById('hfb')!.style.width = pb + '%';
    document.getElementById('hna')!.textContent = `${F(sA.cs)} / ${F(sA.ss)}`;
    document.getElementById('hnb')!.textContent = `${F(sB.cs)} / ${F(sB.ss)}`;
    document.getElementById('hrnd')!.textContent = `RND ${rnd}`;
  }

  function cDmg(a: BattleSide, d: BattleSide, r: number): number {
    const ea = Math.max(1, a.atk + (a.pAtk || 0) + (a.tAtk || 0));
    const ed = Math.max(10, d.def + (d.pDef || 0) + (d.tDef || 0));
    const eng = Math.min(a.cs, d.cs * 3);
    const sb = 0.85 + (a.spd + (a.bSpd || 0)) / 100 * 0.3;
    let base = (ea / 100) * eng * 0.08 * sb;
    const mit = Math.min(0.5, ed / 200);
    let dmg = base * (1 - mit) * (0.8 + Math.random() * 0.4);
    if (a.pDM) dmg *= (1 + a.pDM);
    if (a.mom && r <= 3) dmg *= 2;
    if (a.ls && a.cs / a.ss < 0.3) dmg *= 1.6;
    if (a.bGene && a.cs / a.ss < 0.5) dmg *= 2;
    if (a.eDmg) dmg *= (1 + a.eDmg);
    const dg = (d.pDg || 0) + (d.dg || 0);
    if (Math.random() < dg) dmg *= 0.08;
    return Math.max(0.1, dmg);
  }

  al('══════════════════════════════════', 'sys');
  al(`  ${fA.name.toUpperCase()} (${F(sA.ss)})`, 'da');
  al('         — VS —', 'sys');
  al(`  ${fB.name.toUpperCase()} (${F(sB.ss)})`, 'db');
  al('══════════════════════════════════', 'sys');

  const curStance = (G as { _stance?: { id: string; n: string } })._stance;
  if (curStance && curStance.id !== 'bal') al(`Stance: ${curStance.n}`, 'sp');
  al('BATTLE COMMENCING...', 'sys');
  al('Use 🗡 RALLY, 🛡 BRACE, and ⚡ SPECIAL during combat!', 'tac');

  function tick(): void {
    if (sA.cs <= 0 || sB.cs <= 0 || rnd >= MAX) { finish(); return; }
    rnd++;
    sA.tAtk = 0; sA.tDef = 0; sA.eDmg = 0; sA.dg = 0; sA._rr = 0;
    sB.tAtk = 0; sB.tDef = 0; sB.eDmg = 0; sB.dg = 0; sB._rr = 0;

    // Tick tactical cooldowns
    if (tacState.rally > 0) tacState.rally--;
    if (tacState.brace > 0) tacState.brace--;
    if (tacState.spec > 0) tacState.spec--;

    // Apply active tactical effects
    if (tacState.rallyLeft > 0) {
      sA.tAtk += 25;
      tacState.rallyLeft--;
      if (tacState.rallyLeft === 0) al('  Rally effect fades.', 'sys');
    }
    if (tacState.braceLeft > 0) {
      sA.tDef += 30;
      tacState.braceLeft--;
      if (tacState.braceLeft === 0) al('  Brace effect fades.', 'sys');
    }

    // Player-triggered special
    if (tacState._fireSpec) {
      tacState._fireSpec = false;
      const pre = sA.cs;
      fA.sFn(sA, sB);
      if (sA.cs > pre) reviveParticles('a', sA.cs - pre, sA.ss, fA.id);
      al(`⚡ [TACTICAL] ${fA.special}!`, 'tac');
      sfx('special');
    }

    // Fortify
    if (sA.fort && rnd <= 3) sA.tDef += sA.def;
    if (sB.fort && rnd <= 3) sB.tDef += sB.def;
    if (rnd % 3 === 1 || rnd === 1) al(`── Round ${rnd} ──────────────────────`, 'sys');

    // Guaranteed special round 1
    if (sA.gSpec && rnd === 1) {
      const pre = sA.cs; fA.sFn(sA, sB);
      if (sA.cs > pre) reviveParticles('a', sA.cs - pre, sA.ss, fA.id);
      al(`⚡ [${fA.name}] ${fA.special}!`, 'sp'); sfx('special');
    } else if (Math.random() < 0.18) {
      const pre = sA.cs; fA.sFn(sA, sB);
      if (sA.cs > pre) reviveParticles('a', sA.cs - pre, sA.ss, fA.id);
      al(`⚡ [${fA.name}] ${fA.special}!`, 'sp'); sfx('special');
    }
    if (Math.random() < 0.18) {
      const pre = sB.cs; fB.sFn(sB, sA);
      if (sB.cs > pre) reviveParticles('b', sB.cs - pre, sB.ss, fB.id);
      al(`⚡ [${fB.name}] ${fB.special}!`, 'sp'); sfx('special');
    }

    // Enemy evolve
    if (Math.random() < 0.025 + G.bn * 0.004) {
      const av = eSP.find(s => !eUsed.has(s.n) && s.t !== 'debuff' && s.t !== 'heal' && s.t !== 'grow');
      if (av) {
        eUsed.add(av.n);
        if (av.fn.length >= 2) av.fn(sB as unknown as typeof G, sA as unknown as typeof G);
        else av.fn(sB as unknown as typeof G);
        al(`🧬 [${fB.name}] EVOLVED: "${av.n}" — ${av.d}`, 'ev');
        sfx('evolve');
      }
    }

    const pA = sA.cs, pB = sB.cs;
    const dA = cDmg(sB, sA, rnd), dB = cDmg(sA, sB, rnd);
    sA.cs -= dA; sB.cs -= dB;
    killParticles(canvas, 'a', dA, pA);
    killParticles(canvas, 'b', dB, pB);
    if (Math.random() < 0.4) sfx('hit');
    if (Math.random() < 0.12) al(`  [${fA.emoji}] ${P(fA.fl)}`, 'sys');
    if (Math.random() < 0.12) al(`  [${fB.emoji}] ${P(fB.fl)}`, 'sys');
    if (Math.random() < 0.10) al(`★ ${P(nA)} executes '${randomCombo()}' — ${ri(2, Math.max(3, Math.ceil(dB * 0.3)))} enemies fall`, 'na');
    if (Math.random() < 0.10) al(`★ ${P(nB)} unleashes '${randomCombo()}'`, 'nb');

    if (G.mode === 'campaign' && Math.random() < 0.035 && sA.cs / sA.ss < 0.35) {
      const alive = G.heroes.filter(h => h.alive);
      if (alive.length) { const h = P(alive); h.alive = false; al(`💀 HERO FALLEN: ${h.name}!`, 'hd'); }
    }
    if (G.mode === 'campaign' && Math.random() < 0.07) {
      const alive = G.heroes.filter(h => h.alive);
      if (alive.length) { al(`⭐ ${P(alive).name} rallies nearby troops!`, 'hero'); sA.tAtk += 8; }
    }

    al(`  ${fA.name}: -${F(dA)} (${F(sA.cs)} remain)`, 'db');
    al(`  ${fB.name}: -${F(dB)} (${F(sB.cs)} remain)`, 'da');
    uHUD();
    rebuildBar();
    setTimeout(tick, battleSpeed);
  }

  function finish(): void {
    battleActive = false;
    const aA = Math.max(0, Math.ceil(sA.cs));
    const bA = Math.max(0, Math.ceil(sB.cs));
    const won = aA > bA;
    const eK = Math.max(0, sB.ss - bA);
    al('══════════════════════════════════', 'sys');
    if (won) { al(`VICTORY: ${fA.name.toUpperCase()}`, 'res'); al(`Survivors: ${F(aA)} — Destroyed: ${F(eK)}`, 'res'); sfx('victory'); }
    else { al(`DEFEAT: ${fA.name.toUpperCase()} destroyed.`, 'res'); sfx('defeat'); }
    rebuildBar();

    const isBoss = ((G as { _curEnemy?: { isBoss: boolean } })._curEnemy?.isBoss);
    const baseGold = Math.floor(20 + sB.ss * 0.25);
    const efficiencyBonus = won ? Math.floor(baseGold * (aA / sA.ss) * 0.5) : 0;
    const goldEarned = isBoss ? Math.floor(baseGold * 1.5 + efficiencyBonus) : baseGold + efficiencyBonus;

    if (won) {
      al(`💰 Gold: ${goldEarned} (base: ${baseGold}${efficiencyBonus > 0 ? ` + efficiency: ${efficiencyBonus}` : ''})`, 'tac');
      const lost = sA.ss - aA;
      al(`📊 Troops lost: ${F(lost)} | Remaining: ${F(aA)} / ${F(sA.ss)}`, 'sys');
    }

    setTimeout(() => {
      onEnd(won, aA, eK, goldEarned);
    }, 1800);
  }

  uHUD();
  setTimeout(tick, 1200);
}

export function isBattleActive(): boolean {
  return battleActive;
}
