import { motion } from 'framer-motion';
import Icon from '../components/Icons';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';
import { EASE, Pic, Text, TitleFx, inView } from './shared';
import './layouts2.css';

/* 10 sci-fi / anime layouts. Every photo is a button (click = enlarge, hover = the post's hover effect). */

const V = (hidden, show) => ({ hidden, show });

/** 1 · HUD — combat-visor frame: the photo powers on like an old CRT, brackets lock onto it, telemetry runs below. */
function Hud({ post, zoom }) {
  const { tr } = useSettings();
  const n = post.images.length;
  return (
    <motion.article className="bl-post l2-hud" {...inView}>
      <div className="l2-hud-screen">
        <motion.div className="l2-hud-crt" variants={V(
          { scaleY: 0.012, scaleX: 1.15, opacity: 0.2, filter: 'brightness(3)' },
          { scaleY: [0.012, 0.012, 1], scaleX: [1.15, 1, 1], opacity: [0.2, 1, 1], filter: ['brightness(3)', 'brightness(2)', 'brightness(1)'], transition: { duration: 0.9, times: [0, 0.35, 1], ease: 'easeOut' } },
        )}>
          <Pic src={post.images[0]} onClick={() => zoom(0)} />
        </motion.div>
        <span className="l2-hud-grid" aria-hidden="true" />
        <span className="l2-hud-cross" aria-hidden="true" />
        {['tl', 'tr', 'bl', 'br'].map((c, i) => (
          <motion.i key={c} className={`l2-hud-c ${c}`} aria-hidden="true"
            variants={V({ opacity: 0, x: c.includes('l') ? -40 : 40, y: c.includes('t') ? -40 : 40 }, { opacity: 1, x: 0, y: 0, transition: { duration: 0.55, delay: 0.55 + i * 0.05, ease: EASE } })} />
        ))}
        <span className="l2-hud-rec mono" aria-hidden="true"><b /> REC</span>
        <span className="l2-hud-tele mono" aria-hidden="true">IMG {String(1).padStart(2, '0')}/{String(n).padStart(2, '0')} · {tr(post.date || '')} · LOCK ●</span>
      </div>
      <motion.div className="l2-hud-panel" variants={V({ opacity: 0, x: 60 }, { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.4, ease: EASE } })}>
        <span className="l2-hud-head mono">LOG // {tr(post.date || '—')}</span>
        <Text post={{ ...post, date: '' }} />
        {n > 1 && (
          <div className="l2-thumbs">{post.images.slice(1, 5).map((src, i) => <Pic key={src} src={src} onClick={() => zoom(i + 1)} />)}</div>
        )}
      </motion.div>
    </motion.article>
  );
}

/** 2 · MANGA — slanted comic panels slam onto the page, the title pops out in a speech bubble. */
function Manga({ post, zoom }) {
  const { tr } = useSettings();
  const pics = post.images.slice(0, 3);
  return (
    <motion.article className={`bl-post l2-manga n${pics.length}`} {...inView}>
      <div className="l2-manga-page">
        {pics.map((src, i) => (
          <motion.div key={src} className={`l2-panel p${i}`}
            variants={V({ opacity: 0, scale: 1.35, rotate: i % 2 ? 4 : -4 }, { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 18, delay: 0.1 + i * 0.16 } })}>
            <Pic src={src} onClick={() => zoom(i)} />
            <span className="l2-halftone" aria-hidden="true" />
          </motion.div>
        ))}
        <motion.div className="l2-bubble" variants={V({ scale: 0, rotate: -12 }, { scale: 1, rotate: -2, transition: { type: 'spring', stiffness: 420, damping: 14, delay: 0.55 } })}>
          <TitleFx text={tr(post.title)} />
        </motion.div>
        <motion.span className="l2-sfx display" aria-hidden="true" variants={V({ opacity: 0, scale: 3 }, { opacity: 1, scale: 1, transition: { duration: 0.35, delay: 0.75 } })}>ドン!</motion.span>
      </div>
      {(post.text || post.date) && (
        <motion.div className="l2-manga-cap" variants={V({ opacity: 0, y: 30 }, { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.7 } })}>
          <Text post={{ ...post, title: '' }} />
        </motion.div>
      )}
    </motion.article>
  );
}

