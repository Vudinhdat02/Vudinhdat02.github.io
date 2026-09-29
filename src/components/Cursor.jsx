import { useEffect, useRef } from 'react';
import './Cursor.css';

const INTERACTIVE = 'a,button,input,textarea,select,label,[role="button"],[data-hover]';

/** Sci-fi crosshair cursor with a glowing, fading trail. Desktop (fine pointer) only. */
export default function Cursor() {
  const rootRef = useRef(null);
  const coordRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('custom-cursor');
    const root = rootRef.current, coord = coordRef.current, canvas = trailRef.current;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => { canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; };
    size();

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };
    const trail = [];
    let raf, visible = false, lastCoord = 0;

    const onMove = (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      target.x = e.clientX; target.y = e.clientY;
      if (!visible) { visible = true; root.style.opacity = 1; pos.x = target.x; pos.y = target.y; }
      const hovering = !!e.target.closest?.(INTERACTIVE);
      root.classList.toggle('is-hover', hovering);
      root.classList.toggle('is-text', !!e.target.closest?.('input,textarea'));
    };
    const onDown = () => root.classList.add('is-down');
    const onUp = () => root.classList.remove('is-down');
    const onLeave = () => { visible = false; root.style.opacity = 0; };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.35;
      pos.y += (target.y - pos.y) * 0.35;
      root.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      const now = performance.now();
      if (now - lastCoord > 60) {
        coord.textContent = `X:${String(Math.round(target.x)).padStart(4, '0')} Y:${String(Math.round(target.y)).padStart(4, '0')}`;
        lastCoord = now;
      }

      trail.push({ x: target.x, y: target.y, t: now });
      while (trail.length && now - trail[0].t > 260) trail.shift();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (visible && trail.length > 1) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) {
          const a = i / trail.length;
          ctx.strokeStyle = `rgba(6,182,212,${a * 0.75})`;
          ctx.shadowColor = 'rgba(6,182,212,0.9)'; ctx.shadowBlur = 8;
          ctx.lineWidth = a * 3;
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', size);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('custom-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', size);
    };
  }, []);

  return (
    <>
      <canvas ref={trailRef} className="cursor-trail" aria-hidden="true" />
      <div ref={rootRef} className="cursor" aria-hidden="true">
        <span className="cursor-ring" />
        <span className="cursor-dot" />
        <span className="cursor-line h l" /><span className="cursor-line h r" />
        <span className="cursor-line v t" /><span className="cursor-line v b" />
        <span className="cursor-corner tl" /><span className="cursor-corner tr" />
        <span className="cursor-corner bl" /><span className="cursor-corner br" />
        <span ref={coordRef} className="cursor-coord" />
      </div>
    </>
  );
}
