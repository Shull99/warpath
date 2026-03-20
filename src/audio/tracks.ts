export const PENTA = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00];
export const BASS_MENU = [65.41, 73.42, 82.41, 65.41];
export const BASS_BATTLE = [98.00, 110.00, 82.41, 98.00, 130.81, 98.00];

export const PAD_FREQS: Record<string, number[]> = {
  battle: [65.41, 98, 130.81],
  menu: [55, 82.5, 110],
};

export const LFO_CONFIG: Record<string, { freq: number; gain: number }> = {
  battle: { freq: 0.25, gain: 4 },
  menu: { freq: 0.12, gain: 6 },
};

export const TEMPOS: Record<string, number> = {
  battle: 320,
  menu: 700,
};
