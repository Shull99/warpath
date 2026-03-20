import type { Particle, Projectile, Flash } from '../types.ts';
import { BEHAVIORS } from '../factions/behaviors.ts';

export let particles: Particle[] = [];
export let projs: Projectile[] = [];
export let flashes: Flash[] = [];

const TP = 300;
const MP = 8;

export function initParticles(
  canvas: HTMLCanvasElement,
  a: number,
  b: number,
  fidA: string,
  fidB: string,
): void {
  particles = [];
  projs = [];
  flashes = [];
  const W = canvas.width;
  const H = canvas.height;
  const mid = W / 2;
  const tot = a + b;
  const cA = Math.max(MP, Math.round(TP * a / tot));
  const cB = Math.max(MP, TP - cA);
  const bA = BEHAVIORS[fidA] || BEHAVIORS['romans']!;
  const bB = BEHAVIORS[fidB] || BEHAVIORS['romans']!;

  for (let i = 0; i < cA; i++) {
    const fr = Math.random();
    let x: number, y: number;
    if (bA.formation === 'block') { x = 20 + Math.random() * (mid * 0.4); y = 20 + Math.random() * (H - 40); }
    else if (bA.formation === 'back' || bA.formation === 'grid') { x = 10 + Math.random() * (mid * 0.3); y = 15 + Math.random() * (H - 30); }
    else if (bA.formation === 'wedge') { x = 10 + fr * (mid * 0.6); y = H / 2 + (Math.random() - 0.5) * (H * 0.6) * (1 - fr * 0.5); }
    else if (bA.formation === 'line') { x = mid * 0.3 + Math.random() * 20; y = 10 + i / cA * (H - 20); }
    else if (bA.formation === 'horde') { x = 5 + Math.random() * (mid * 0.8); y = Math.random() * H; }
    else if (bA.formation === 'scatter') { x = 10 + Math.random() * (mid * 0.6); y = Math.random() * H; }
    else { x = 10 + Math.random() * (mid * 0.5); y = 10 + Math.random() * (H - 20); }
    particles.push({ tm: 'a', fid: fidA, al: true, op: 1, x, y, vx: 0, vy: 0, sz: bA.pSize + Math.random() * 0.6, fr });
  }

  for (let i = 0; i < cB; i++) {
    const fr = Math.random();
    let x: number, y: number;
    if (bB.formation === 'block') { x = mid + mid * 0.6 - Math.random() * (mid * 0.4); y = 20 + Math.random() * (H - 40); }
    else if (bB.formation === 'back' || bB.formation === 'grid') { x = W - 10 - Math.random() * (mid * 0.3); y = 15 + Math.random() * (H - 30); }
    else if (bB.formation === 'wedge') { x = W - 10 - fr * (mid * 0.6); y = H / 2 + (Math.random() - 0.5) * (H * 0.6) * (1 - fr * 0.5); }
    else if (bB.formation === 'line') { x = W - mid * 0.3 - Math.random() * 20; y = 10 + i / cB * (H - 20); }
    else if (bB.formation === 'horde') { x = mid + mid * 0.2 + Math.random() * (mid * 0.8); y = Math.random() * H; }
    else if (bB.formation === 'scatter') { x = mid + mid * 0.4 + Math.random() * (mid * 0.6); y = Math.random() * H; }
    else { x = mid + mid * 0.5 + Math.random() * (mid * 0.5); y = 10 + Math.random() * (H - 20); }
    particles.push({ tm: 'b', fid: fidB, al: true, op: 1, x, y, vx: 0, vy: 0, sz: bB.pSize + Math.random() * 0.6, fr });
  }
}

export function reviveParticles(tm: string, count: number, total: number, _fid: string): void {
  if (count <= 0) return;
  const dead = particles.filter(p => p.tm === tm && !p.al && p.op <= 0.05);
  if (!dead.length) return;
  const n = Math.max(1, Math.round(Math.min(dead.length, dead.length * count / Math.max(1, total))));
  for (let i = 0; i < Math.min(n, dead.length); i++) {
    dead[i]!.al = true;
    dead[i]!.op = 1;
    spawnFlash(dead[i]!.x, dead[i]!.y, '#aaffaa');
  }
}

