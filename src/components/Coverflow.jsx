import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Icon from './Icons';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './Coverflow.css';

const SPRING = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 };

/** shortest distance around the ring, so the carousel loops forever */
const ringOffset = (i, active, n) => {
  let o = i - active;
  if (o > n / 2) o -= n;
  if (o < -n / 2) o += n;
  return o;
};

/**
 * 3D "cover flow" carousel.
 * items: [{ key, image, title, date, category, desc, star }]
 * Click a side card to bring it to the front; click the front card → onOpen(index).
 * Auto-plays (pauses while hovered / focused); arrows, dots, keyboard ← → and swipe work too.
 */
export default function Coverflow({ items, onOpen, autoplay = 4800, compact = false }) {
  const { t, tr } = useSettings();
  const { play } = useSound();
  const reduced = useReducedMotion();
  const n = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stageRef = useRef(null);

  const go = useCallback((d) => setActive((a) => (a + d + n) % n), [n]);
  useEffect(() => { if (active >= n) setActive(0); }, [n, active]);
  useEffect(() => {
    if (!autoplay || paused || n < 2 || reduced) return;
    const id = setInterval(() => go(1), autoplay);
    return () => clearInterval(id);
  }, [autoplay, paused, n, go, reduced]);

  // tilt + glare on the front card follow the pointer
  const onMove = (e) => {
    const el = e.currentTarget; const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
    el.style.setProperty('--tx', `${(y - 0.5) * -10}deg`); el.style.setProperty('--ty', `${(x - 0.5) * 12}deg`);
  };
  const onLeave = (e) => { const el = e.currentTarget; el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg'); };

  if (!n) return null;
  const cur = items[active] || items[0];
  const spread = compact ? 46 : 56;

  return (
    <div className={`cf3 ${compact ? 'compact' : ''}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <motion.div ref={stageRef} className="cf3-stage" data-noswipe tabIndex={0} role="listbox" aria-label={t('cf.aria')}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { go(1); play('click'); } if (e.key === 'ArrowLeft') { go(-1); play('click'); } if (e.key === 'Enter') onOpen?.(active); }}
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.12}
        onDragEnd={(_, info) => { if (info.offset.x < -50) go(1); else if (info.offset.x > 50) go(-1); }}>
        <span className="cf3-floor" aria-hidden="true" />
        {items.map((it, i) => {
          const o = ringOffset(i, active, n);
          const a = Math.abs(o);
          const hidden = a > 3;
          return (
            <motion.button type="button" key={it.key} role="option" aria-selected={o === 0}
              className={`cf3-card ${o === 0 ? 'front' : ''}`}
              style={{ zIndex: 20 - a, pointerEvents: hidden ? 'none' : 'auto' }}
              initial={false}
              animate={{
                x: `${o * spread}%`,
                rotateY: Math.max(-55, Math.min(55, -o * 40)),
                z: -a * 150,
                scale: o === 0 ? 1 : 0.92,
                opacity: hidden ? 0 : 1 - a * 0.2,
              }}
              transition={SPRING}
              onClick={() => { if (o === 0) { onOpen?.(i); play('open'); } else { setActive(i); play('click'); } }}
              onPointerMove={o === 0 ? onMove : undefined} onPointerLeave={o === 0 ? onLeave : undefined}
              tabIndex={-1}
            >
              <span className="cf3-inner">
                <span className="cf3-img">
                  {it.image
                    ? <><img className="cf3-bg" src={asset(it.image)} alt="" aria-hidden="true" loading="lazy" /><img className="cf3-fg" src={asset(it.image)} alt={tr(it.title)} loading="lazy" draggable={false} /></>
                    : <Icon name="trophy" size={48} />}
                </span>
                {it.star && <span className="cf3-star" aria-hidden="true"><Icon name="star" size={13} /></span>}
                <span className="cf3-glare" aria-hidden="true" />
                <span className="cf3-shine" aria-hidden="true" />
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="cf3-info" aria-live="polite">
        <button type="button" className="cf3-nav tap" onClick={() => { go(-1); play('click'); }} aria-label="Previous"><Icon name="chevronL" size={22} /></button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={cur.key} className="cf3-text"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28 }}>
            <span className="cf3-meta mono">
              {cur.date && <span className="cf3-date"><Icon name="flag" size={12} /> {tr(cur.date)}</span>}
              {cur.category && <span className="cf3-cat">{tr(cur.category)}</span>}
            </span>
            <h3 className="cf3-title display">{tr(cur.title)}</h3>
            {cur.desc && <p className="cf3-desc">{tr(cur.desc)}</p>}
          </motion.div>
        </AnimatePresence>
        <button type="button" className="cf3-nav tap" onClick={() => { go(1); play('click'); }} aria-label="Next"><Icon name="chevronR" size={22} /></button>
      </div>

      {n > 1 && (
        <div className="cf3-dots" role="tablist">
          {items.map((it, i) => (
            <button type="button" key={it.key} role="tab" aria-selected={i === active} aria-label={`${i + 1}`}
              className={`cf3-dot ${i === active ? 'on' : ''}`} onClick={() => { setActive(i); play('click'); }}>
              {i === active && !paused && autoplay && !reduced && <span className="cf3-progress" style={{ animationDuration: `${autoplay}ms` }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