/** 3 · HOLOGRAM — the photo is projected from a glowing base: it rises out of the beam and flickers into focus. */
function Holo({ post, zoom }) {
  return (
    <motion.article className="bl-post l2-holo" {...inView}>
      <div className="l2-holo-stage">
        <motion.span className="l2-holo-beam" aria-hidden="true" variants={V({ opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, transition: { duration: 0.6, ease: EASE } })} />
        <motion.div className="l2-holo-img"
          variants={V({ opacity: 0, scaleY: 0, rotateX: 25 }, { opacity: [0, 0.8, 0.2, 1, 0.6, 1], scaleY: 1, rotateX: 8, transition: { duration: 1.1, delay: 0.35, ease: EASE } })}>
          <Pic src={post.images[0]} onClick={() => zoom(0)} />
          <span className="l2-holo-lines" aria-hidden="true" />
        </motion.div>
        <span className="l2-holo-base" aria-hidden="true" />
      </div>
      <motion.div className="l2-holo-text" variants={V({ opacity: 0, y: 30 }, { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.6 } })}>
        <Text post={post} />
        {post.images.length > 1 && <div className="l2-thumbs">{post.images.slice(1, 5).map((src, i) => <Pic key={src} src={src} onClick={() => zoom(i + 1)} />)}</div>}
      </motion.div>
    </motion.article>
  );
}

/** 4 · SPLIT — two halves of the photo fly in from opposite sides and meet on a diagonal sword-slash. */
function Split({ post, zoom }) {
  const src = asset(post.images[0]);
  return (
    <motion.article className="bl-post l2-split" {...inView}>
      <button type="button" className="l2-split-img" onClick={() => zoom(0)} data-hover>
        <motion.img src={src} alt="" loading="lazy" className="l2-split-full" variants={V({ opacity: 0 }, { opacity: 1, transition: { delay: 0.8, duration: 0.05 } })} />
        <motion.span className="l2-half a" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true"
          variants={V({ x: '-105%', y: '-30%', opacity: 1 }, { x: 0, y: 0, opacity: 0, transition: { duration: 0.8, ease: [0.7, 0, 0.2, 1], opacity: { delay: 1.3, duration: 0.35 } } })} />
        <motion.span className="l2-half b" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true"
          variants={V({ x: '105%', y: '30%', opacity: 1 }, { x: 0, y: 0, opacity: 0, transition: { duration: 0.8, ease: [0.7, 0, 0.2, 1], opacity: { delay: 1.3, duration: 0.35 } } })} />
        <motion.span className="l2-slash" aria-hidden="true"
          variants={V({ scaleX: 0, opacity: 1 }, { scaleX: [0, 1, 1], opacity: [1, 1, 0], transition: { duration: 0.7, delay: 0.7, times: [0, 0.5, 1] } })} />
      </button>
      <motion.div variants={V({ opacity: 0, y: 30 }, { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.9 } })}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** 5 · DECK — photos stacked like cards in 3D; they fan out as the post arrives and spread wider on hover. */
function Deck({ post, zoom }) {
  const pics = post.images.slice(0, 5);
  return (
    <motion.article className="bl-post l2-deck" {...inView}>
      <div className={`l2-deck-stage n${pics.length}`}>
        {pics.map((src, i) => (
          <motion.div key={src} className="l2-card-slot" style={{ zIndex: 10 - i }}
            variants={V({ opacity: 0, y: -140 }, { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.15 + i * 0.12, ease: EASE } })}>
            <div className="l2-card" style={{ '--i': i }}><Pic src={src} onClick={() => zoom(i)} /></div>
          </motion.div>
        ))}
      </div>
      <motion.div variants={V({ opacity: 0, x: 60 }, { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.3 } })}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** 6 · ANIME OPENING — colour bars wipe across, the title stands up vertically like an anime title card. */
function Vertical({ post, zoom }) {
  const { tr } = useSettings();
  return (
    <motion.article className="bl-post l2-vert" {...inView}>
      <div className="l2-vert-frame">
        <Pic src={post.images[0]} onClick={() => zoom(0)} />
        <span className="l2-vert-sun" aria-hidden="true" />
        {['r', 'w', 'k'].map((c, i) => (
          <motion.span key={c} className={`l2-bar ${c}`} aria-hidden="true"
            variants={V({ x: '0%' }, { x: '101%', transition: { duration: 0.75, delay: 0.1 + i * 0.12, ease: [0.8, 0, 0.2, 1] } })} />
        ))}
        <div className="l2-vert-title"><TitleFx text={tr(post.title)} /></div>
        <span className="l2-vert-no display" aria-hidden="true">第{String(post.images.length).padStart(2, '0')}話</span>
      </div>
      <motion.div variants={V({ opacity: 0, y: 30 }, { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.6 } })}>
        <Text post={{ ...post, title: '' }} />
        {post.images.length > 1 && <div className="l2-thumbs">{post.images.slice(1, 6).map((src, i) => <Pic key={src} src={src} onClick={() => zoom(i + 1)} />)}</div>}
      </motion.div>
    </motion.article>
  );
}

