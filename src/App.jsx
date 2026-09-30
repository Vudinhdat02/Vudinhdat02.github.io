import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import CyberBackground, { camera } from './components/CyberBackground';
import Cursor from './components/Cursor';
import TouchFeedback from './components/TouchFeedback';
import BootSequence from './components/BootSequence';
import HUDHeader, { VIEWS } from './components/HUDHeader';
import CommandOrb from './components/CommandOrb';
import SiteFooter from './components/SiteFooter';
import AdminPanel from './admin/AdminPanel';
import Dashboard from './sections/Dashboard';
import { useDevice } from './hooks/useDevice';
import { useSwipe } from './hooks/useSwipe';
import { useSound } from './context/SoundContext';
import { useSettings } from './context/SettingsContext';
import './App.css';

// Sci-fi crosshair cursor with glowing trail. false = normal mouse pointer.
const USE_CUSTOM_CURSOR = false;

// Terminal boot screen ("ACCESS GRANTED") before the site. false = open straight into the dashboard.
const SHOW_BOOT = false;

// Code-split the heavier views
const Projects = lazy(() => import('./sections/Projects'));
const Achievements = lazy(() => import('./achievements/Achievements'));
const Contact = lazy(() => import('./sections/Contact'));
const CV = lazy(() => import('./sections/CV'));

// Warm up the other pages while the browser is idle, so the first click on a tab has nothing to download/parse.
const preloadViews = () => {
  const run = () => {
    import('./sections/Projects');
    import('./achievements/Achievements');
    import('./sections/Contact');
    import('./sections/CV');
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 }); else setTimeout(run, 1500);
};

/*
 * Each destination page has its own transition style (fx):
 *   dashboard → zoom · projects → glitch · achievements → flip · contact → iris · cv → print
 */
const FX_BY_VIEW = { dashboard: 'zoom', projects: 'glitch', achievements: 'flip', contact: 'iris', cv: 'print' };
const EASE = [0.22, 1, 0.36, 1];

// Performance: only transform / opacity / inset-clip are animated (GPU-friendly). No blur filters.
const pageVariants = {
  initial: ({ dir, fx }) => ({
    zoom:   { opacity: 0, scale: 1.06 },
    glitch: { opacity: 0, x: dir * 60, skewX: dir * -5 },
    flip:   { opacity: 0, rotateY: dir * 18, x: dir * 50 },
    iris:   { opacity: 0, scale: 0.94, y: 16 },
    print:  { opacity: 0, y: -40, scaleY: 0.96 },
  }[fx]),
  animate: ({ fx }) => ({
    opacity: 1, scale: 1, scaleY: 1, x: 0, y: 0, skewX: 0, rotateY: 0,
    transition: { duration: fx === 'print' ? 0.45 : 0.38, ease: EASE },
  }),
  exit: ({ dir, fx }) => ({
    ...{
      zoom:   { opacity: 0, scale: 0.96 },
      glitch: { opacity: 0, x: dir * -40 },
      flip:   { opacity: 0, rotateY: dir * -14, x: dir * -30 },
      iris:   { opacity: 0, scale: 1.03 },
      print:  { opacity: 0, y: 16 },
    }[fx],
    transition: { duration: 0.16, ease: [0.55, 0, 1, 0.45] },
  }),
};

/** Background camera move + screen overlay per transition style. */
function playTransition(fx, dir, overlay) {
  gsap.killTweensOf(camera);
  const tl = gsap.timeline();
  if (fx === 'zoom') tl.to(camera, { zoom: 0.78, glitch: 0.3, duration: 0.3, ease: 'power2.in' }).to(camera, { zoom: 1, glitch: 0, duration: 1.1, ease: 'expo.out' });
  else if (fx === 'flip') tl.to(camera, { zoom: 1.35, x: dir * -120, duration: 0.35, ease: 'power2.in' }).to(camera, { zoom: 1, x: 0, duration: 1.1, ease: 'expo.out' });
  else if (fx === 'iris') tl.to(camera, { zoom: 1.25, y: 60, duration: 0.3, ease: 'power2.in' }).to(camera, { zoom: 1, y: 0, duration: 1.2, ease: 'expo.out' });
  else if (fx === 'print') tl.to(camera, { y: -140, glitch: 0.4, duration: 0.35, ease: 'power2.in' }).to(camera, { y: 0, glitch: 0, duration: 1.1, ease: 'expo.out' });
  else tl.to(camera, { zoom: 1.18, x: dir * -60, glitch: 1, duration: 0.3, ease: 'power2.in' }).to(camera, { zoom: 1, x: 0, glitch: 0, duration: 0.9, ease: 'expo.out' });

  if (!overlay) return;
  const lines = overlay.querySelectorAll('.warp-line');
  const shutter = overlay.querySelectorAll('.shutter');
  const ring = overlay.querySelector('.burst');
  const sweep = overlay.querySelector('.sweep');
  if (fx === 'glitch' || fx === 'zoom') {
    gsap.fromTo(lines, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 0, duration: 0.55, stagger: 0.03, ease: 'power3.out', transformOrigin: dir > 0 ? 'left center' : 'right center' });
  }
  if (fx === 'flip') {
    gsap.timeline()
      .fromTo(shutter, { scaleY: 0 }, { scaleY: 1, duration: 0.25, ease: 'power3.in' })
      .to(shutter, { scaleY: 0, duration: 0.45, ease: 'power3.out', delay: 0.05 });
  }
  if (fx === 'iris' && ring) {
    gsap.fromTo(ring, { scale: 0, opacity: 1 }, { scale: 3.2, opacity: 0, duration: 0.9, ease: 'power2.out' });
  }
  if (fx === 'print' && sweep) {
    gsap.fromTo(sweep, { top: '-4%', opacity: 1 }, { top: '104%', opacity: 0.6, duration: 0.9, ease: 'power2.inOut' });
  }
}

