import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Icon from '../components/Icons';
import Lightbox from '../components/Lightbox';
import ScrambleText from '../components/fx/ScrambleText';
import blogData from '../data/blog.json';
import { EDIT_MODE, useEditableList, uploadImage, removeUpload, newId } from '../admin/adminApi';
import { EditorModal, Field, ItemTools, MultiImagePicker, TextArea, move } from '../admin/EditorKit';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import { EASE, FitCtx, ParallaxImg, Pic, Text, TitleFx, TitleFxCtx, TITLE_FX, inView } from './shared';
import { VIEWS2 } from './layouts2';
import './Blog.css';
import './fx.css';

/**
 * Personal blog / daily diary on the Dashboard.
 * Every post gets its own layout + scroll-in effect; two neighbours never share one.
 * Add / edit on the page while running `npm run dev` → saved in src/data/blog.json, photos in public/uploads/.
 */


/** Hover light on photos: remember where the pointer is inside the photo (CSS does the rest). */
const trackPhoto = (e) => {
  const el = e.target.closest?.('.bl-post button');
  if (!el) return;
  if (!el.style.getPropertyValue('--img')) { // the photo itself, used by glitch / hologram layers
    const img = el.querySelector('img');
    if (img) el.style.setProperty('--img', `url("${img.currentSrc || img.src}")`);
  }
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
};
const PAGE = 6; // posts shown before "Xem thêm"
/**
 * All layouts. `min` = photos needed; `fits(r)` = suits the cover photo's shape (r = width / height).
 * `auto` rotates through these (except classic / note), skipping ones that would crop the photo badly.
 */
const LAYOUTS = [
  { id: 'classic', min: 1, fits: () => true },
  { id: 'hero', min: 1, fits: (r) => r >= 1.25 },
  { id: 'door', min: 1, fits: (r) => r <= 1.05 },
  { id: 'polaroid', min: 1, fits: () => true },
  { id: 'curtain', min: 1, fits: (r) => r >= 0.95 },
  { id: 'mosaic', min: 2, fits: () => true },
  { id: 'film', min: 2, fits: (r) => r >= 0.9 },
  { id: 'hud', min: 1, fits: (r) => r >= 1 },
  { id: 'manga', min: 1, fits: () => true },
  { id: 'holo', min: 1, fits: () => true },
  { id: 'split', min: 1, fits: (r) => r >= 1.1 },
  { id: 'deck', min: 1, fits: () => true },
  { id: 'vertical', min: 1, fits: (r) => r >= 1.3 },
  { id: 'orbit', min: 1, fits: () => true },
  { id: 'glass', min: 1, fits: () => true },
  { id: 'shards', min: 1, fits: (r) => r >= 1.1 },
  { id: 'magazine', min: 1, fits: (r) => r <= 1.05 },
  { id: 'note', min: 0, fits: () => true },
];
const ROTATION = ['hero', 'hud', 'door', 'manga', 'polaroid', 'holo', 'curtain', 'split', 'mosaic', 'orbit', 'film', 'vertical', 'deck', 'glass', 'shards', 'magazine', 'classic'];

/** Hover effects ("chuyển cảnh khi di chuột") and the one each layout uses when set to Auto. */
export const HOVER_FX = ['scan', 'hologram', 'glitch', 'warp', 'speed', 'neon', 'portal', 'shock', 'xray', 'sakura'];
const AUTO_HFX = { hero: 'scan', door: 'portal', polaroid: 'sakura', curtain: 'shock', mosaic: 'warp', film: 'glitch', classic: 'scan',
  hud: 'xray', manga: 'speed', holo: 'hologram', split: 'shock', deck: 'neon', vertical: 'sakura', orbit: 'portal', glass: 'warp',
  shards: 'glitch', magazine: 'neon', note: 'scan', note2: 'scan' };
const AUTO_TFX = { hero: 'split', door: 'wave', polaroid: 'type', curtain: 'fade', mosaic: 'gradient', film: 'blade', classic: 'fade',
  hud: 'scramble', manga: 'blade', holo: 'glitch', split: 'blade', deck: 'wave', vertical: 'katakana', orbit: 'neon', glass: 'fade',
  shards: 'scramble', magazine: 'split', note: 'type', note2: 'neon' };
const pick = (v, map, layout) => (!v || v === 'auto' ? map[layout] || 'scan' : v);
const byId = Object.fromEntries(LAYOUTS.map((l) => [l.id, l]));

