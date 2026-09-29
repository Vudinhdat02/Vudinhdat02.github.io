import { motion } from 'framer-motion';
import Icon from '../components/Icons';
import { Cover, useCatLabel } from '../components/ProjectArt';
import { asset } from '../utils/asset';
import { useTilt } from '../hooks/useTilt';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './FeaturedProjects.css';

/**
 * Bento layout: always fills complete rows (no holes), whatever the number of projects.
 * Returns [{ c: columns (of 12), r: rows }] for each tile.
 */
function bento(n) {
  if (n <= 0) return [];
  if (n === 1) return [{ c: 12, r: 2, big: true }];
  if (n === 2) return [{ c: 7, r: 2, big: true }, { c: 5, r: 2 }];
  const first = { c: n === 3 ? 7 : 6, r: 2, big: true };
  const W = 12 - first.c;
  const m = Math.min(n - 1, 4); // tiles beside the big one (2 rows)
  const row1 = Math.ceil(m / 2), row2 = m - row1;
  const side = [...Array(row1).fill({ c: W / row1, r: 1 }), ...Array(row2).fill({ c: W / row2, r: 1 })];
  const rest = [];
  let left = n - 1 - m;
  while (left > 0) {
    const k = left >= 3 ? 3 : left;
    for (let i = 0; i < k; i++) rest.push({ c: 12 / k, r: 1 });
    left -= k;
  }
  return [first, ...side, ...rest];
}

function Tile({ p, size, index, onOpen }) {
  const tilt = useTilt({ max: size.big ? 4 : 7 });
  const { t, tr } = useSettings();
  const { play } = useSound();
  const cat = useCatLabel();
  const img = p.images?.[0];
  return (
    <motion.div
      className={`fp-cell ${size.big ? 'big' : ''}`}
      style={{ gridColumn: `span ${size.c}`, gridRow: `span ${size.r}` }}
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={tilt.ref} className={`fp-tile ${p.featured ? 'gold' : ''}`} style={{ '--h': p.hue ?? 200 }}
        onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}
        onPointerDown={tilt.onPointerDown} onPointerUp={tilt.onPointerUp} onPointerCancel={tilt.onPointerCancel}
        onMouseEnter={() => play('hover')}>
        <button type="button" className="fp-hit" onClick={() => { play('open'); onOpen(); }} aria-label={p.title} />
        <span className="fp-media" aria-hidden="true">
          {img ? <img src={asset(img)} alt="" loading="lazy" /> : <Cover hue={p.hue ?? 200} seed={index + 11} category={p.category} />}
        </span>
        <span className="fp-shade" aria-hidden="true" />
        <span className="fp-no display" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="fp-body">
          <span className="fp-meta mono">
            <span className="fp-cat">{cat(p.category)}</span>
            {p.year && <span>{p.year}</span>}
            {p.featured && <span className="fp-star">{t('proj.featured')}</span>}
          </span>
          <span className="fp-title display">{p.title}</span>
          <span className="fp-desc">{tr(p.desc)}</span>
          {size.big && p.tags?.length > 0 && (
            <span className="fp-tags">{p.tags.slice(0, 5).map((tag) => <span key={tag} className="mono">{tag}</span>)}</span>
          )}
        </span>
        {p.repo && (
          <a className="fp-gh" href={p.repo} target="_blank" rel="noreferrer" aria-label="GitHub" onClick={() => play('click')}>
            <Icon name="github" size={18} />
          </a>
        )}
        <span className="fp-glare" aria-hidden="true" />
        <span className="fp-edge" aria-hidden="true" />
      </div>
    </motion.div>
  );
}

export default function FeaturedProjects({ projects, onNavigate }) {
  const sizes = bento(projects.length);
  if (!projects.length) return null;
  return (
    <div className="fp-grid">
      {projects.map((p, i) => <Tile key={p.id} p={p} size={sizes[i]} index={i} onOpen={() => onNavigate('projects')} />)}
    </div>
  );
}
