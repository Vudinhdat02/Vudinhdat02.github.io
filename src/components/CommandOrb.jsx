import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icons';
import { VIEWS } from './HUDHeader';
import projects from '../data/projects.json';
import achievements from '../data/achievements.json';
import blog from '../data/blog.json';
import { profile } from '../data/profile';
import { asset } from '../utils/asset';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './CommandOrb.css';

/** lower-case, no Vietnamese accents — so "thanh tich" finds "Thành tích" */
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/**
 * Small glowing orb in the corner. Click it (or press Ctrl + K / `) to open a quick-jump panel:
 * pages, projects, achievements, blog posts and handy actions — type to filter, ↑ ↓ Enter to pick.
 */
export default function CommandOrb({ onNavigate }) {
  const { t, tr, toggleLang, toggleTheme, theme, lang } = useSettings();
  const { play } = useSound();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '`' && !typing)) { e.preventDefault(); setOpen((o) => !o); play('open'); }
      else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play]);
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 60); } }, [open]);

  // open the Dashboard, then ask the blog to show that post (even if it is behind "Load more") and scroll to it
  const goPost = (id) => {
    onNavigate('dashboard');
    setTimeout(() => window.dispatchEvent(new CustomEvent('blog:reveal', { detail: id })), 700);
  };

  const items = useMemo(() => {
    const email = profile.email;
    const list = [
      ...VIEWS.map((v) => ({ group: 'pages', icon: v.icon, label: t(`nav.${v.id}`), run: () => onNavigate(v.id) })),
      { group: 'actions', icon: lang === 'vi' ? 'globe' : 'globe', label: t('orb.lang'), hint: lang === 'vi' ? 'EN' : 'VI', run: toggleLang, keep: true },
      { group: 'actions', icon: theme === 'dark' ? 'sun' : 'moon', label: theme === 'dark' ? t('orb.light') : t('orb.dark'), run: toggleTheme, keep: true },
      { group: 'actions', icon: 'download', label: t('orb.cv'), run: () => { const a = document.createElement('a'); a.href = asset('/cv.pdf'); a.download = 'CV-Vu-Dinh-Dat.pdf'; a.click(); } },
      email && { group: 'actions', icon: 'mail', label: t('orb.mail'), hint: email, run: () => { window.location.href = `mailto:${email}`; } },
      email && { group: 'actions', icon: 'check', label: t('orb.copy'), hint: email, run: () => navigator.clipboard?.writeText(email) },
      ...profile.socials.filter((s) => /^https?:/.test(s.url)).map((s) => ({ group: 'actions', icon: s.icon || 'external', label: `${tr(s.label)}`, hint: s.handle, run: () => window.open(s.url, '_blank', 'noopener') })),
      ...projects.map((p) => ({ group: 'projects', icon: 'projects', label: p.title, hint: p.year, image: p.images?.[0], run: () => onNavigate('projects') })),
      ...achievements.map((a) => ({ group: 'achievements', icon: 'trophy', label: tr(a.title), hint: tr(a.date || ''), image: a.image, run: () => onNavigate('achievements') })),
      ...blog.map((b) => ({ group: 'blog', icon: 'edit', label: tr(b.title), hint: tr(b.date || ''), image: b.images?.[0], run: () => goPost(b.id) })),
    ].filter(Boolean);
    return list;
  }, [t, tr, lang, theme, toggleLang, toggleTheme, onNavigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const hit = words.length ? items.filter((it) => { const h = norm(`${it.label} ${it.hint || ''} ${t(`orb.g.${it.group}`)}`); return words.every((w) => h.includes(w)); }) : items;
    return words.length ? hit.slice(0, 40) : hit.filter((it) => it.group === 'pages' || it.group === 'actions' || it.group === 'blog').slice(0, 30);
  }, [q, items, t]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector('.orb-item.on')?.scrollIntoView({ block: 'nearest' }); }, [sel]);

  const run = (it) => { play('click'); it.run(); if (!it.keep) setOpen(false); };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, shown.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); run(shown[sel]); }
  };

  let lastGroup = '';
  return (
    <>
      <button type="button" className={`orb ${open ? 'open' : ''}`} onClick={() => { setOpen(!open); play('open'); }} aria-label={t('orb.title')} aria-expanded={open}>
        <span className="orb-ring" aria-hidden="true" />
        <span className="orb-ring r2" aria-hidden="true" />
        <span className="orb-core" aria-hidden="true"><Icon name={open ? 'close' : 'search'} size={20} stroke={2} /></span>
        <span className="orb-sat" aria-hidden="true"><i /></span>
        <span className="orb-tip mono" aria-hidden="true">{t('orb.tip')} <kbd>Ctrl</kbd><kbd>K</kbd></span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="orb-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
              <motion.div className="orb-panel" role="dialog" aria-label={t('orb.title')}
                initial={{ opacity: 0, scale: 0.6, y: 120, x: 120 }} animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.8, y: 60, x: 60 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
                <span className="orb-scan" aria-hidden="true" />
                <div className="orb-search">
                  <Icon name="search" size={18} />
                  <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} placeholder={t('orb.ph')} spellCheck={false} aria-label={t('orb.ph')} />
                  <kbd className="mono">ESC</kbd>
                </div>
                <ul className="orb-list" ref={listRef} role="listbox">
                  {!shown.length && <li className="orb-empty dim">{t('orb.none')}</li>}
                  {shown.map((it, i) => {
                    const head = it.group !== lastGroup ? (lastGroup = it.group, <li key={`g-${it.group}`} className="orb-group mono">{t(`orb.g.${it.group}`)}</li>) : null;
                    return [head,
                      <motion.li key={`${it.group}-${i}`} role="option" aria-selected={i === sel}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 12) * 0.018 }}>
                        <button type="button" className={`orb-item ${i === sel ? 'on' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => run(it)}>
                          {it.image ? <img src={asset(it.image)} alt="" loading="lazy" /> : <span className="orb-ic"><Icon name={it.icon} size={16} /></span>}
                          <span className="orb-label">{it.label}</span>
                          {it.hint && <span className="orb-hint mono">{it.hint}</span>}
                          <Icon name="chevronR" size={14} className="orb-go" />
                        </button>
                      </motion.li>];
                  })}
                </ul>
                <div className="orb-foot mono"><span><kbd>↑</kbd><kbd>↓</kbd> {t('orb.move')}</span><span><kbd>Enter</kbd> {t('orb.open')}</span><span><kbd>Ctrl</kbd><kbd>K</kbd> {t('orb.toggle')}</span></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
