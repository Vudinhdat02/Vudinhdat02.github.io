import { useEffect, useState } from 'react';

/** Eased count-up animation. */
export function useCountUp(target, { duration = 1600, delay = 0 } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf, t0;
    const timer = setTimeout(() => {
      const step = (t) => {
        if (!t0) t0 = t;
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 4);
        setValue(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}