/** Can this post use that layout? (enough photos; for auto also the right photo shape) */
const canUse = (post, id, checkShape) => {
  const L = byId[id]; if (!L) return false;
  const n = (post.images || []).length;
  if (n < L.min) return false;
  const r = post.ratios?.[0];
  return !checkShape || !r || L.fits(r);
};

/**
 * Layout for each post: the one you picked, or (auto) the next in the rotation that suits the photos
 * and differs from the post before it.
 */
function assignLayouts(posts) {
  let prev = '', turn = 0;
  return posts.map((p) => {
    const n = (p.images || []).length;
    if (p.layout && p.layout !== 'auto' && canUse(p, p.layout, false)) { prev = p.layout; return p.layout; }
    if (!n) { const id = prev === 'note' ? 'note2' : 'note'; prev = id; return id; }
    for (let k = 0; k < ROTATION.length; k++) {
      const id = ROTATION[(turn + k) % ROTATION.length];
      if (id !== prev && canUse(p, id, true)) { prev = id; turn += k + 1; return id; }
    }
    prev = 'classic'; turn++; return 'classic';
  });
}

/** Width / height of each photo (measured when you save, used by "auto" to avoid bad crops). */
const measure = (src) => new Promise((res) => {
  const img = new Image();
  img.onload = () => res(Math.round((img.naturalWidth / img.naturalHeight) * 100) / 100);
  img.onerror = () => res(null);
  img.src = src;
});

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/* ---------- the layouts ---------- */

/** Wide cinematic photo: letterbox bars slide away, photo settles from a zoom; text card rises over it. */
function Hero({ post, zoom }) {
  return (
    <motion.article className="bl-post bl-hero" {...inView}>
      <div className="bl-hero-media">
        <motion.div className="bl-hero-zoom" variants={{ hidden: { scale: 1.18 }, show: { scale: 1, transition: { duration: 1.4, ease: EASE } } }}>
          <ParallaxImg src={post.images[0]} alt="" strength={30} onClick={() => zoom(0)} />
        </motion.div>
        <motion.span className="bl-bar top" variants={{ hidden: { scaleY: 1 }, show: { scaleY: 0, transition: { duration: 0.9, ease: EASE, delay: 0.1 } } }} />
        <motion.span className="bl-bar bottom" variants={{ hidden: { scaleY: 1 }, show: { scaleY: 0, transition: { duration: 0.9, ease: EASE, delay: 0.1 } } }} />
        {post.images.length > 1 && <span className="bl-count mono"><Icon name="image" size={13} /> {post.images.length}</span>}
      </div>
      <motion.div className="bl-hero-card" variants={{ hidden: { opacity: 0, y: 60 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.45 } } }}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** Photo swings open like a door (3D), text slides in from the other side. */
function Door({ post, zoom }) {
  return (
    <motion.article className="bl-post bl-door" {...inView}>
      <div className="bl-door-stage">
        <motion.div className="bl-door-leaf" variants={{ hidden: { rotateY: -75, opacity: 0 }, show: { rotateY: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } } }}>
          <ParallaxImg src={post.images[0]} alt="" strength={24} onClick={() => zoom(0)} />
        </motion.div>
        {post.images.length > 1 && (
          <motion.div className="bl-door-thumbs" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } } }}>
            {post.images.slice(1, 4).map((src, i) => (
              <motion.button type="button" key={src} onClick={() => zoom(i + 1)} variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
                <img src={asset(src)} alt="" loading="lazy" />
                {i === 2 && post.images.length > 4 && <span className="mono">+{post.images.length - 4}</span>}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
      <motion.div variants={{ hidden: { opacity: 0, x: 80 }, show: { opacity: 1, x: 0, transition: { duration: 0.9, ease: EASE, delay: 0.25 } } }}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

const TILT = [-7, 5, -3, 8];
/** Polaroids drop onto the table and land at different angles; the story is a paper note. */
function Polaroid({ post, zoom }) {
  const pics = post.images.slice(0, 3);
  return (
    <motion.article className="bl-post bl-polaroid" {...inView}>
      <motion.div className="bl-note" variants={{ hidden: { opacity: 0, rotate: -4, y: 40 }, show: { opacity: 1, rotate: -1, y: 0, transition: { duration: 0.8, ease: EASE } } }}>
        <span className="bl-tape" aria-hidden="true" />
        <Text post={post} />
      </motion.div>
      <div className={`bl-pile n${pics.length}`}>
        {pics.map((src, i) => (
          <motion.button type="button" key={src} className="bl-pola" onClick={() => zoom(i)}
            variants={{
              hidden: { opacity: 0, y: -140, rotate: TILT[i] * 4, scale: 1.1 },
              show: { opacity: 1, y: 0, rotate: TILT[i], scale: 1, transition: { type: 'spring', stiffness: 120, damping: 14, delay: 0.2 + i * 0.18 } },
            }}>
            <img src={asset(src)} alt="" loading="lazy" />
          </motion.button>
        ))}
        {post.images.length > 3 && <span className="bl-count mono"><Icon name="image" size={13} /> {post.images.length}</span>}
      </div>
    </motion.article>
  );
}

/** A coloured panel sweeps off the photo (curtain), words of the title rise one by one. */
function Curtain({ post, zoom }) {
  const { tr } = useSettings();
  const words = String(tr(post.title)).split(' ');
  return (
    <motion.article className="bl-post bl-curtain" {...inView}>
      <div className="bl-curtain-copy">
        <motion.span className="bl-date mono" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.2 } } }}>
          <Icon name="flag" size={12} /> {tr(post.date || '')}
        </motion.span>
        {post.titleFx && post.titleFx !== 'auto' ? <TitleFx text={tr(post.title)} /> : (
          <h3 className="bl-title display bl-words" aria-label={tr(post.title)}>
            {words.map((w, i) => (
              <span key={i} className="bl-word-mask" aria-hidden="true">
                <motion.span variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.3 + i * 0.06 } } }}>{w}</motion.span>
              </span>
            ))}
          </h3>
        )}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay: 0.55 } } }}>
          <Text post={{ ...post, title: '', date: '' }} />
        </motion.div>
      </div>
      <div className="bl-curtain-media">
        <motion.div className="bl-curtain-img" variants={{ hidden: { scale: 1.25 }, show: { scale: 1, transition: { duration: 1.3, ease: EASE } } }}>
          <ParallaxImg src={post.images[0]} alt="" strength={26} onClick={() => zoom(0)} />
        </motion.div>
        <motion.span className="bl-panel" variants={{ hidden: { scaleX: 1 }, show: { scaleX: 0, transition: { duration: 0.95, ease: [0.77, 0, 0.18, 1], delay: 0.15 } } }} />
        {post.images.length > 1 && <span className="bl-count mono"><Icon name="image" size={13} /> {post.images.length}</span>}
      </div>
    </motion.article>
  );
}

