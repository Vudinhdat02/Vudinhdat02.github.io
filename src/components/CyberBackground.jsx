import { useEffect, useRef } from 'react';

/**
 * Interactive Canvas background: a spring-loaded particle grid that reacts to
 * the cursor / touch, glowing circuit traces with travelling data pulses,
 * and a shared "camera" that GSAP animates during page transitions.
 *
 * Performance: pointer:coarse devices get 50% particle density, capped DPR,
 * fewer traces; the loop pauses when the tab is hidden.
 */
export const camera = { zoom: 1, x: 0, y: 0, glitch: 0, hue: 0 };

const rand = (a, b) => a + Math.random() * (b - a);

// Colour palettes per theme (RGB triplets as strings for fast rgba() building)
const PALETTES = {
  dark: {
    trace: 'rgba(56,189,248,0.10)', traceEnd: 'rgba(56,189,248,0.35)', pulse: '6,182,212', gold: '251,191,36',
    node: 'rgba(148,163,184,0.22)', hot: '56,189,248', link1: '6,182,212', link2: '96,165,250',
    shock: '56,189,248', mote: 'rgba(96,165,250,0.5)',
  },
  light: {
    trace: 'rgba(3,105,161,0.13)', traceEnd: 'rgba(3,105,161,0.45)', pulse: '14,116,144', gold: '194,65,12',
    node: 'rgba(71,85,105,0.28)', hot: '3,105,161', link1: '14,116,144', link2: '37,99,235',
    shock: '3,105,161', mote: 'rgba(37,99,235,0.35)',
  },
};