const initialView = () => {
  const h = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.id === h) ? h : 'dashboard';
};

export default function App() {
  const [booted, setBooted] = useState(!SHOW_BOOT);
  const [view, setView] = useState(initialView);
  const [dir, setDir] = useState(1);
  const [fx, setFx] = useState('zoom');
  const { mobile } = useDevice();
  const { play } = useSound();
  const { t } = useSettings();
  const stageRef = useRef(null);
  const warpRef = useRef(null);

  const navigate = useCallback((id) => {
    setView((cur) => {
      if (cur === id) return cur;
      const from = VIEWS.findIndex((v) => v.id === cur), to = VIEWS.findIndex((v) => v.id === id);
      setDir(to > from ? 1 : -1);
      const d = to > from ? 1 : -1;
      setFx(FX_BY_VIEW[id] || 'glitch');
      playTransition(FX_BY_VIEW[id] || 'glitch', d, warpRef.current);
      if (window.location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
      return id;
    });
  }, []);

  // follow the address bar: typing #projects or pressing Back/Forward switches the page
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (VIEWS.some((v) => v.id === h)) navigate(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [navigate]);

  // reset scroll on view change
  useEffect(() => { stageRef.current?.scrollTo({ top: 0 }); }, [view]);

  // keyboard shortcuts 1–4
  useEffect(() => {
    if (!booted) return;
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= VIEWS.length) { play('click'); navigate(VIEWS[n - 1].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booted, navigate, play]);

  // swipe between views on touch screens
  const idx = VIEWS.findIndex((v) => v.id === view);
  useSwipe(stageRef, {
    onLeft: useCallback(() => { if (idx < VIEWS.length - 1) { play('click'); navigate(VIEWS[idx + 1].id); } }, [idx, navigate, play]),
    onRight: useCallback(() => { if (idx > 0) { play('click'); navigate(VIEWS[idx - 1].id); } }, [idx, navigate, play]),
  });

  useEffect(() => { const id = setTimeout(preloadViews, 1200); return () => clearTimeout(id); }, []);

  // hologram "materialise" when the OS first appears
  useEffect(() => {
    if (!booted) return;
    gsap.fromTo(camera, { zoom: 1.6, glitch: 1 }, { zoom: 1, glitch: 0, duration: 1.6, ease: 'expo.out' });
  }, [booted]);

  return (
    <>
      <CyberBackground />
      <div className="vignette" />
      {USE_CUSTOM_CURSOR && <Cursor />}
      <TouchFeedback />

      {!booted ? (
        <BootSequence onComplete={() => setBooted(true)} />
      ) : (
        <motion.div className="os" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <HUDHeader view={view} onNavigate={navigate} />

          <main ref={stageRef} className="stage" id="main">
            <div className="stage-inner">
              <div className="crumb mono" aria-hidden="true">
                <span className="crumb-sep" />
                {mobile && <span className="crumb-swipe">{t('app.swipe')}</span>}
              </div>
              <AnimatePresence mode="wait" custom={{ dir, fx }}>
                <motion.div key={view} className="page" custom={{ dir, fx }} variants={pageVariants} initial="initial" animate="animate" exit="exit">
                  <Suspense fallback={<div className="loading mono">{t('app.loading')}</div>}>
                    {view === 'dashboard' && <Dashboard onNavigate={navigate} />}
                    {view === 'projects' && <Projects />}
                    {view === 'achievements' && <Achievements isMobile={mobile} />}
                    {view === 'contact' && <Contact />}
                    {view === 'cv' && <CV />}
                  </Suspense>
                  <SiteFooter />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <div ref={warpRef} className="warp" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <span key={i} className="warp-line" style={{ top: `${8 + i * 13}%` }} />)}
            <span className="shutter top" /><span className="shutter bottom" />
            <span className="burst" />
            <span className="sweep" />
          </div>

          <CommandOrb onNavigate={navigate} />
        </motion.div>
      )}
      <AdminPanel />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
