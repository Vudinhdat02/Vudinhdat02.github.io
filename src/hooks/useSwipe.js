import { useEffect } from 'react';

/**
 * Horizontal swipe detection on a target element.
 * Ignores gestures that start inside [data-noswipe] (carousels, inputs, terminal).
 */
export function useSwipe(ref, { onLeft, onRight, threshold = 70 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let sx = 0, sy = 0, st = 0, active = false;
    const start = (e) => {
      if (e.touches.length !== 1 || e.target.closest('[data-noswipe],input,textarea,select')) { active = false; return; }
      active = true;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = performance.now();
    };
    const end = (e) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.6 && performance.now() - st < 600) {
        dx < 0 ? onLeft?.() : onRight?.();
      }
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', end, { passive: true });
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchend', end); };
  }, [ref, onLeft, onRight, threshold]);
}
