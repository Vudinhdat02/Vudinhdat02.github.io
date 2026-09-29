import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useSound } from '../context/SoundContext';
import { useSettings } from '../context/SettingsContext';
import { LangToggle } from './SettingsToggles';
import './BootSequence.css';

// Which lines end with an [ OK ] status (the first line is a plain banner)
const HAS_STATUS = [false, true, true, true, true, true, true];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function BootSequence({ onComplete }) {
  const { t } = useSettings();
  const LINES = t('boot.lines');
  const linesRef = useRef(LINES);
  linesRef.current = LINES;

  // progress per line: number of characters typed + whether its status is shown
  const [typed, setTyped] = useState([]);
  const [progress, setProgress] = useState(0);
  const [granted, setGranted] = useState(false);
  const fast = useRef(false);
  const leaving = useRef(false);
  const rootRef = useRef(null);
  const { setSound, play } = useSound();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await sleep(300);
      for (let i = 0; i < HAS_STATUS.length; i++) {
        const len = linesRef.current[i].length;
        for (let c = 1; c <= len; c++) {
          if (cancelled) return;
          setTyped((prev) => { const n = [...prev]; n[i] = { n: c, ok: false }; return n; });
          if (!fast.current) await sleep(12 + Math.random() * 14);
        }
        setTyped((prev) => { const n = [...prev]; n[i] = { n: 999, ok: false }; return n; });
        if (HAS_STATUS[i]) {
          if (!fast.current) await sleep(120 + Math.random() * 180);
          setTyped((prev) => { const n = [...prev]; n[i] = { n: 999, ok: true }; return n; });
        }
        setProgress(Math.round(((i + 1) / HAS_STATUS.length) * 100));
      }
      if (cancelled) return;
      await sleep(fast.current ? 50 : 300);
      setGranted(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const enter = (withAudio) => {
    if (leaving.current) return;
    if (!granted) { fast.current = true; return; }
    leaving.current = true;
    if (withAudio !== undefined) setSound(withAudio);
    if (withAudio) setTimeout(() => play('boot', true), 20);
    const el = rootRef.current;
    const tl = gsap.timeline({ onComplete });
    tl.to(el.querySelector('.boot-granted'), { scale: 1.08, duration: 0.15, ease: 'power2.out' })
      .to(el, { filter: 'brightness(2.2)', duration: 0.12 })
      .to(el, { scaleY: 0.004, duration: 0.28, ease: 'power4.in' })
      .to(el, { scaleX: 0, opacity: 0, duration: 0.22, ease: 'power3.in' });
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') enter(); else if (!granted) fast.current = true; };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const lastIdx = typed.length - 1;

  return (
    <div className="boot" data-theme="dark" onClick={() => enter()} role="dialog" aria-label={t('boot.aria')}>
      <div className="boot-lang" onClick={(e) => e.stopPropagation()}><LangToggle /></div>
      <div ref={rootRef} className="boot-screen">
        <div className="boot-term mono" aria-live="polite">
          {typed.map((l, i) => l && (
            <div key={i} className="boot-line">
              <span className="boot-prompt">&gt;</span>
              <span className="boot-text">{LINES[i].slice(0, l.n)}{!l.ok && i === lastIdx && !granted && <span className="boot-caret" />}</span>
              {HAS_STATUS[i] && <span className="boot-dots" />}
              {l.ok && <span className="boot-ok">[ OK ]</span>}
            </div>
          ))}
        </div>

        <div className="boot-progress" aria-hidden="true">
          <div className="boot-progress-bar" style={{ width: `${progress}%` }} />
          <span className="mono">{String(progress).padStart(3, '0')}%</span>
        </div>

        {granted && (
          <div className="boot-granted-wrap">
            <h1 className="boot-granted display glitch is-glitching" data-text={t('boot.granted')}>{t('boot.granted')}</h1>
            <p className="mono boot-sub">{t('boot.welcome')}</p>
            <div className="boot-actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn primary tap" onClick={() => enter(true)}>{t('boot.engage')}</button>
              <button className="btn tap" onClick={() => enter(false)}>{t('boot.silent')}</button>
            </div>
            <p className="mono boot-hint">{t('boot.hint')}</p>
          </div>
        )}
        {!granted && <p className="mono boot-skip">{t('boot.skip')}</p>}
      </div>
    </div>
  );
}
