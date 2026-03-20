import { particles, projs, flashes, stepParticles } from './particles.ts';

let animFrame: number | null = null;

export function resizeCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  canvas.width = canvas.offsetWidth;
  canvas.height = 160;
  return canvas.getContext('2d')!;
}

export function startAnimLoop(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, battleActive: () => boolean): void {
  function loop(): void {
    stepParticles(canvas, battleActive());
    drawCanvas(canvas, ctx);
    animFrame = requestAnimationFrame(loop);
  }
  loop();
}

export function stopAnimLoop(): void {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}

export function getAnimFrame(): number | null {
  return animFrame;
}

function drawCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0c0a';
  ctx.fillRect(0, 0, W, H);

  // Clash zone glow
  const cg = ctx.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0);
  cg.addColorStop(0, 'transparent');
  cg.addColorStop(0.5, 'rgba(255,215,0,0.04)');
  cg.addColorStop(1, 'transparent');
  ctx.fillStyle = cg;
  ctx.fillRect(W / 2 - 40, 0, 80, H);

  // Dead particles (grey dots)
  particles.filter(p => !p.al && p.op > 0).forEach(p => {
    ctx.globalAlpha = p.op * 0.3;
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Alive particles
  particles.filter(p => p.al).forEach(p => {
    const col = p.tm === 'a' ? '#39ff14' : '#ff3939';
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Projectiles
  projs.forEach(pr => {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = pr.col;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(pr.x - (pr.tx - pr.x > 0 ? 3 : -3), pr.y, 1, 0, Math.PI * 2);
    ctx.fill();
  });

  // Flashes
  flashes.forEach(f => {
    ctx.globalAlpha = (f.l / f.ml) * 0.6;
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * (1 - f.l / f.ml) * 2 + 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}