const FROM = [{ x: -70, y: -40 }, { x: 70, y: -30 }, { x: -60, y: 50 }, { x: 60, y: 60 }, { x: 0, y: 80 }];
/** Photo tiles fly in from different corners and snap into a grid. */
function Mosaic({ post, zoom }) {
  const pics = post.images.slice(0, 5);
  return (
    <motion.article className="bl-post bl-mosaic" {...inView}>
      <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}>
        <Text post={post} align="center" />
      </motion.div>
      <div className={`bl-tiles n${pics.length}`}>
        {pics.map((src, i) => (
          <motion.button type="button" key={src} className="bl-tile" onClick={() => zoom(i)}
            variants={{
              hidden: { opacity: 0, scale: 0.7, ...FROM[i] },
              show: { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.85, ease: EASE, delay: 0.15 + i * 0.1 } },
            }}>
            <img src={asset(src)} alt="" loading="lazy" />
            {i === pics.length - 1 && post.images.length > pics.length && <span className="bl-more-pics mono">+{post.images.length - pics.length}</span>}
          </motion.button>
        ))}
      </div>
    </motion.article>
  );
}

/** A film strip slides in sideways, frames light up one after another. */
function Film({ post, zoom }) {
  return (
    <motion.article className="bl-post bl-film" {...inView}>
      <motion.div className="bl-strip" data-noswipe variants={{ hidden: { x: '30%', opacity: 0 }, show: { x: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } } }}>
        <div className="bl-strip-row">
          {post.images.map((src, i) => (
            <motion.button type="button" key={src} className="bl-frame" onClick={() => zoom(i)}
              variants={{ hidden: { opacity: 0.15 }, show: { opacity: 1, transition: { duration: 0.5, delay: 0.5 + i * 0.12 } } }}>
              <img src={asset(src)} alt="" loading="lazy" />
              <span className="bl-frame-no mono">{String(i + 1).padStart(2, '0')}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.35 } } }}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** Text-only post: the card unfolds in 3D (note) or grows out from a line (note2). */
