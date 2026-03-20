import type { Skill, HeroPerk, GameState } from '../types.ts';

export const SKILLS: Skill[] = [
  { n: 'Bloodlust', d: 'ATK +20', t: 'atk', fn: s => { s.pAtk += 20; } },
  { n: 'Hardened Veterans', d: 'DEF +18', t: 'def', fn: s => { s.pDef += 18; } },
  { n: 'Pack Tactics', d: 'ATK +14, DEF +10', t: 'both', fn: s => { s.pAtk += 14; s.pDef += 10; } },
  { n: 'Desperate Strike', d: 'ATK +25', t: 'atk', fn: s => { s.pAtk += 25; } },
  { n: 'Turtle Formation', d: 'DEF +22', t: 'def', fn: s => { s.pDef += 22; } },
  { n: 'Battle Rhythm', d: 'Dmg ×1.5', t: 'dmg', fn: s => { s.pDM += .5; } },
  { n: 'Fear Aura', d: 'Enemy ATK -15', t: 'debuff', fn: (_s, e) => { if (e) e.pAtk = Math.max(0, e.pAtk - 15); } },
  { n: 'Last Stand', d: '+30% ATK below 30% HP', t: 'atk', fn: s => { s.ls = true; } },
  { n: 'Studied Weakness', d: 'Dmg ×1.55', t: 'dmg', fn: s => { s.pDM += .55; } },
  { n: 'Ghost Protocol', d: '+20% dodge', t: 'def', fn: s => { s.pDg += .20; } },
  { n: 'Shock Doctrine', d: 'Enemy DEF -12', t: 'debuff', fn: (_s, e) => { if (e) e.pDef = Math.max(0, e.pDef - 12); } },
  { n: 'Fury Cascade', d: 'ATK +28', t: 'atk', fn: s => { s.pAtk += 28; } },
  { n: 'Somehow Has A Gun', d: 'ATK +32', t: 'atk', fn: s => { s.pAtk += 32; } },
  { n: 'Battle Hymn', d: '+14 ATK/DEF', t: 'both', fn: s => { s.pAtk += 14; s.pDef += 14; } },
  { n: 'Tactical Napping', d: '+10 ATK/DEF', t: 'both', fn: s => { s.pAtk += 10; s.pDef += 10; } },
  { n: 'Death From Everywhere', d: 'Dmg ×1.7', t: 'dmg', fn: s => { s.pDM += .7; } },
  { n: 'Spite', d: 'ATK +35', t: 'atk', fn: s => { s.pAtk += 35; } },
  { n: 'Wall of Screaming', d: 'Enemy DEF -14', t: 'debuff', fn: (_s, e) => { if (e) e.pDef = Math.max(0, e.pDef - 14); } },
  { n: 'Battle Trance', d: 'Dmg ×1.8', t: 'dmg', fn: s => { s.pDM += .8; } },
  { n: 'Shared Pain', d: '+16 ATK/DEF', t: 'both', fn: s => { s.pAtk += 16; s.pDef += 16; } },
  { n: 'Regeneration', d: 'Heal 8% per battle', t: 'heal', fn: s => { s.regen = (s.regen || 0) + .08; } },
  { n: 'Scavengers', d: 'Recover 10% enemy dead', t: 'grow', fn: s => { s.scav = (s.scav || 0) + .10; } },
  { n: 'Momentum', d: 'Rnd 1-3 dmg ×2', t: 'dmg', fn: s => { s.mom = true; } },
  { n: 'Fortify', d: 'Rnd 1-3 DEF ×2', t: 'def', fn: s => { s.fort = true; } },
  { n: 'Berserker Gene', d: 'Below 50%: ATK ×2', t: 'atk', fn: s => { s.bGene = true; } },
  { n: 'Recruitment Drive', d: '+5% army per battle', t: 'grow', fn: s => { s.recr = (s.recr || 0) + .05; } },
  { n: 'Grudge Multiplier', d: 'ATK +32', t: 'atk', fn: s => { s.pAtk += 32; } },
  { n: 'Aggressive Paperwork', d: 'Enemy DEF -16', t: 'debuff', fn: (_s, e) => { if (e) e.pDef = Math.max(0, e.pDef - 16); } },
  { n: 'Iron Constitution', d: 'DEF +22', t: 'def', fn: s => { s.pDef += 22; } },
  { n: 'Chaos Theory', d: 'Dmg ×1.45', t: 'dmg', fn: s => { s.pDM += .45; } },
];

export const HERO_PERKS: HeroPerk[] = [
  { n: 'Warcaller', d: 'ATK +8', fn: (s: GameState) => { s.pAtk += 8; } },
  { n: 'Shieldbearer', d: 'DEF +8', fn: (s: GameState) => { s.pDef += 8; } },
  { n: 'Tactician', d: 'SPD +15', fn: (s: GameState) => { s.bSpd = (s.bSpd || 0) + 15; } },
  { n: 'Healer', d: 'Heal 5%/battle', fn: (s: GameState) => { s.regen = (s.regen || 0) + .05; } },
];

export const COMBO_ADJ = ['Iron', 'Shadow', 'Crimson', 'Thunder', 'Ghost', 'Void', 'Blazing', 'Silent', 'Raging', 'Frozen', 'Phantom', 'Storm', 'Ancient', 'Cursed', 'Burning', 'Jade', 'Blood', 'Swift'];
export const COMBO_NOUN = ['Fang', 'Strike', 'Cyclone', 'Slash', 'Barrage', 'Crush', 'Fury', 'Tempest', 'Talon', 'Blade', 'Fist', 'Onslaught', 'Comet', 'Eclipse', 'Vortex', 'Impact'];

export function randomCombo(): string {
  const adj = COMBO_ADJ[Math.floor(Math.random() * COMBO_ADJ.length)]!;
  const noun = COMBO_NOUN[Math.floor(Math.random() * COMBO_NOUN.length)]!;
  return `${adj} ${noun}`;
}
