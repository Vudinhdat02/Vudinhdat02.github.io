import { useEffect, useState } from 'react';

const q = (s) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(s) : null);

/** Detects touch-first devices (pointer: coarse) and small screens. */
export function useDevice() {
  const get = () => ({
    coarse: !!q('(pointer: coarse)')?.matches,
    mobile: !!q('(max-width: 760px)')?.matches,
    tablet: !!q('(min-width: 761px) and (max-width: 1100px)')?.matches,
    reducedMotion: !!q('(prefers-reduced-motion: reduce)')?.matches,
  });
  const [state, setState] = useState(get);
  useEffect(() => {
    const list = ['(pointer: coarse)', '(max-width: 760px)', '(min-width: 761px) and (max-width: 1100px)', '(prefers-reduced-motion: reduce)']
      .map(q)
      .filter(Boolean);
    const on = () => setState(get());
    list.forEach((m) => m.addEventListener('change', on));
    return () => list.forEach((m) => m.removeEventListener('change', on));
  }, []);
  return state;
}

export const isCoarsePointer = () => !!q('(pointer: coarse)')?.matches;
