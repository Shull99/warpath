import type { FactionDef, BattleSide } from '../types.ts';

export const WARRIOR_NAMES: Record<string, string[]> = {
  romans: ['Maximus', 'Julius', 'Marcus', 'Titus', 'Gaius', 'Brutus', 'Severus', 'Decimus', 'Flavius', 'Antonius', 'Cato', 'Nero'],
  space: ['Trooper-7', 'Unit-Omega', 'Sgt. Kira', 'Echo-9', 'Cmdr Vex', 'Apex-3', 'Ghost-1', 'Delta', 'Cipher-K', 'Reaper'],
  vikings: ['Bjorn', 'Ragnar', 'Ulf', 'Sigrid', 'Halvard', 'Gunnar', 'Ivar', 'Astrid', 'Leif', 'Thorvald'],
  knights: ['Sir Edmund', 'Sir Roland', 'Sir Percival', 'Sir Hugh', 'Sir Gawain', 'Lady Isolde', 'Sir Bors', 'Sir Aldric'],
  ninjas: ['Kage', 'Shadow-X', 'Void', 'Cipher', 'Phantom', 'Mist', 'Silence', 'Ghost', 'Null', 'Raven'],
  pirates: ['Blackthorn', 'One-Eye', 'Mad Jack', 'Saltwater Sal', 'The Bosun', 'Crimson Pete', 'Hook', 'Shark'],
  dinos: ['Rex-1', 'Clawzilla', 'Stompy', 'Bitey', 'Lt. Scales', 'The Professor', 'Big Steve', 'Dr. Chomp'],
  zombies: ['#4471', 'Giggles', 'Old Greg', 'The Fast One', 'Mumbles', 'Unit 9', 'The Quiet One'],
  samurai: ['Takeshi', 'Hiroshi', 'Kenji', 'Musashi', 'Koji', 'Ryo', 'Shinzo', 'Akira', 'Daichi'],
  wizards: ['Aldric', 'Mervyn', 'Zolthar', 'Prof. Grimm', 'Beatrice', 'The Archivist', 'Cornelius', 'Hex'],
};

export const FACTIONS: FactionDef[] = [
  {
    id: 'romans', name: 'Roman Legion', emoji: '🏛️', atk: 72, def: 88, spd: 42, morale: 94,
    special: 'TESTUDO', spDesc: 'Shields interlock — DEF +60',
    sFn: (s: BattleSide) => { s.tDef += 60; },
    fl: ['Legions advance in perfect formation.', 'Centurion screams in Latin.', 'Pilum volley darkens the sky.', '"Et tu?" — wrong battle.'],
  },
  {
    id: 'space', name: 'Space Marines', emoji: '🚀', atk: 97, def: 62, spd: 68, morale: 80,
    special: 'LASER BARRAGE', spDesc: 'Orbital strike — 3× dmg',
    sFn: (s: BattleSide) => { s.eDmg += 2; },
    fl: ['Energy shields flicker online.', 'Trooper trips over his jetpack.', 'Plasma set to max regret.', 'For the Emperor! (probably)'],
  },
  {
    id: 'vikings', name: 'Viking Berserkers', emoji: '🪓', atk: 98, def: 48, spd: 66, morale: 110,
    special: 'BERSERK RAGE', spDesc: 'ATK +50, DEF -25',
    sFn: (s: BattleSide) => { s.tAtk += 50; s.tDef -= 25; },
    fl: ['Berserker bites his own shield.', 'Battle cry shatters eardrums.', 'Definitely on mushrooms.', 'VALHALLA!'],
  },
  {
    id: 'knights', name: 'Medieval Knights', emoji: '⚔️', atk: 78, def: 93, spd: 28, morale: 82,
    special: 'CAVALRY CHARGE', spDesc: '1000 horse-tons of steel',
    sFn: (s: BattleSide) => { s.eDmg += 1.5; },
    fl: ['Knight falls off horse. Gets back on.', 'Visor keeps fogging up.', 'Armour cost a castle.', 'Horse disagrees with strategy.'],
  },
  {
    id: 'ninjas', name: 'Ninja Clan', emoji: '🥷', atk: 87, def: 44, spd: 100, morale: 88,
    special: 'SHADOW VANISH', spDesc: '50% dodge this round',
    sFn: (s: BattleSide) => { s.dg += 0.5; },
    fl: ['You didn\'t see that.', 'Were never there.', 'Smoke bomb for effect.', 'Three ninjas fall from a tree.'],
  },
  {
    id: 'pirates', name: 'Pirate Crew', emoji: '🏴‍☠️', atk: 67, def: 52, spd: 58, morale: 73,
    special: 'BROADSIDE', spDesc: 'Cannons from... somewhere',
    sFn: (s: BattleSide) => { s.eDmg += 2.2; },
    fl: ['Three rums past competent.', 'Parrot gives away positions.', '"ARRRR" is a battle plan.', 'Cutlass stuck in shield.'],
  },
  {
    id: 'dinos', name: 'Laser Dinosaurs', emoji: '🦕', atk: 105, def: 72, spd: 48, morale: 999,
    special: 'METEOR STOMP', spDesc: 'The ground surrenders',
    sFn: (s: BattleSide) => { s.eDmg += 2.5; },
    fl: ['T-Rex fires laser. Nobody asks.', 'Evolution: rebooted with guns.', 'Raptor reloads with dexterity.', 'Brachio provides covering fire.'],
  },
  {
    id: 'zombies', name: 'Zombie Horde', emoji: '🧟', atk: 44, def: 38, spd: 18, morale: 9999,
    special: 'UNDYING WAVE', spDesc: '15% of fallen rise (cap 25%)',
    sFn: (s: BattleSide) => {
      s._tr = (s._tr as number) || 0;
      const cap = Math.floor(s.ss * 0.25);
      if (s._tr >= cap) return;
      const d = Math.max(0, s.ss - s.cs - s._tr);
      const r = Math.min(Math.floor(d * 0.15), cap - s._tr);
      if (r <= 0) return;
      s.cs += r;
      s._tr += r;
      (s as BattleSide & { _rr: number })._rr = r;
    },
    fl: ['They don\'t run. Don\'t need to.', 'One trips; seventeen follow.', 'Braaaains: non-regulation.', 'Still coming.'],
  },
  {
    id: 'samurai', name: 'Samurai Order', emoji: '⛩️', atk: 91, def: 74, spd: 77, morale: 97,
    special: 'IAIJUTSU', spDesc: 'Guaranteed crit — 3× dmg',
    sFn: (s: BattleSide) => { s.eDmg += 2; },
    fl: ['Silence before the draw.', 'Blade clears scabbard in 0.03s.', 'Poetry written mid-combat.', 'Seven fall before noticing.'],
  },
  {
    id: 'wizards', name: 'Wizard Council', emoji: '🧙', atk: 110, def: 30, spd: 20, morale: 65,
    special: 'ARCANE NUKE', spDesc: 'Immense power, tripped on robe',
    sFn: (s: BattleSide) => { s.eDmg += 3; },
    fl: ['Fireball goes slightly wrong.', 'Polymorphs themselves.', 'Spells cost more than the war.', 'Lightning bolt! Lightning bolt!'],
  },
];
