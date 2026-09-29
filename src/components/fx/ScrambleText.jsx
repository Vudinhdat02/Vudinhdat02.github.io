import { useEffect, useRef, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';

/** Text that "decodes" from random glyphs into the real string (on mount and whenever the text changes). */
export default function ScrambleText({ text = '', duration = 700, delay = 0, className, as: Tag = 'span' }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setOut(text); return; }
    let start = 0;
    const chars = [...text];
    const timer = setTimeout(() => {
      const step = (now) => {
        if (!start) start = now;
        const p = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(p * chars.length);
        setOut(chars.map((c, i) => (i < revealed || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''));
        if (p < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf.current); };
  }, [text, duration, delay]);
  return <Tag className={className} aria-label={text}>{out}</Tag>;
}
