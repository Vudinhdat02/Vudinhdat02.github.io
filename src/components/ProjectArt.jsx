import { useCallback, useMemo } from 'react';
import Icon from './Icons';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';
import './ProjectArt.css';

const CAT_ICON = { MOBILE: 'phone', IOT: 'drone', WEB: 'globe' };

/** Label for a category: translated for MOBILE / IOT / WEB, as typed for your own ones. */
export function useCatLabel() {
  const { t } = useSettings();
  return useCallback((c) => { const k = `pcat.${c}`; const v = t(k); return v === k ? c : v; }, [t]);
}

/** Generated "circuit" art — used when a project has no photo. */
export function Cover({ hue, seed, category }) {
  const lines = useMemo(() => {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 10 }, () => {
      const x = Math.round(r() * 30) * 10, y = Math.round(r() * 14) * 10;
      const dx = (r() > 0.5 ? 1 : -1) * Math.round(20 + r() * 80), dy = Math.round(r() * 40);
      return `M${x} ${y}h${dx}v${dy}h${Math.round(r() * 40)}`;
    });
  }, [seed]);
  return (
    <div className="pc-cover-wrap">
      <svg className="pc-cover" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`pg${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 90% 45%)`} stopOpacity=".38" />
            <stop offset="100%" style={{ stopColor: 'var(--bg0)', stopOpacity: 0 }} />
          </linearGradient>
          <pattern id={`pd${seed}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".8" fill={`hsl(${hue} 90% 60%)`} opacity=".3" />
          </pattern>
        </defs>
        <rect width="300" height="140" fill={`url(#pg${seed})`} />
        <rect width="300" height="140" fill={`url(#pd${seed})`} />
        {lines.map((d, i) => <path key={i} className="pc-trace" d={d} fill="none" stroke={`hsl(${hue} 85% 55%)`} strokeOpacity={0.3 + (i % 3) * 0.2} strokeWidth="1.2" />)}
        <circle cx="240" cy="40" r="26" fill="none" stroke={`hsl(${hue} 85% 55%)`} strokeOpacity=".5" strokeDasharray="4 6" className="pc-orbit" />
      </svg>
      <span className="pc-glyph" style={{ '--h': hue }}><Icon name={CAT_ICON[category] || 'code'} size={34} stroke={1.4} /></span>
    </div>
  );
}

/** Photo shown whole (never cropped) over a soft blurred copy of itself. */
export function Photo({ src, alt = '' }) {
  return (
    <span className="pc-photo">
      <img className="pc-photo-bg" src={asset(src)} alt="" aria-hidden="true" loading="lazy" />
      <img className="pc-photo-fg" src={asset(src)} alt={alt} loading="lazy" />
    </span>
  );
}

