import { useEffect, useRef } from 'react';
import './TouchFeedback.css';

/**
 * Native-feeling touch feedback: a holographic ripple at the touch point
 * plus a short haptic tick (navigator.vibrate) where supported.
 */
export default function TouchFeedback() {
  const layer = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (e.pointerType !== 'touch') return;
      const el = document.createElement('span');
      el.className = 'touch-ripple';
      el.style.left = e.clientX + 'px';
      el.style.top = e.clientY + 'px';
      layer.current?.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
      if (e.target.closest?.('button,a,[role="button"]') && navigator.vibrate) {
        try { navigator.vibrate(8); } catch { /* ignore */ }
      }
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
  return <div ref={layer} className="touch-layer" aria-hidden="true" />;
}
