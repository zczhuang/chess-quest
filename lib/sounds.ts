'use client';

// Tiny WebAudio synth — no audio assets needed. All sounds are generated:
// move click, capture thock, success chime, error buzz, victory fanfare.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, startAt: number, duration: number, type: OscillatorType, volume: number) {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + startAt;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

const MUTE_KEY = 'cq.muted';
export const isMuted = () => typeof window !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
export const setMuted = (m: boolean) => localStorage.setItem(MUTE_KEY, m ? '1' : '0');

function play(fn: () => void) {
  if (isMuted()) return;
  try {
    fn();
  } catch {
    /* audio is best-effort */
  }
}

export const sfx = {
  move: () => play(() => tone(420, 0, 0.07, 'sine', 0.18)),
  capture: () => play(() => { tone(300, 0, 0.08, 'square', 0.12); tone(180, 0.02, 0.1, 'sine', 0.15); }),
  check: () => play(() => { tone(620, 0, 0.09, 'triangle', 0.2); tone(740, 0.08, 0.12, 'triangle', 0.2); }),
  correct: () => play(() => { tone(523, 0, 0.12, 'sine', 0.2); tone(659, 0.09, 0.12, 'sine', 0.2); tone(784, 0.18, 0.18, 'sine', 0.22); }),
  wrong: () => play(() => { tone(220, 0, 0.15, 'sawtooth', 0.08); tone(185, 0.1, 0.2, 'sawtooth', 0.08); }),
  star: () => play(() => { tone(880, 0, 0.1, 'sine', 0.18); tone(1175, 0.07, 0.14, 'sine', 0.18); }),
  fanfare: () =>
    play(() => {
      tone(523, 0, 0.15, 'triangle', 0.2);
      tone(659, 0.12, 0.15, 'triangle', 0.2);
      tone(784, 0.24, 0.15, 'triangle', 0.2);
      tone(1047, 0.36, 0.35, 'triangle', 0.24);
      tone(784, 0.36, 0.35, 'sine', 0.12);
    }),
  defeat: () => play(() => { tone(330, 0, 0.2, 'sine', 0.15); tone(294, 0.18, 0.2, 'sine', 0.15); tone(262, 0.36, 0.3, 'sine', 0.15); }),
};