/** 7 · ORBIT — the main photo is a planet; the other photos orbit around it. */
function Orbit({ post, zoom }) {
  const moons = post.images.slice(1, 6);
  return (
    <motion.article className="bl-post l2-orbit" {...inView}>
      <motion.div className="l2-orbit-sys" variants={V({ opacity: 0, scale: 0.3, rotate: -120 }, { opacity: 1, scale: 1, rotate: 0, transition: { duration: 1.2, ease: EASE } })}>
        <span className="l2-ring r1" aria-hidden="true" />
        <span className="l2-ring r2" aria-hidden="true" />
        <Pic src={post.images[0]} onClick={() => zoom(0)} className="l2-planet" />
        <div className="l2-moons" style={{ '--n': Math.max(moons.length, 1) }}>
          {moons.length ? moons.map((src, i) => (
            <span key={src} className="l2-moon-arm" style={{ '--k': i }}>
              <Pic src={src} onClick={() => zoom(i + 1)} className="l2-moon" />
            </span>
          )) : [0, 1, 2].map((i) => <span key={i} className="l2-moon-arm" style={{ '--k': i }}><i className="l2-dot" /></span>)}
        </div>
      </motion.div>
      <motion.div variants={V({ opacity: 0, x: 60 }, { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.5 } })}>
        <Text post={post} />
      </motion.div>
    </motion.article>
  );
}

/** 8 · GLASS — a frosted-glass card floats over a giant blurred copy of the photo. */
function Glass({ post, zoom }) {
  const src = asset(post.images[0]);
  return (
    <motion.article className="bl-post l2-glass" {...inView}>
      <motion.span className="l2-glass-bg" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true"
        variants={V({ scale: 1.35, opacity: 0 }, { scale: 1.1, opacity: 1, transition: { duration: 1.4, ease: EASE } })} />
      <motion.div className="l2-glass-photo" variants={V({ opacity: 0, y: 50, rotate: -3 }, { opacity: 1, y: 0, rotate: -2, transition: { duration: 0.9, delay: 0.2, ease: EASE } })}>
        <Pic src={post.images[0]} onClick={() => zoom(0)} />
      </motion.div>
      <motion.div className="l2-glass-card" variants={V({ opacity: 0, x: 80, rotateY: -25 }, { opacity: 1, x: 0, rotateY: 0, transition: { duration: 0.9, delay: 0.4, ease: EASE } })}>
        <Text post={post} />
        {post.images.length > 1 && <div className="l2-thumbs">{post.images.slice(1, 5).map((s, i) => <Pic key={s} src={s} onClick={() => zoom(i + 1)} />)}</div>}
      </motion.div>
    </motion.article>
  );
}

