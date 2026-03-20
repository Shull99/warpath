import { PENTA, BASS_MENU, BASS_BATTLE, PAD_FREQS, LFO_CONFIG, TEMPOS } from './tracks.ts';

let AC: AudioContext | null = null;
let aOn = false;
let MG: GainNode | null = null;
let ambNodes: { o: OscillatorNode; g: GainNode }[] = [];
let musicNodes: { o: OscillatorNode; g: GainNode }[] = [];
let musicMode = 'menu';
let musicTimer: ReturnType<typeof setInterval> | null = null;
let bassIdx = 0;

function initAC(): void {
  if (AC) return;
  AC = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  MG = AC.createGain();
  MG.gain.value = 0;
  MG.connect(AC.destination);
}

export function toggleAudio(): void {
  initAC();
  aOn = !aOn;
  const b = document.getElementById('atog')!;
  if (aOn) {
    b.textContent = '♪ ON';
    b.classList.add('on');
    MG!.gain.setTargetAtTime(0.25, AC!.currentTime, 0.2);
    startMusic(musicMode);
  } else {
    b.textContent = '♪ OFF';
    b.classList.remove('on');
    MG!.gain.setTargetAtTime(0, AC!.currentTime, 0.2);
    stopMusic();
  }
}

export function setMusicMode(mode: string): void {
  musicMode = mode;
  if (aOn) {
    stopMusic();
    startMusic(mode);
  }
}

function startMusic(mode: string): void {
  stopMusic();
  if (!AC || !aOn) return;

  const padFreqs = PAD_FREQS[mode] || PAD_FREQS['menu']!;
  padFreqs.forEach(f => {
    const o = AC!.createOscillator();
    const g = AC!.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.value = mode === 'battle' ? 0.04 : 0.05;
    o.connect(g);
    g.connect(MG!);
    o.start();
    ambNodes.push({ o, g });
  });

  const lfoConf = LFO_CONFIG[mode] || LFO_CONFIG['menu']!;
  const lfo = AC.createOscillator();
  const lg = AC.createGain();
  lfo.frequency.value = lfoConf.freq;
  lg.gain.value = lfoConf.gain;
  lfo.connect(lg);
  if (ambNodes[0]) lg.connect(ambNodes[0].o.frequency);
  lfo.start();
  ambNodes.push({ o: lfo, g: lg });

  bassIdx = 0;
  const bassArr = mode === 'battle' ? BASS_BATTLE : BASS_MENU;
  const tempo = TEMPOS[mode] || TEMPOS['menu']!;

  musicTimer = setInterval(() => {
    if (!AC || !aOn) return;
    const now = AC.currentTime;

    const bn = bassArr[bassIdx % bassArr.length]!;
    bassIdx++;
    const bo = AC.createOscillator();
    const bg = AC.createGain();
    bo.type = 'triangle';
    bo.frequency.value = bn;
    bg.gain.setValueAtTime(0.035, now);
    bg.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'battle' ? 0.25 : 0.5));
    bo.connect(bg);
    bg.connect(MG!);
    bo.start(now);
    bo.stop(now + 0.6);

    if (bassIdx % 2 === 0 && Math.random() < (mode === 'battle' ? 0.6 : 0.4)) {
      const mn = PENTA[Math.floor(Math.random() * PENTA.length)]! * (mode === 'battle' ? 1 : 0.5);
      const mo = AC.createOscillator();
      const mg = AC.createGain();
      mo.type = mode === 'battle' ? 'square' : 'sine';
      mo.frequency.value = mn;
      mg.gain.setValueAtTime(mode === 'battle' ? 0.015 : 0.02, now);
      mg.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'battle' ? 0.15 : 0.35));
      mo.connect(mg);
      mg.connect(MG!);
      mo.start(now);
      mo.stop(now + 0.4);
    }

    if (mode === 'battle' && bassIdx % 2 === 0) {
      const no = AC.createOscillator();
      const ng = AC.createGain();
      no.type = 'sawtooth';
      no.frequency.setValueAtTime(60, now);
      no.frequency.exponentialRampToValueAtTime(30, now + 0.06);
      ng.gain.setValueAtTime(0.04, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      no.connect(ng);
      ng.connect(MG!);
      no.start(now);
      no.stop(now + 0.1);
    }

    if (mode === 'battle' && Math.random() < 0.5) {
      const buf = AC.createBuffer(1, AC.sampleRate * 0.03, AC.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const bs = AC.createBufferSource();
      const ng = AC.createGain();
      bs.buffer = buf;
      ng.gain.setValueAtTime(0.02, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      bs.connect(ng);
      ng.connect(MG!);
      bs.start(now);
    }
  }, tempo);
}

function stopMusic(): void {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  ambNodes.forEach(n => { try { n.o.stop(); } catch (_e) { /* already stopped */ } });
  ambNodes = [];
  musicNodes.forEach(n => { try { n.o.stop(); } catch (_e) { /* already stopped */ } });
  musicNodes = [];
}

export function sfx(t: string): void {
  if (!aOn || !AC) return;
  const n = AC.currentTime;
  if (t === 'click') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = 600 + Math.random() * 200;
    g.gain.setValueAtTime(0.04, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.04);
    o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.06);
  } else if (t === 'hover') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = 400;
    g.gain.setValueAtTime(0.01, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.02);
    o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.04);
  } else if (t === 'hit') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = 70 + Math.random() * 50;
    g.gain.setValueAtTime(0.06, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.07);
    o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.1);
  } else if (t === 'special') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, n); o.frequency.exponentialRampToValueAtTime(900, n + 0.12);
    g.gain.setValueAtTime(0.05, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.2);
    o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.25);
  } else if (t === 'evolve') {
    [400, 520, 660].forEach((f, i) => {
      const o = AC!.createOscillator(), g = AC!.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, n + i * 0.07);
      g.gain.linearRampToValueAtTime(0.04, n + i * 0.07 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, n + i * 0.07 + 0.18);
      o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.4);
    });
  } else if (t === 'victory') {
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = AC!.createOscillator(), g = AC!.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, n + i * 0.12);
      g.gain.linearRampToValueAtTime(0.06, n + i * 0.12 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, n + i * 0.12 + 0.5);
      o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.9);
    });
  } else if (t === 'defeat') {
    [200, 160, 120, 90].forEach((f, i) => {
      const o = AC!.createOscillator(), g = AC!.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0, n + i * 0.18);
      g.gain.linearRampToValueAtTime(0.03, n + i * 0.18 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, n + i * 0.18 + 0.4);
      o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 1);
    });
  } else if (t === 'tactic') {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(300, n); o.frequency.linearRampToValueAtTime(600, n + 0.08);
    g.gain.setValueAtTime(0.06, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.15);
    o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.2);
  } else if (t === 'gold') {
    [800, 1000, 1200].forEach((f, i) => {
      const o = AC!.createOscillator(), g = AC!.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, n + i * 0.05);
      g.gain.linearRampToValueAtTime(0.03, n + i * 0.05 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, n + i * 0.05 + 0.1);
      o.connect(g); g.connect(MG!); o.start(n); o.stop(n + 0.3);
    });
  }
}

export function initAudioListeners(): void {
  document.addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('.btn,.fc,.ec,.sc,.rc,.roc,.sb-btn,.tac-btn,.spd-btn')) sfx('click');
  });
  document.addEventListener('mouseover', e => {
    if ((e.target as HTMLElement).closest('.btn,.fc,.ec,.sc,.rc,.roc,.sb-btn')) sfx('hover');
  });
}
