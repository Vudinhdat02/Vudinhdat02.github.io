import { useRef } from 'react';
import { motion } from 'framer-motion';
import ScrambleText from './fx/ScrambleText';
import './OSWindow.css';

/**
 * Glass OS window panel: title decodes on appear, a soft spotlight follows the cursor,
 * and the whole panel slides/unfolds in. `enter` picks the entrance: 'unfold' | 'rise' | 'zoom' | 'side'.
 */
const ENTER = {
  // transform + opacity only → the GPU just moves an already-painted layer (no per-frame repaint)
  unfold: { initial: { opacity: 0, y: 18, scaleY: 0.92 }, animate: { opacity: 1, y: 0, scaleY: 1 } },
  rise:   { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 } },
  zoom:   { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } },
  side:   { initial: { opacity: 0, x: 44 }, animate: { opacity: 1, x: 0 } },
};

export default function OSWindow({ title, children, className = '', delay = 0, accent = 'cyan', enter = 'unfold', ...rest }) {
  const ref = useRef(null);
  const e = ENTER[enter] || ENTER.unfold;
  const onMove = (ev) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', `${ev.clientX - r.left}px`);
    el.style.setProperty('--sy', `${ev.clientY - r.top}px`);
  };
  return (
    <motion.section
      ref={ref}
      className={`oswin glass accent-${accent} ${className}`}
      initial={e.initial}
      animate={e.animate}
      transition={{ duration: 0.5, delay: delay * 0.7, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={onMove}
      style={{ willChange: 'transform, opacity', transformOrigin: '50% 0%' }}
      {...rest}
    >
      <header className="oswin-bar">
        <span className="oswin-dots" aria-hidden="true"><i /><i /><i /></span>
        <h2 className="oswin-title"><ScrambleText text={title} delay={delay * 700 + 120} duration={450} /></h2>
      </header>
      <div className="oswin-body">{children}</div>
      <span className="oswin-spot" aria-hidden="true" />
      <span className="oswin-corner tl" aria-hidden="true" /><span className="oswin-corner tr" aria-hidden="true" />
      <span className="oswin-corner bl" aria-hidden="true" /><span className="oswin-corner br" aria-hidden="true" />
    </motion.section>
  );
}