const COLS = 8, ROWS = 5;
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, x: i % COLS, y: Math.floor(i / COLS), d: ((i * 7919) % 97) / 97 }));
/** 9 · DATA RECONSTRUCT — the photo assembles itself from flying data blocks, then snaps sharp. */
function Shards({ post, zoom }) {
  const src = asset(post.images[0]);
  return (
    <motion.article className="bl-post l2-shards" {...inView}>
      <button type="button" className="l2-shards-img" onClick={() => zoom(0)} data-hover>
        <div className="l2-cells" aria-hidden="true">
          {CELLS.map((c) => (
            <motion.span key={c.i} className="l2-cell"
              style={{ backgroundImage: `url("${src}")`, backgroundSize: `${COLS * 100}% ${ROWS * 100}%`, backgroundPosition: `${(c.x / (COLS - 1)) * 100}% ${(c.y / (ROWS - 1)) * 100}%` }}
              variants={V({ opacity: 0, scale: 0.2, x: (c.d - 0.5) * 160, y: (0.5 - c.d) * 120, rotate: (c.d - 0.5) * 90 },
                { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0, transition: { duration: 0.6, delay: 0.1 + c.d * 0.8, ease: EASE } })} />
          ))}
        </div>
        <motion.img src={src} alt="" loading="lazy" className="l2-shards-full"
          variants={V({ opacity: 0 }, { opacity: 1, transition: { duration: 0.4, delay: 1.6 } })} />
        <motion.span className="l2-scanbar" aria-hidden="true" variants={V({ y: '-100%' }, { y: '1100%', transition: { duration: 1.6, ease: 'linear' } })} />
      </button>
      <motion.div variants={V({ opacity: 0, y: 30 }, { opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.5 } })}>
        <Text post={post} />
        {post.images.length > 1 && <div className="l2-thumbs">{post.images.slice(1, 6).map((s, i) => <Pic key={s} src={s} onClick={() => zoom(i + 1)} />)}</div>}
      </motion.div>
    </motion.article>
  );
}

/** 10 · MAGAZINE COVER — huge masthead letters drop onto the cover photo, the story sits beside it like an article. */
function Magazine({ post, zoom }) {
  const { tr } = useSettings();
  const word = (tr(post.title) || '').split(' ').slice(0, 2).join(' ').toUpperCase();
  return (
    <motion.article className="bl-post l2-mag" {...inView}>
      <div className="l2-mag-cover">
        <motion.div className="l2-mag-photo" variants={V({ scale: 1.2 }, { scale: 1, transition: { duration: 1.3, ease: EASE } })}>
          <Pic src={post.images[0]} onClick={() => zoom(0)} />
        </motion.div>
        <div className="l2-mag-mast display" aria-hidden="true">
          {Array.from(word).map((ch, i) => (
            <motion.span key={i} variants={V({ y: '-120%', opacity: 0 }, { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.2 + i * 0.04 } })}>{ch === ' ' ? ' ' : ch}</motion.span>
          ))}
        </div>
        <span className="l2-mag-issue mono" aria-hidden="true">ISSUE · {tr(post.date || '')}</span>
        <span className="l2-mag-bar" aria-hidden="true" />
      </div>
      <motion.div className="l2-mag-article" variants={V({ opacity: 0, x: 60 }, { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.5 } })}>
        <span className="l2-mag-kicker mono"><Icon name="star" size={12} /> FEATURE</span>
        <Text post={post} />
        {post.images.length > 1 && <div className="l2-thumbs">{post.images.slice(1, 5).map((s, i) => <Pic key={s} src={s} onClick={() => zoom(i + 1)} />)}</div>}
      </motion.div>
    </motion.article>
  );
}

export const VIEWS2 = { hud: Hud, manga: Manga, holo: Holo, split: Split, deck: Deck, vertical: Vertical, orbit: Orbit, glass: Glass, shards: Shards, magazine: Magazine };
