import { Fragment, createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Icon from '../components/Icons';
import ScrambleText from '../components/fx/ScrambleText';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';

/* Pieces shared by every blog layout. */

export const EASE = [0.22, 1, 0.36, 1];
export const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.22 } };

/** 'cover' = photos fill their frame (may crop) · 'contain' = whole photo always visible */
export const FitCtx = createContext('cover');
/** title animation chosen for the post (see TITLE_FX) */
export const TitleFxCtx = createContext('fade');

/** The page scrolls inside <main id="main">, not the window. */
export function useStageScroll(target) {
  const container = useRef(null);
  useLayoutEffect(() => { container.current = document.getElementById('main'); }, []);
  return useScroll({ target, container, offset: ['start end', 'end start'] });
}

/** Photo that drifts slightly while the page scrolls (transform only → smooth). */
export function ParallaxImg({ src, alt, strength = 40, onClick, className = '' }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const contain = useContext(FitCtx) === 'contain';
  const { scrollYProgress } = useStageScroll(ref);
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <button type="button" ref={ref} className={`bl-px ${className}`} onClick={onClick} data-hover>
      <motion.img src={asset(src)} alt={alt} loading="lazy" style={reduced || contain ? undefined : { y, scale: 1.14 }} />
    </button>
  );
}

/** A plain photo button (all photos are buttons: click = enlarge, hover = the post's hover effect). */
export function Pic({ src, onClick, className = '', style }) {
  return (
    <button type="button" className={`bl-pic ${className}`} onClick={onClick} style={style} data-hover>
      <img src={asset(src)} alt="" loading="lazy" draggable={false} />
    </button>
  );
}

/* ---------- title effects ---------- */

export const TITLE_FX = ['fade', 'scramble', 'katakana', 'type', 'glitch', 'neon', 'wave', 'split', 'blade', 'gradient'];
const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';

/** Splits a title into words → letters (words never break in the middle). */
function Letters({ text, variants, custom }) {
  let n = 0;
  return String(text).split(' ').map((w, wi, arr) => (
    <Fragment key={wi}>
      <span className="tfx-word">
        {Array.from(w).map((ch) => {
          const i = n++;
          return <motion.span key={i} className="tfx-ch" style={{ '--i': i }} variants={variants} custom={custom ? custom(i) : i}>{ch}</motion.span>;
        })}
      </span>
      {wi < arr.length - 1 && ' '}
    </Fragment>
  ));
}

function Typewriter({ text, start }) {
  const [n, setN] = useState(0);
  const chars = Array.from(text);
  useEffect(() => {
    if (!start) return;
    let i = 0;
    const id = setInterval(() => { i++; setN(i); if (i >= chars.length) clearInterval(id); }, Math.max(28, 900 / chars.length));
    return () => clearInterval(id);
  }, [start, text]); // eslint-disable-line react-hooks/exhaustive-deps
  return <><span aria-hidden="true">{chars.slice(0, n).join('')}</span><span className="tfx-caret" aria-hidden="true" /><span className="sr-only">{text}</span></>;
}

/** Post title with its chosen animation. It plays when the title scrolls into view. */
export function TitleFx({ text, fx: fxProp, as: Tag = 'h3', className = '' }) {
  const ctx = useContext(TitleFxCtx);
  const fx = fxProp || ctx || 'fade';
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const cls = `bl-title display tfx tfx-${fx} ${seen ? 'on' : ''} ${className}`;
  if (reduced || fx === 'fade') {
    return <motion.h3 ref={ref} className={cls} initial={{ opacity: 0, y: 14 }} animate={seen ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: EASE }}>{text}</motion.h3>;
  }
  if (fx === 'scramble' || fx === 'katakana') {
    return <Tag ref={ref} className={cls}>{seen ? <ScrambleText text={text} duration={1100} glyphs={fx === 'katakana' ? KATAKANA : undefined} /> : <span style={{ opacity: 0 }}>{text}</span>}</Tag>;
  }
  if (fx === 'type') return <Tag ref={ref} className={cls}><Typewriter text={text} start={seen} /></Tag>;
  if (fx === 'wave' || fx === 'split') {
    const v = fx === 'wave'
      ? { hidden: { opacity: 0, y: '0.9em' }, show: (i) => ({ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 16, delay: i * 0.035 } }) }
      : { hidden: (i) => ({ opacity: 0, x: ((i * 37) % 7 - 3) * 22, y: ((i * 53) % 9 - 4) * 18, rotate: ((i * 29) % 11 - 5) * 18, scale: 1.8 }),
          show: (i) => ({ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, transition: { duration: 0.7, ease: EASE, delay: 0.1 + (i % 12) * 0.035 } }) };
    return (
      <Tag ref={ref} className={cls} aria-label={text}>
        <motion.span aria-hidden="true" initial="hidden" animate={seen ? 'show' : 'hidden'}><Letters text={text} variants={v} /></motion.span>
      </Tag>
    );
  }
  // glitch · neon · blade · gradient — pure CSS, start when `.on` is added
  return <Tag ref={ref} className={cls} data-text={text}><span className="tfx-inner">{text}</span></Tag>;
}

/** Date + title + story (story folds after ~7 lines with "Read more"). */
export function Text({ post, align }) {
  const { t, tr } = useSettings();
  const text = tr(post.text || '');
  const long = text.length > 420 || text.split('\n').length > 8;
  const [open, setOpen] = useState(false);
  return (
    <div className={`bl-text ${align || ''}`}>
      {post.date && <span className="bl-date mono"><Icon name="flag" size={12} /> {tr(post.date)}</span>}
      {post.title && <TitleFx text={tr(post.title)} />}
      {text && <p className={`bl-body ${long && !open ? 'clamped' : ''}`}>{text}</p>}
      {long && (
        <button type="button" className="bl-more mono" onClick={() => setOpen(!open)}>
          {open ? t('blog.less') : t('blog.more')} <Icon name={open ? 'chevronUp' : 'chevronR'} size={14} />
        </button>
      )}
    </div>
  );
}
