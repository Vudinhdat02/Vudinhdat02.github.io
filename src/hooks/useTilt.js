import { useCallback, useRef } from 'react';
import { isCoarsePointer } from './useDevice';

/**
 * 3D tilt + holographic glare. Writes CSS variables only (no React re-render),
 * so it stays at 60fps. On touch devices it falls back to a gentle press-scale.
 */
export function useTilt({ max = 12, scale = 1.03 } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el || e.pointerType === 'touch' || isCoarsePointer()) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
        el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.setProperty('--s', scale);
      });
    },
    [max, scale]
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--s', 1);
  }, []);

  // Touch: a gentle press-tilt toward the finger + scale-down (clean touch feedback)
  const onPointerDown = useCallback(
    (e) => {
      const el = ref.current;
      if (!el || e.pointerType !== 'touch') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.setProperty('--s', 0.97);
    },
    []
  );
  const onPointerUp = useCallback((e) => {
    if (e.pointerType === 'touch') onPointerLeave();
  }, [onPointerLeave]);

  return { ref, onPointerMove, onPointerLeave, onPointerDown, onPointerUp, onPointerCancel: onPointerLeave };
}
