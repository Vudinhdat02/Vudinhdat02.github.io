import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icons';
import { profile } from '../data/profile';
import { projects } from '../data/projects';
import achievements from '../data/achievements.json';
import skills from '../data/skills.json';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import { VIEWS } from './HUDHeader';
import './Terminal.css';

const COMMANDS = ['help', 'about', 'whoami', 'skills', 'projects', 'achievements', 'cv', 'contact', 'open', 'ls', 'lang', 'theme', 'clear', 'date', 'echo', 'history', 'sudo', 'exit'];
const bar = (v, w = 20) => '█'.repeat(Math.round((v / 100) * w)) + '░'.repeat(w - Math.round((v / 100) * w));

// Lines can hold a translation key (re-rendered when the language changes) or literal text.
const WELCOME = [
  { k: 'ok', key: 'term.welcome1' },
  { k: 'out', key: 'term.welcome2' },
];

export default function Terminal({ onNavigate, isMobile }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState(WELCOME);
  const [input, setInput] = useState('');
  const [hist, setHist] = useState([]);
  const [hIdx, setHIdx] = useState(-1);
  const inputRef = useRef(null);
  const outRef = useRef(null);
  const { play } = useSound();
  const { t, tr, setLang, setTheme, locale } = useSettings();

  const print = useCallback((...ls) => setLines((prev) => [...prev, ...ls].slice(-200)), []);

  useEffect(() => { outRef.current?.scrollTo({ top: outRef.current.scrollHeight }); }, [lines, open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '`' && !e.target.closest?.('input:not(.term-input),textarea')) {
        e.preventDefault();
        setOpen((o) => { const n = !o; if (n) setTimeout(() => inputRef.current?.focus(), 50); return n; });
      }
      if (e.key === 'Escape' && open && !document.querySelector('.bm-modal')) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const run = (raw) => {
    const cmdline = raw.trim();
    print({ k: 'in', t: cmdline });
    if (!cmdline) return;
    setHist((h) => [...h, cmdline].slice(-50)); setHIdx(-1);
    const [cmd, ...args] = cmdline.split(/\s+/);
    const arg = args.join(' ').toLowerCase();
    switch (cmd.toLowerCase()) {
      case 'help':
        print(
          { k: 'ok', t: t('term.helpTitle') },
          ...[
            ['help', 'help'], ['about | whoami', 'about'], ['skills', 'skills'], ['projects', 'projects'],
            ['achievements', 'achievements'], ['cv', 'cv'], ['contact', 'contact'], ['open <view>', 'open'], ['ls', 'ls'],
            ['lang en|vi', 'lang'], ['theme dark|light', 'theme'], ['date', 'date'],
            ['echo <text>', 'echo'], ['history', 'history'], ['clear', 'clear'], ['exit', 'exit'],
          ].map(([c, d]) => ({ k: 'out', t: `  ${c.padEnd(18, ' ')} ${t(`term.h.${d}`)}` }))
        );
        break;
      case 'about': case 'whoami':
        print({ k: 'ok', t: `${profile.name} — ${tr(profile.role)}` }, { k: 'out', t: `${profile.codename} · ${tr(profile.location)} · ${profile.clearance}` }, { k: 'out', t: tr(profile.bio) });
        break;
      case 'skills':
        print(...skills.map((sk, i) => ({ k: 'out', t: `  ${String(i + 1).padStart(2, '0')}  ${tr(sk.name).padEnd(20, ' ')} ${tr(sk.desc || '')}` })));
        break;
      case 'projects':
        print(...projects.map((p) => ({ k: 'out', t: `  ${p.id}  ${p.title.padEnd(22, ' ')} ${t(`pcat.${p.category}`).padEnd(8, ' ')} ${p.year}` })), { k: 'ok', t: t('term.openProjects') });
        break;
      case 'achievements':
        print(...achievements.map((a) => ({ k: 'gold', t: `  ★ ${tr(a.title)}${a.date ? ` (${tr(a.date)})` : ''}` })),
          { k: 'ok', t: t('dash.achCount', { n: achievements.length }) });
        setTimeout(() => onNavigate('achievements'), 400);
        break;
      case 'cv':
        print({ k: 'ok', t: t('term.launching', { v: 'CV' }) });
        onNavigate('cv');
        break;
      case 'contact':
        print({ k: 'ok', t: t('term.comms') }, ...profile.socials.map((s) => ({ k: 'out', t: `  ${String(tr(s.label)).padEnd(11, ' ')} ${s.handle}` })), { k: 'out', t: t('term.openingComms') });
        setTimeout(() => onNavigate('contact'), 400);
        break;
      case 'open': case 'goto': case 'cd': {
        const v = VIEWS.find((x) => arg && x.id.startsWith(arg));
        if (v) { print({ k: 'ok', t: t('term.launching', { v: t(`nav.${v.id}`) }) }); onNavigate(v.id); }
        else print({ k: 'err', t: t('term.unknownView', { v: arg, list: VIEWS.map((x) => x.id).join(' | ') }) });
        break;
      }
      case 'ls': print({ k: 'out', t: VIEWS.map((v) => v.id + '/').join('   ') }); break;
      case 'lang':
        if (arg === 'en' || arg === 'vi') { setLang(arg); print({ k: 'ok', key: 'term.langState' }); }
        else { print({ k: 'err', t: t('term.langUsage') }); play('error'); return; }
        break;
      case 'theme':
        if (arg === 'dark' || arg === 'light') { setTheme(arg); print({ k: 'ok', t: t('term.themeState', { s: arg.toUpperCase() }) }); }
        else { print({ k: 'err', t: t('term.themeUsage') }); play('error'); return; }
        break;
      case 'clear': case 'cls': setLines([]); return;
      case 'date': print({ k: 'out', t: new Date().toLocaleString(locale) }); break;
      case 'echo': print({ k: 'out', t: args.join(' ') }); break;
      case 'history': print(...hist.map((h, i) => ({ k: 'out', t: `  ${String(i + 1).padStart(3, ' ')}  ${h}` }))); break;
      case 'sudo': print({ k: 'err', t: t('term.denied') }); play('error'); return;
      case 'exit': setOpen(false); break;
      default:
        print({ k: 'err', t: t('term.notFound', { c: cmd }) }); play('error'); return;
    }
    play('success');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { run(input); setInput(''); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault(); if (!hist.length) return;
      const i = hIdx < 0 ? hist.length - 1 : Math.max(0, hIdx - 1); setHIdx(i); setInput(hist[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); if (hIdx < 0) return;
      const i = hIdx + 1; if (i >= hist.length) { setHIdx(-1); setInput(''); } else { setHIdx(i); setInput(hist[i]); }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      if (parts.length === 1) { const m = COMMANDS.filter((c) => c.startsWith(parts[0])); if (m.length === 1) setInput(m[0] + ' '); else if (m.length) print({ k: 'out', t: m.join('   ') }); }
      else if (['open', 'goto', 'cd'].includes(parts[0])) { const m = VIEWS.filter((v) => v.id.startsWith(parts[1])); if (m.length === 1) setInput(`${parts[0]} ${m[0].id}`); }
    } else if (e.key.length === 1) play('key');
  };

  const quick = ['help', 'skills', 'projects', 'contact', 'clear'];

  return (
    <div className={`term ${open ? 'open' : ''} ${isMobile ? 'mobile' : ''}`} data-noswipe>
      <AnimatePresence>
        {open && (
          <motion.div className="term-panel glass" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <div ref={outRef} className="term-out mono" role="log" aria-live="polite" onClick={() => inputRef.current?.focus()}>
              {lines.map((l, i) => (
                <div key={i} className={`term-line k-${l.k}`}>
                  {l.k === 'in' ? <><span className="term-ps">operator@nexus:~$</span> {l.t}</> : (l.key ? t(l.key) : l.t)}
                </div>
              ))}
            </div>
            <div className="term-quick">
              {quick.map((q) => <button key={q} className="chip" onClick={() => { run(q); inputRef.current?.focus({ preventScroll: true }); }}>{q}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="term-bar glass">
        <button className="term-toggle tap" onClick={() => { setOpen((o) => !o); play(open ? 'close' : 'open'); if (!open) setTimeout(() => inputRef.current?.focus(), 60); }} aria-expanded={open} aria-label={open ? t('term.collapse') : t('term.expand')}>
          <Icon name="terminal" size={16} />
          <span className="mono hide-mobile">{t('term.label')}</span>
          <Icon name="chevronUp" size={14} className="term-chev" />
        </button>
        <label className="term-prompt mono" htmlFor="term-input"><span className="term-ps">operator@nexus:~$</span></label>
        <input
          id="term-input" ref={inputRef} className="term-input mono" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={isMobile ? t('term.placeholderShort') : t('term.placeholder')}
          autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="send"
          aria-label={t('term.input')}
        />
        {isMobile && <button className="term-run tap" onClick={() => { run(input); setInput(''); }} aria-label={t('term.run')}><Icon name="send" size={16} /></button>}
      </div>
    </div>
  );
}