export function killParticles(canvas: HTMLCanvasElement, tm: string, casualties: number, prev: number): void {
  if (prev <= 0) return;
  const alive = particles.filter(p => p.tm === tm && p.al);
  if (!alive.length) return;
  const fr = Math.min(1, casualties / prev);
  const n = Math.max(1, Math.round(alive.length * fr));
  alive.sort((a, b) => tm === 'a' ? b.x - a.x : a.x - b.x);
  for (let i = 0; i < Math.min(n, alive.length); i++) {
    alive[i]!.al = false;
    alive[i]!.op = 1;
    if (i < 5 && Math.random() < 0.6) spawnFlash(alive[i]!.x, alive[i]!.y, tm === 'a' ? '#ff6633' : '#33ff88');
  }
}

export function spawnFlash(x: number, y: number, c: string): void {
  flashes.push({ x, y, r: 4 + Math.random() * 8, l: 8, ml: 8, c });
}

export function stepParticles(canvas: HTMLCanvasElement, battleActive: boolean): void {
  const W = canvas.width;
  const H = canvas.height;
  const mid = W / 2;
  const ri = (a: number, b: number) => Math.floor(a + Math.random() * (b - a));

  particles.forEach(p => {
    if (!p.al) { p.op = Math.max(0, p.op - 0.03); return; }
    const bh = BEHAVIORS[p.fid] || BEHAVIORS['romans']!;
    const isL = p.tm === 'a';
    const aggr = bh.aggr;
    const spd = bh.spd;
    const erratic = bh.erratic;

    let targetX: number;
    if (isL) targetX = mid * 0.3 + aggr * (mid * 0.7);
    else targetX = W - mid * 0.3 - aggr * (mid * 0.7);

    p.vx += (targetX - p.x) * 0.002 * spd;

    if (bh.formation === 'block' || bh.formation === 'line') {
      p.vy += (H / 2 - p.y) * 0.003 * (1 - bh.spread);
    } else {
      p.vy += (Math.random() - 0.5) * erratic * 0.3;
    }

    p.vx += (Math.random() - 0.5) * erratic * 0.12;
    p.vy += (Math.random() - 0.5) * erratic * 0.12;

    if (bh.teleport && Math.random() < 0.005) {
      p.x += (Math.random() - 0.5) * 40;
      p.y += (Math.random() - 0.5) * 30;
      spawnFlash(p.x, p.y, isL ? '#39ff14' : '#ff3939');
    }

    if (bh.charge && battleActive) {
      p.vx += (isL ? 1 : -1) * 0.02 * spd;
    }

    if (p.x < 4) p.vx += 0.15;
    if (p.x > W - 4) p.vx -= 0.15;
    if (p.y < 4) p.vy += 0.1;
    if (p.y > H - 4) p.vy -= 0.1;

    p.vx *= 0.94;
    p.vy *= 0.94;
    p.x += p.vx * spd;
    p.y += p.vy * spd;

    if (bh.ranged && Math.random() < (bh.projRate || 0.02) && p.al) {
      const tx = isL ? mid + ri(20, mid - 20) : mid - ri(20, mid - 20);
      const ty = p.y + (Math.random() - 0.5) * 40;
      projs.push({ x: p.x, y: p.y, tx, ty, tm: p.tm, life: 30, spd: 3 + Math.random() * 2, col: isL ? '#39ff14' : '#ff3939' });
    }
  });

  projs.forEach(pr => {
    const dx = pr.tx - pr.x, dy = pr.ty - pr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pr.spd || pr.life <= 0) { pr.life = -1; spawnFlash(pr.x, pr.y, pr.col); return; }
    pr.x += dx / dist * pr.spd;
    pr.y += dy / dist * pr.spd;
    pr.life--;
  });
  projs = projs.filter(pr => pr.life >= 0);
  flashes = flashes.filter(f => f.l > 0);
  flashes.forEach(f => f.l--);
}
