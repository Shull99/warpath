import { TD_PATH, getTDState, tdTick } from './engine.ts';

let animId: number | null = null;
let lastTime = 0;
let fogCanvas: HTMLCanvasElement | null = null;
let fogW = 0;
let fogH = 0;

const LW = 600;
const LH = 300;
const PATH_W = 28;
const FOG_OPACITY = 0.82;
const PATH_CORRIDOR_MULT = 1.15;
const CASTLE_CLEAR_RADIUS = 26;
const SPAWN_CLEAR_RADIUS = 22;
const DEBUG_OUTER_ALPHA = 0.35;
const DEBUG_DOT_ALPHA = 0.8;
const DEBUG_BAR_ALPHA = 0.85;
const DEBUG_LABEL_ALPHA = 0.72;
const HUD_ALPHA = 0.9;

function buildFogCanvas(W: number, H: number): HTMLCanvasElement {
  const fc = document.createElement('canvas');
  fc.width = W;
  fc.height = H;
  const fctx = fc.getContext('2d')!;
  const sx = W / LW;
  const sy = H / LH;

  fctx.fillStyle = `rgba(0,0,0,${FOG_OPACITY})`;
  fctx.fillRect(0, 0, W, H);

  fctx.globalCompositeOperation = 'destination-out';
  fctx.strokeStyle = 'rgba(255,255,255,1)';
  fctx.lineWidth = PATH_W * sx * PATH_CORRIDOR_MULT;
  fctx.lineCap = 'round';
  fctx.lineJoin = 'round';
  fctx.beginPath();
  TD_PATH.forEach((pt, i) => {
    if (i === 0) fctx.moveTo(pt.x * sx, pt.y * sy);
    else fctx.lineTo(pt.x * sx, pt.y * sy);
  });
  fctx.stroke();

  const last = TD_PATH[TD_PATH.length - 1]!;
  fctx.beginPath();
  fctx.arc(last.x * sx, last.y * sy, CASTLE_CLEAR_RADIUS * sx, 0, Math.PI * 2);
  fctx.fill();

  const first = TD_PATH[0]!;
  fctx.beginPath();
  fctx.arc(first.x * sx, first.y * sy, SPAWN_CLEAR_RADIUS * sx, 0, Math.PI * 2);
  fctx.fill();

  return fc;
}

export function startTDLoop(canvas: HTMLCanvasElement): void {
  stopTDLoop();
  lastTime = performance.now();
  function frame(now: number): void {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    tdTick(dt);
    drawTD(canvas);
    animId = requestAnimationFrame(frame);
  }
  animId = requestAnimationFrame(frame);
}

export function stopTDLoop(): void {
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function drawTD(canvas: HTMLCanvasElement): void {
  if (canvas.width !== canvas.offsetWidth || canvas.height !== 300) {
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = 300;
    fogCanvas = null;
  }

  const W = canvas.width;
  const H = canvas.height;
  if (W === 0 || H === 0) return;

  const ctx = canvas.getContext('2d')!;
  const sx = W / LW;
  const sy = H / LH;
  const px = (x: number) => x * sx;
  const py = (y: number) => y * sy;
  const state = getTDState();

  if (!fogCanvas || fogW !== W || fogH !== H) {
    fogCanvas = buildFogCanvas(W, H);
    fogW = W;
    fogH = H;
  }

  ctx.fillStyle = '#090b09';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(57,255,20,0.05)';
  ctx.lineWidth = px(PATH_W + 6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  TD_PATH.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(px(pt.x), py(pt.y));
    else ctx.lineTo(px(pt.x), py(pt.y));
  });
  ctx.stroke();

  ctx.strokeStyle = '#0d160d';
  ctx.lineWidth = px(PATH_W);
  ctx.beginPath();
  TD_PATH.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(px(pt.x), py(pt.y));
    else ctx.lineTo(px(pt.x), py(pt.y));
  });
  ctx.stroke();

  const sp = TD_PATH[0]!;
  ctx.fillStyle = '#1a4a1a';
  ctx.beginPath();
  ctx.arc(px(sp.x), py(sp.y), px(14), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#39ff14';
  ctx.font = `bold ${px(13)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▶', px(sp.x), py(sp.y));

  const cs = TD_PATH[TD_PATH.length - 1]!;
  ctx.fillStyle = '#1a120a';
  ctx.beginPath();
  ctx.arc(px(cs.x), py(cs.y), px(18), 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${px(22)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏰', px(cs.x), py(cs.y));

  ctx.drawImage(fogCanvas, 0, 0);

  if (state.debugOverlay) {
    ctx.save();
    for (const e of state.enemies) {
      const ex = px(e.x);
      const ey = py(e.y);
      ctx.globalAlpha = DEBUG_OUTER_ALPHA;
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.arc(ex, ey, px(10), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = DEBUG_DOT_ALPHA;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(ex, ey, px(5), 0, Math.PI * 2);
      ctx.fill();
      const bw = px(18);
      const bh = Math.max(2, py(3));
      ctx.globalAlpha = DEBUG_BAR_ALPHA;
      ctx.fillStyle = '#222';
      ctx.fillRect(ex - bw / 2, ey - py(15), bw, bh);
      ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#39ff14' : '#ffd700';
      ctx.fillRect(ex - bw / 2, ey - py(15), bw * (e.hp / e.maxHp), bh);
    }
    ctx.restore();
    ctx.globalAlpha = DEBUG_LABEL_ALPHA;
    ctx.fillStyle = '#ffcc00';
    ctx.font = `${Math.max(9, py(8))}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`[D] DEBUG ON — ${state.enemies.length} enemies`, 6, 4);
    ctx.globalAlpha = 1;
  }

  const hpPct = state.castleHp / state.maxCastleHp;
  const barW = px(90);
  const barH = Math.max(6, py(8));
  ctx.globalAlpha = HUD_ALPHA;
  ctx.fillStyle = '#111';
  ctx.fillRect(W - barW - 8, 6, barW, barH);
  ctx.fillStyle = hpPct > 0.5 ? '#39ff14' : hpPct > 0.25 ? '#ffd700' : '#ff3939';
  ctx.fillRect(W - barW - 8, 6, barW * hpPct, barH);
  ctx.globalAlpha = DEBUG_DOT_ALPHA;
  ctx.fillStyle = '#c8e6c9';
  ctx.font = `${Math.max(8, py(8))}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`🏰 ${state.castleHp}/${state.maxCastleHp}`, W - 6, barH + 8);
  ctx.textAlign = 'left';
  ctx.fillText(`WAVE ${state.wave} · ${state.enemies.length} active`, 6, barH + 8);
  ctx.globalAlpha = 1;
}
