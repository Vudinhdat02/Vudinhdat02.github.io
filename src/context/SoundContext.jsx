import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Tiny synthesized sound engine (Web Audio API) — no audio files needed.
 * Every cue is a short oscillator envelope, so it costs almost nothing.
 */
const SoundContext = createContext(null);

const CUES = {
  hover:   { type: 'sine',     f0: 1800, f1: 2200, dur: 0.035, gain: 0.025 },
  click:   { type: 'square',   f0: 620,  f1: 320,  dur: 0.07,  gain: 0.035 },
  key:     { type: 'square',   f0: 1200, f1: 900,  dur: 0.02,  gain: 0.015 },
  open:    { type: 'sawtooth', f0: 220,  f1: 880,  dur: 0.22,  gain: 0.03 },
  close:   { type: 'sawtooth', f0: 700,  f1: 160,  dur: 0.18,  gain: 0.03 },
  success: { type: 'triangle', f0: 660,  f1: 1320, dur: 0.3,   gain: 0.05 },
  error:   { type: 'square',   f0: 180,  f1: 90,   dur: 0.25,  gain: 0.04 },
  boot:    { type: 'sawtooth', f0: 60,   f1: 440,  dur: 0.9,   gain: 0.05 },
};

export function SoundProvider({ children }) {
  // Sound is always on. Browsers only allow audio after the first click / key press, so we unlock it then.
  const [enabled, setEnabled] = useState(true);
  const ctxRef = useRef(null);
  const lastRef = useRef({});

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  useEffect(() => {
    const unlock = () => {
      ensureCtx();
      if (ctxRef.current?.state === 'running') ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, unlock, true));
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, true));
    return () => ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, unlock, true));
  }, [ensureCtx]);

  const play = useCallback(
    (name, force = false) => {
      if (!enabled && !force) return;
      const cue = CUES[name];
      if (!cue) return;
      // throttle identical cues (hover spam)
      const now = performance.now();
      if (now - (lastRef.current[name] || 0) < 40) return;
      lastRef.current[name] = now;

      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = cue.type;
      osc.frequency.setValueAtTime(cue.f0, t);
      osc.frequency.exponentialRampToValueAtTime(cue.f1, t + cue.dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(cue.gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + cue.dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + cue.dur + 0.02);
    },
    [enabled, ensureCtx]
  );

  const setSound = useCallback(
    (on) => {
      if (on) ensureCtx();
      setEnabled(on);
    },
    [ensureCtx]
  );

  const value = useMemo(
    () => ({ enabled, setSound, toggle: () => setSound(!enabled), play }),
    [enabled, setSound, play]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export const useSound = () => useContext(SoundContext);