export default function CyberBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Base spacing; halving the particle count means spacing * sqrt(2).
    const BASE_SPACING = 44;
    const SPACING = coarse ? Math.round(BASE_SPACING * Math.SQRT2) : BASE_SPACING;
    const DPR = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
    const RADIUS = coarse ? 130 : 170;
    const TRACE_COUNT = coarse ? 7 : 14;

    let w = 0, h = 0, cols = 0, rows = 0, ox = 0, oy = 0;
    let nodes = [];      // Float32Array-like objects for speed
    let traces = [];
    let motes = [];
    const pointer = { x: -9999, y: -9999, sx: -9999, sy: -9999, active: false };
    const shocks = [];
    let raf = 0, running = true, t0 = performance.now();

    function build() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * DPR); canvas.height = Math.floor(h * DPR);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';

      // cover 130% of viewport so camera zoom-out never reveals edges
      const cw = w * 1.3, ch = h * 1.3;
      cols = Math.ceil(cw / SPACING) + 1; rows = Math.ceil(ch / SPACING) + 1;
      ox = (w - (cols - 1) * SPACING) / 2; oy = (h - (rows - 1) * SPACING) / 2;
      nodes = new Array(cols * rows);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const hx = ox + c * SPACING, hy = oy + r * SPACING;
        nodes[r * cols + c] = { hx, hy, x: hx, y: hy, vx: 0, vy: 0, e: 0, tw: Math.random() * 6.28 };
      }

      traces = [];
      for (let i = 0; i < TRACE_COUNT; i++) traces.push(makeTrace());

      const moteCount = coarse ? 18 : 36;
      motes = Array.from({ length: moteCount }, () => ({ x: rand(0, w), y: rand(0, h), v: rand(6, 22), a: rand(0.15, 0.5), r: rand(0.6, 1.6) }));
    }

    function makeTrace() {
      let c = Math.floor(rand(2, cols - 2)), r = Math.floor(rand(2, rows - 2));
      const pts = [[ox + c * SPACING, oy + r * SPACING]];
      let dir = Math.floor(rand(0, 4));
      const steps = Math.floor(rand(5, 12));
      for (let s = 0; s < steps; s++) {
        if (Math.random() < 0.45) dir = (dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
        const len = Math.floor(rand(1, 4));
        c += [1, 0, -1, 0][dir] * len; r += [0, 1, 0, -1][dir] * len;
        c = Math.max(0, Math.min(cols - 1, c)); r = Math.max(0, Math.min(rows - 1, r));
        pts.push([ox + c * SPACING, oy + r * SPACING]);
      }
      const segs = []; let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        segs.push(l); total += l;
      }
      return { pts, segs, total: Math.max(total, 1), speed: rand(60, 160), off: rand(0, 2000), gold: Math.random() < 0.12 };
    }

    function pointAt(tr, d) {
      d = Math.max(0, Math.min(tr.total, d));
      for (let i = 0; i < tr.segs.length; i++) {
        if (d <= tr.segs[i]) {
          const p = tr.pts[i], q = tr.pts[i + 1], k = tr.segs[i] ? d / tr.segs[i] : 0;
          return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
        }
        d -= tr.segs[i];
      }
      return tr.pts[tr.pts.length - 1];
    }

    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
      const time = now / 1000;
      const P = PALETTES[document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'];

      // smooth pointer
      pointer.sx += (pointer.x - pointer.sx) * 0.18;
      pointer.sy += (pointer.y - pointer.sy) * 0.18;

      // parallax & camera
      const parX = pointer.active ? (pointer.sx / w - 0.5) * -18 : 0;
      const parY = pointer.active ? (pointer.sy / h - 0.5) * -18 : 0;
      const z = camera.zoom;
      const cx = w / 2 + camera.x + parX, cy = h / 2 + camera.y + parY;
      // pointer in world space
      const px = (pointer.sx - cx) / z + w / 2;
      const py = (pointer.sy - cy) / z + h / 2;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);

      // ---- circuit traces (static, dim)
      ctx.lineWidth = 1;
      ctx.strokeStyle = P.trace;
      ctx.beginPath();
      for (const tr of traces) {
        ctx.moveTo(tr.pts[0][0], tr.pts[0][1]);
        for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i][0], tr.pts[i][1]);
      }
      ctx.stroke();
      ctx.fillStyle = P.traceEnd;
      for (const tr of traces) {
        const a = tr.pts[0], b = tr.pts[tr.pts.length - 1];
        ctx.fillRect(a[0] - 2, a[1] - 2, 4, 4);
        ctx.beginPath(); ctx.arc(b[0], b[1], 2.5, 0, 6.283); ctx.fill();
      }

      // ---- travelling pulses
      if (!reduced) {
        ctx.lineCap = 'round';
        for (const tr of traces) {
          const cycle = tr.total + 240;
          const head = ((time * tr.speed + tr.off) % cycle);
          if (head > tr.total + 60) continue;
          const tail = 70;
          const col = tr.gold ? P.gold : P.pulse;
          const N = 7;
          for (let i = 0; i < N; i++) {
            const d1 = head - (tail * i) / N, d2 = head - (tail * (i + 1)) / N;
            if (d1 < 0) break;
            const p1 = pointAt(tr, d1), p2 = pointAt(tr, Math.max(0, d2));
            ctx.strokeStyle = `rgba(${col},${(1 - i / N) * 0.85})`;
            ctx.lineWidth = 2 - i * 0.2;
            ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
          }
          if (head <= tr.total) {
            const p = pointAt(tr, head);
            const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 12);
            g.addColorStop(0, `rgba(${col},0.9)`); g.addColorStop(1, `rgba(${col},0)`);
            ctx.fillStyle = g; ctx.fillRect(p[0] - 12, p[1] - 12, 24, 24);
          }
        }
      }

      // ---- shockwaves (tap / click)
      for (let i = shocks.length - 1; i >= 0; i--) {
        const s = shocks[i]; s.r += 520 * dt; s.a -= 1.1 * dt;
        if (s.a <= 0) { shocks.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(${P.shock},${s.a * 0.6})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.stroke();
      }

      // ---- particle grid physics
      const R2 = RADIUS * RADIUS;
      const k = 0.08, damp = 0.82;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        let tx = n.hx, ty = n.hy;
        const dx = n.hx - px, dy = n.hy - py, d2 = dx * dx + dy * dy;
        let e = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1, f = 1 - d / RADIUS;
          tx += (dx / d) * f * 26; ty += (dy / d) * f * 26; e = f;
        }
        for (let j = 0; j < shocks.length; j++) {
          const s = shocks[j]; const sx = n.hx - s.x, sy = n.hy - s.y; const sd = Math.sqrt(sx * sx + sy * sy) || 1;
          const band = 1 - Math.min(1, Math.abs(sd - s.r) / 40);
          if (band > 0) { tx += (sx / sd) * band * 14 * s.a; ty += (sy / sd) * band * 14 * s.a; e = Math.max(e, band * s.a); }
        }
        n.vx = (n.vx + (tx - n.x) * k) * damp;
        n.vy = (n.vy + (ty - n.y) * k) * damp;
        n.x += n.vx; n.y += n.vy;
        n.e += (e - n.e) * 0.15;
      }

      // mesh links around cursor
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const n = nodes[r * cols + c];
        if (n.e < 0.05) continue;
        if (c + 1 < cols) {
          const m = nodes[r * cols + c + 1];
          const a = Math.min(n.e, m.e) * 0.7;
          if (a > 0.03) { ctx.strokeStyle = `rgba(${P.link1},${a})`; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke(); }
        }
        if (r + 1 < rows) {
          const m = nodes[(r + 1) * cols + c];
          const a = Math.min(n.e, m.e) * 0.7;
          if (a > 0.03) { ctx.strokeStyle = `rgba(${P.link2},${a})`; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke(); }
        }
      }

      // nodes: batch the dim ones, draw the energised ones individually
      ctx.fillStyle = P.node;
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.e < 0.05) ctx.rect(n.x - 0.75, n.y - 0.75, 1.5, 1.5);
      }
      ctx.fill();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.e >= 0.05) {
          const s = 1.2 + n.e * 2.4;
          ctx.fillStyle = `rgba(${P.hot},${0.3 + n.e * 0.7})`;
          ctx.fillRect(n.x - s / 2, n.y - s / 2, s, s);
        }
      }

      ctx.restore();

      // ---- floating motes (screen space)
      ctx.fillStyle = P.mote;
      for (const m of motes) {
        if (!reduced) { m.y -= m.v * dt; if (m.y < -4) { m.y = h + 4; m.x = rand(0, w); } }
        ctx.globalAlpha = m.a; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ---- transition glitch slices
      if (camera.glitch > 0.01) {
        const g = camera.glitch;
        for (let i = 0; i < 6; i++) {
          const y = rand(0, h), hh = rand(2, 18);
          ctx.fillStyle = Math.random() < 0.5 ? `rgba(6,182,212,${0.18 * g})` : `rgba(236,72,153,${0.12 * g})`;
          ctx.fillRect(rand(-40, 40) * g, y, w, hh);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; if (!pointer.active) { pointer.sx = e.clientX; pointer.sy = e.clientY; } pointer.active = true; };
    const onDown = (e) => {
      onMove(e);
      const z = camera.zoom, cx = w / 2 + camera.x, cy = h / 2 + camera.y;
      shocks.push({ x: (e.clientX - cx) / z + w / 2, y: (e.clientY - cy) / z + h / 2, r: 0, a: 1 });
      if (shocks.length > 5) shocks.shift();
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; pointer.active = false; };
    const onUp = (e) => { if (e.pointerType === 'touch') setTimeout(onLeave, 250); };
    let resizeT;
    const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(build, 150); };
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
    };

    build();
    raf = requestAnimationFrame(frame);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
