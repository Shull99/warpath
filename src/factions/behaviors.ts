import type { ParticleBehavior } from '../types.ts';

export const BEHAVIORS: Record<string, ParticleBehavior> = {
  romans:  { aggr: .35, spread: .25, spd: .4, erratic: .1,  ranged: false, pSize: 1.6, formation: 'block' },
  space:   { aggr: .15, spread: .45, spd: .5, erratic: .15, ranged: true, projRate: .04, pSize: 1.4, formation: 'grid' },
  vikings: { aggr: .85, spread: .6,  spd: .9, erratic: .4,  ranged: false, pSize: 1.7, formation: 'wedge' },
  knights: { aggr: .5,  spread: .35, spd: .35, erratic: .12, ranged: false, pSize: 1.8, formation: 'line', charge: true },
  ninjas:  { aggr: .55, spread: .9,  spd: 1.3, erratic: .7, ranged: false, pSize: 1.2, formation: 'scatter', teleport: true },
  pirates: { aggr: .4,  spread: .7,  spd: .45, erratic: .35, ranged: true, projRate: .025, pSize: 1.5, formation: 'loose' },
  dinos:   { aggr: .6,  spread: .5,  spd: .5, erratic: .2,  ranged: true, projRate: .025, pSize: 2.3, formation: 'scatter' },
  zombies: { aggr: .95, spread: .85, spd: .12, erratic: .5, ranged: false, pSize: 1.4, formation: 'horde' },
  samurai: { aggr: .45, spread: .3,  spd: .85, erratic: .15, ranged: false, pSize: 1.5, formation: 'line' },
  wizards: { aggr: 0,   spread: .4,  spd: .15, erratic: .1, ranged: true, projRate: .06, pSize: 1.3, formation: 'back' },
};