function Note({ post, variant }) {
  const v = variant === 'note2'
    ? { hidden: { opacity: 0, scaleX: 0.2, scaleY: 0.05 }, show: { opacity: 1, scaleX: 1, scaleY: 1, transition: { duration: 0.9, ease: EASE } } }
    : { hidden: { opacity: 0, rotateX: -80, y: 30 }, show: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 1, ease: EASE } } };
  return (
    <motion.article className={`bl-post bl-note-only ${variant}`} {...inView}>
      <motion.div className="bl-quote" variants={v}>
        <span className="bl-quote-mark display" aria-hidden="true">“</span>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** Photo keeps its real shape (never cropped); a light beam sweeps over it as it rises into place. */
function Classic({ post, zoom }) {
  const rest = post.images.slice(1);
  return (
    <motion.article className="bl-post bl-classic" {...inView}>
      <motion.div className="bl-classic-main" variants={{ hidden: { opacity: 0, y: 70, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, ease: EASE } } }}>
        <button type="button" onClick={() => zoom(0)}><img src={asset(post.images[0])} alt="" loading="lazy" /></button>
        <motion.span className="bl-beam" aria-hidden="true" variants={{ hidden: { x: '-120%' }, show: { x: '120%', transition: { duration: 1.4, ease: 'easeInOut', delay: 0.5 } } }} />
      </motion.div>
      <motion.div className="bl-classic-side" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } } }}>
        <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}>
          <Text post={post} />
        </motion.div>
        {rest.length > 0 && (
          <div className="bl-classic-thumbs">
            {rest.map((src, i) => (
              <motion.button type="button" key={src} onClick={() => zoom(i + 1)}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
                <img src={asset(src)} alt="" loading="lazy" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.article>
  );
}

const VIEWS = { ...VIEWS2, classic: Classic, hero: Hero, door: Door, polaroid: Polaroid, curtain: Curtain, mosaic: Mosaic, film: Film };

/* ---------- section + editor ---------- */

/* ---------- layout picker (edit mode) ---------- */

// tiny wireframes: P = photo block, T = text lines
const P = (x, y, w, h, k) => <rect key={k} x={x} y={y} width={w} height={h} rx="2" className="lp-photo" />;
const T = (x, y, w, n = 3, k = 't') => Array.from({ length: n }, (_, i) => <rect key={k + i} x={x} y={y + i * 5} width={i === n - 1 ? w * 0.6 : w} height="2.4" rx="1.2" className="lp-line" />);
const SKETCH = {
  auto: <><text x="32" y="25" textAnchor="middle" className="lp-auto">AUTO</text></>,
  classic: <>{P(6, 5, 22, 30, 'a')}{T(33, 10, 24, 4)}</>,
  hero: <>{P(3, 4, 58, 22, 'a')}<rect x="8" y="22" width="30" height="14" rx="2" className="lp-card" />{T(11, 25, 22, 2)}</>,
  door: <>{P(5, 3, 20, 26, 'a')}{P(5, 31, 6, 6, 'b')}{P(12, 31, 6, 6, 'c')}{T(31, 12, 27, 4)}</>,
  polaroid: <><rect x="4" y="8" width="22" height="24" rx="1" className="lp-card" />{T(7, 13, 16, 3)}<g transform="rotate(-8 42 20)">{P(32, 6, 18, 22, 'a')}</g><g transform="rotate(7 48 22)">{P(40, 10, 18, 22, 'b')}</g></>,
  curtain: <>{T(4, 12, 22, 4)}{P(32, 5, 28, 30, 'a')}<rect x="46" y="5" width="14" height="30" className="lp-panel" /></>,
  mosaic: <>{T(16, 3, 32, 1)}{P(4, 9, 28, 28, 'a')}{P(34, 9, 26, 13, 'b')}{P(34, 24, 12, 13, 'c')}{P(48, 24, 12, 13, 'd')}</>,
  film: <><rect x="2" y="5" width="60" height="18" rx="1" className="lp-strip" />{P(5, 8, 17, 12, 'a')}{P(24, 8, 17, 12, 'b')}{P(43, 8, 17, 12, 'c')}{T(4, 28, 40, 2)}</>,
  note: <><rect x="10" y="6" width="44" height="28" rx="3" className="lp-card" />{T(15, 12, 34, 4)}</>,
  hud: <>{P(3, 5, 36, 26, 'a')}<path d="M3 11V5h6M33 5h6v6M3 25v6h6M33 31h6v-6" className="lp-hud" /><circle cx="21" cy="18" r="4" className="lp-hud" />{T(44, 10, 17, 4)}</>,
  manga: <><rect x="2" y="3" width="60" height="34" className="lp-card" /><path d="M4 5h30l-4 30H4z" className="lp-photo" /><path d="M36 5h24v14H34z" className="lp-photo" /><path d="M33 21h27v14H31z" className="lp-photo" /><ellipse cx="46" cy="12" rx="11" ry="6" className="lp-bubble" /></>,
  holo: <><path d="M26 34 12 6h40L38 34z" className="lp-beam" />{P(18, 5, 28, 18, 'a')}<ellipse cx="32" cy="35" rx="10" ry="2.5" className="lp-panel" /></>,
  split: <><path d="M3 4h34l-10 22H3z" className="lp-photo" /><path d="M39 4h22v22H29z" className="lp-photo" /><path d="M40 2 26 28" className="lp-slash" />{T(4, 30, 40, 2)}</>,
  deck: <><g transform="skewX(-12)">{P(14, 16, 22, 16, 'c')}{P(18, 11, 22, 16, 'b')}{P(22, 6, 22, 16, 'a')}</g>{T(46, 12, 15, 4)}</>,
  vertical: <>{P(3, 4, 58, 26, 'a')}<circle cx="50" cy="11" r="5" className="lp-sun" /><rect x="40" y="7" width="3" height="20" className="lp-line" /><rect x="35" y="7" width="3" height="14" className="lp-line" />{T(4, 33, 30, 1)}</>,
  orbit: <><circle cx="18" cy="20" r="15" className="lp-ring" /><circle cx="18" cy="20" r="9" className="lp-photo" /><circle cx="18" cy="5" r="3" className="lp-photo" /><circle cx="31" cy="27" r="3" className="lp-photo" />{T(38, 12, 23, 4)}</>,
  glass: <><rect x="2" y="3" width="60" height="34" rx="4" className="lp-glassbg" />{P(7, 7, 20, 26, 'a')}<rect x="31" y="9" width="27" height="22" rx="3" className="lp-card" />{T(34, 13, 20, 3)}</>,
  shards: <>{[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((c) => <rect key={`${r}${c}`} x={3 + c * 6.2} y={5 + r * 7.2} width="5.4" height="6.4" className="lp-photo" style={{ opacity: 0.35 + ((r * 6 + c) * 37 % 10) / 16 }} />))}{T(44, 12, 17, 4)}</>,
  magazine: <>{P(4, 3, 24, 34, 'a')}<rect x="6" y="6" width="20" height="4" className="lp-mast" />{T(34, 8, 26, 5)}</>,
};

/** Grid of choices (hover effects / title effects) with a short hint under each name. */
function FxGrid({ ids, value, onChange, prefix }) {
  const { t } = useSettings();
  return (
    <div className="fx-grid" role="radiogroup">
      {['auto', ...ids].map((id) => (
        <button type="button" key={id} role="radio" aria-checked={value === id} className={`fx-opt ${value === id ? 'on' : ''}`} onClick={() => onChange(id)}>
          <b>{t(`${prefix}.${id}`)}</b><small>{t(`${prefix}h.${id}`)}</small>
        </button>
      ))}
    </div>
  );
}

/** Live preview in the editor: hover the photo to try the effect, the title replays when you pick a new one. */
function FxPreview({ image, title, layout, hoverFx, titleFx }) {
  const { t } = useSettings();
  const h = pick(hoverFx, AUTO_HFX, layout);
  const tf = !titleFx || titleFx === 'auto' ? AUTO_TFX[layout] || 'fade' : titleFx;
  return (
    <div className={`fx-preview blog-item hfx-${h}`} onPointerMove={trackPhoto}>
      <div className="bl-post">
        {image ? <Pic src={image} onClick={() => {}} /> : <span />}
        <div>
          <TitleFxCtx.Provider value={tf}><TitleFx key={`${tf}|${title}`} text={title || t('blog.fTitlePh')} /></TitleFxCtx.Provider>
          <small>{t('blog.previewHint')}</small>
        </div>
      </div>
    </div>
  );
}

function LayoutPicker({ value, count, onChange }) {
  const { t } = useSettings();
  const opts = [{ id: 'auto', min: 0 }, ...LAYOUTS];
  return (
    <div className="lp-grid" role="radiogroup">
      {opts.map((L) => {
        const disabled = count < L.min;
        return (
          <button type="button" key={L.id} role="radio" aria-checked={value === L.id} disabled={disabled}
            className={`lp-opt ${value === L.id ? 'on' : ''}`} onClick={() => onChange(L.id)}
            title={disabled ? t('blog.needPhotos', { n: L.min }) : t(`blog.lh.${L.id}`)}>
            <svg viewBox="0 0 64 40" aria-hidden="true">{SKETCH[L.id]}</svg>
            <b>{t(`blog.l.${L.id}`)}</b>
            <small>{disabled ? t('blog.needPhotos', { n: L.min }) : t(`blog.lh.${L.id}`)}</small>
          </button>
        );
      })}
    </div>
  );
}

const EMPTY = { index: -1, title: '', date: '', text: '', images: [], layout: 'auto', fit: 'cover', hoverFx: 'auto', titleFx: 'auto' };

export default function Blog() {
  const { t, tr } = useSettings();
  const { play } = useSound();
  const { items, commit, status } = useEditableList(blogData, 'blog');
  const [limit, setLimit] = useState(PAGE);
  const [zoom, setZoom] = useState(null); // { post, index }
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  // "Quick jump" asks to show a post: make sure it is rendered, then scroll to it
  useEffect(() => {
    const onReveal = (e) => {
      const idx = items.findIndex((p) => p.id === e.detail);
      if (idx < 0) return;
      setLimit((l) => Math.max(l, idx + 1));
      setTimeout(() => {
        const el = document.querySelector(`[data-post-id="${e.detail}"]`);
        const main = document.getElementById('main');
        if (el && main) main.scrollTo({ top: el.getBoundingClientRect().top + main.scrollTop - 90, behavior: 'smooth' });
      }, 250);
    };
    window.addEventListener('blog:reveal', onReveal);
    return () => window.removeEventListener('blog:reveal', onReveal);
  }, [items]);
  // preview of a photo picked in the editor but not uploaded yet
  const firstFile = form?.images?.[0]?.file;
  const [formPreview, setFormPreview] = useState('');
  useEffect(() => {
    if (!firstFile) { setFormPreview(''); return undefined; }
    const u = URL.createObjectURL(firstFile);
    setFormPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [firstFile]);

  // posts saved before photo shapes were recorded: measure them once so "auto" can avoid bad crops
  const [measured, setMeasured] = useState({});
  useEffect(() => {
    let alive = true;
    items.forEach((p) => {
      const key = p.id || p.images?.[0];
      if (!p.images?.length || p.ratios?.length || measured[key]) return;
      measure(asset(p.images[0])).then((r) => { if (alive && r) setMeasured((m) => ({ ...m, [key]: [r] })); });
    });
    return () => { alive = false; };
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = useCallback((d) => setZoom((z) => (z ? { ...z, index: (z.index + d + z.post.images.length) % z.post.images.length } : z)), []);

  if (!items.length && !EDIT_MODE) return null;

  const shown = items.slice(0, limit);
  const layouts = assignLayouts(shown.map((p) => (p.ratios?.length ? p : { ...p, ratios: measured[p.id || p.images?.[0]] })));

  const openNew = () => { setError(''); setForm({ ...EMPTY, date: today() }); };
  const openEdit = (i) => {
    const p = items[i]; setError('');
    setForm({ index: i, title: tr(p.title), date: tr(p.date || ''), text: tr(p.text || ''), images: (p.images || []).map((url) => ({ url })),
      layout: p.layout || 'auto', fit: p.fit || 'cover', hoverFx: p.hoverFx || 'auto', titleFx: p.titleFx || 'auto' });
  };

  const save = async () => {
    if (saving) return;
    if (!form.title.trim()) { setError(t('blog.needTitle')); return; }
    if (!form.text.trim() && !form.images.length) { setError(t('blog.needContent')); return; }
    setSaving(true); setError('');
    try {
      const images = [];
      for (const im of form.images) images.push(im.file ? await uploadImage(im.file, form.title) : im.url);
      const ratios = await Promise.all(images.map((u) => measure(asset(u))));
      const prev = form.index >= 0 ? items[form.index] : null;
      const layout = canUse({ images }, form.layout, false) ? form.layout : 'auto';
      const entry = { id: prev?.id || newId(), title: form.title.trim(), date: form.date.trim(), text: form.text.trim(), images, ratios, layout, fit: form.fit, hoverFx: form.hoverFx, titleFx: form.titleFx };
      const next = prev ? items.map((x, i) => (i === form.index ? entry : x)) : [entry, ...items]; // newest on top
      if (!(await commit(next))) throw new Error(status.error || 'Save failed');
      (prev?.images || []).filter((u) => !images.includes(u)).forEach(removeUpload);
      setForm(null); play('success');
    } catch (e) {
      setError(e.message); play('error');
    } finally {
      setSaving(false);
    }
  };

  /** quick change from the toolbar under a post */
  const patch = async (i, change) => {
    const p = items[i];
    const ratios = p.ratios?.length === (p.images || []).length ? p.ratios : await Promise.all((p.images || []).map((u) => measure(asset(u))));
    commit(items.map((x, j) => (j === i ? { ...x, ratios, ...change } : x)));
    play('click');
  };

  const remove = async (i) => {
    const gone = items[i];
    if (await commit(items.filter((_, j) => j !== i))) (gone.images || []).forEach(removeUpload);
  };

  const zoomItems = zoom ? zoom.post.images.map((src, k) => ({ src, title: tr(zoom.post.title), sub: `${k + 1}/${zoom.post.images.length}` })) : [];

  return (
    <section className="blog" aria-labelledby="blog-title">
      <header className="blog-head">
        <span className="label blog-kicker"><span className="blog-led" /> {t('blog.kicker', { n: items.length })}</span>
        <h2 id="blog-title" className="blog-title display"><ScrambleText text={t('blog.title')} duration={700} /></h2>
        <p className="blog-sub dim">{t('blog.sub')}</p>
      </header>

      {EDIT_MODE && (
        <>
          <button type="button" className="ed-add" onClick={openNew}><Icon name="plus" size={18} /> {t('blog.add')}</button>
          {status.error && <div className="ed-error">{status.error}</div>}
        </>
      )}
      {!items.length && EDIT_MODE && <p className="blog-empty dim">{t('blog.empty')}</p>}

      <div className="blog-list" onPointerMove={trackPhoto}>
        {shown.map((post, i) => {
          const layout = layouts[i];
          const View = VIEWS[layout];
          const z = (k) => { setZoom({ post, index: k }); play('open'); };
          return (
            <div key={`${post.id || i}-${layout}-${post.fit || 'cover'}-${post.titleFx || 'auto'}`} data-post-id={post.id}
              className={`blog-item fit-${post.fit || 'cover'} hfx-${pick(post.hoverFx, AUTO_HFX, layout)} ${EDIT_MODE ? 'editable' : ''}`}>
              <FitCtx.Provider value={post.fit || 'cover'}>
                <TitleFxCtx.Provider value={!post.titleFx || post.titleFx === 'auto' ? AUTO_TFX[layout] || 'fade' : post.titleFx}>
                  {View ? <View post={post} zoom={z} /> : <Note post={post} variant={layout} />}
                </TitleFxCtx.Provider>
              </FitCtx.Provider>
              {EDIT_MODE && (
                <ItemTools first={i === 0} last={i === items.length - 1}
                  onUp={() => commit(move(items, i, -1))} onDown={() => commit(move(items, i, 1))}
                  onEdit={() => openEdit(i)} onDelete={() => remove(i)}>
                  <label className="bl-switch mono">
                    {t('blog.layout')}
                    <select value={post.layout || 'auto'} onChange={(e) => patch(i, { layout: e.target.value })}>
                      <option value="auto">{t('blog.l.auto')} → {t(`blog.l.${layout.replace('note2', 'note')}`)}</option>
                      {LAYOUTS.map((L) => (
                        <option key={L.id} value={L.id} disabled={(post.images || []).length < L.min}>{t(`blog.l.${L.id}`)}</option>
                      ))}
                    </select>
                  </label>
                  {(post.images || []).length > 0 && (
                    <label className="bl-switch mono">
                      {t('blog.hover')}
                      <select value={post.hoverFx || 'auto'} onChange={(e) => patch(i, { hoverFx: e.target.value })}>
                        {['auto', ...HOVER_FX].map((id) => <option key={id} value={id}>{id === 'auto' ? `${t('blog.hfx.auto')} → ${t(`blog.hfx.${AUTO_HFX[layout] || 'scan'}`)}` : t(`blog.hfx.${id}`)}</option>)}
                      </select>
                    </label>
                  )}
                  <label className="bl-switch mono">
                    {t('blog.titleFx')}
                    <select value={post.titleFx || 'auto'} onChange={(e) => patch(i, { titleFx: e.target.value })}>
                      {['auto', ...TITLE_FX].map((id) => <option key={id} value={id}>{id === 'auto' ? `${t('blog.tfx.auto')} → ${t(`blog.tfx.${AUTO_TFX[layout] || 'fade'}`)}` : t(`blog.tfx.${id}`)}</option>)}
                    </select>
                  </label>
                  {(post.images || []).length > 0 && (
                    <button type="button" className={`ed-mini ${post.fit === 'contain' ? 'star-on' : ''}`} aria-pressed={post.fit === 'contain'}
                      onClick={() => patch(i, { fit: post.fit === 'contain' ? 'cover' : 'contain' })} title={t('blog.fitHint')}>
                      <Icon name="image" size={14} /> {t('blog.fit')}
                    </button>
                  )}
                </ItemTools>
              )}
            </div>
          );
        })}
      </div>

      {items.length > limit && (
        <button type="button" className="btn blog-load tap" onClick={() => { setLimit(limit + PAGE); play('click'); }}>
          {t('blog.loadMore', { n: items.length - limit })}
        </button>
      )}

      <Lightbox items={zoomItems} index={zoom ? zoom.index : null} onClose={() => setZoom(null)} onNav={nav} />

      {EDIT_MODE && (
        <EditorModal open={!!form} title={form?.index >= 0 ? t('blog.editTitle') : t('blog.addTitle')} onClose={() => !saving && setForm(null)}
          footer={<>
            <button type="button" className="btn tap" onClick={() => setForm(null)} disabled={saving}>{t('ed.cancel')}</button>
            <button type="button" className="btn primary tap" onClick={save} disabled={saving}>{saving ? t('ed.saving') : t('blog.publish')}</button>
          </>}>
          {form && <>
            <Field label={t('blog.fPhotos')} hint={t('blog.fPhotosHint')}>
              <MultiImagePicker value={form.images} onChange={(images) => setForm({ ...form, images })} />
            </Field>
            <div className="ed-row2">
              <Field label={t('blog.fTitle')}>
                <input value={form.title} placeholder={t('blog.fTitlePh')} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label={t('blog.fDate')}>
                <input value={form.date} placeholder="29/09/2026" onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
            </div>
            <Field label={t('blog.fText')} hint={t('ed.multiline')}>
              <TextArea value={form.text} rows={6} placeholder={t('blog.fTextPh')} onChange={(text) => setForm({ ...form, text })} onSubmit={save} />
            </Field>
            <div className="ed-field">
              <span className="ed-label">{t('blog.fLayout')}</span>
              <LayoutPicker value={form.layout} count={form.images.length} onChange={(layout) => setForm({ ...form, layout })} />
              <span className="ed-hint">{t('blog.fLayoutHint')}</span>
            </div>
            {form.images.length > 0 && (
              <div className="ed-field">
                <span className="ed-label">{t('blog.fHover')}</span>
                <FxGrid ids={HOVER_FX} value={form.hoverFx} onChange={(hoverFx) => setForm({ ...form, hoverFx })} prefix="blog.hfx" />
              </div>
            )}
            <div className="ed-field">
              <span className="ed-label">{t('blog.fTitleFx')}</span>
              <FxGrid ids={TITLE_FX} value={form.titleFx} onChange={(titleFx) => setForm({ ...form, titleFx })} prefix="blog.tfx" />
              <FxPreview image={form.images[0] ? (form.images[0].file ? formPreview : form.images[0].url) : ''} title={form.title}
                layout={form.layout === 'auto' ? 'classic' : form.layout} hoverFx={form.hoverFx} titleFx={form.titleFx} />
            </div>
            {form.images.length > 0 && (
              <label className="ed-check">
                <input type="checkbox" checked={form.fit === 'contain'} onChange={(e) => setForm({ ...form, fit: e.target.checked ? 'contain' : 'cover' })} />
                <span><b>{t('blog.fit')}</b><small>{t('blog.fitHint')}</small></span>
              </label>
            )}
            {error && <div className="ed-error">{error}</div>}
          </>}
        </EditorModal>
      )}
    </section>
  );
}
