import { useCallback, useEffect, useRef, useState } from 'react';
import { asset } from '../utils/asset';
import { motion } from 'framer-motion';
import OSWindow from '../components/OSWindow';
import Icon from '../components/Icons';
import { EDIT_MODE, uploadCv } from '../admin/adminApi';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './CV.css';

/**
 * CV viewer. The PDF lives in public/cv.pdf — replace that file (or use the "Replace CV" button
 * while running npm run dev) and the page shows the new version automatically.
 */
const CV_URL = asset('/cv.pdf');

function PdfPages({ src, onError }) {
  const holder = useRef(null);
  const [pages, setPages] = useState(0);
  const [width, setWidth] = useState(0);
  const docRef = useRef(null);

  // measure available width
  useEffect(() => {
    const el = holder.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // load document
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const doc = await pdfjs.getDocument({ url: src, isEvalSupported: false }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setPages(doc.numPages);
      } catch (e) {
        if (!cancelled) onError(e);
      }
    })();
    return () => { cancelled = true; };
  }, [src, onError]);

  // render pages at current width
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !width || !holder.current) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 450)); // let the page transition finish first
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const scale = (width / base.width) * dpr;
        const vp = page.getViewport({ scale });
        const canvas = holder.current?.querySelector(`canvas[data-page="${n}"]`);
        if (!canvas) continue;
        canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
        canvas.style.aspectRatio = `${vp.width} / ${vp.height}`;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      }
    })();
    return () => { cancelled = true; };
  }, [pages, width]);

  return (
    <div ref={holder} className="cv-pages">
      {Array.from({ length: pages }, (_, i) => (
        <motion.div key={i} className="cv-sheet"
          initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0.4 }}
          animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.25 + i * 0.4, ease: [0.65, 0, 0.35, 1] }}>
          <canvas data-page={i + 1} />
          <motion.span className="cv-laser" aria-hidden="true"
            initial={{ top: '0%', opacity: 1 }} animate={{ top: '100%', opacity: [1, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.25 + i * 0.4, ease: [0.65, 0, 0.35, 1] }} />
        </motion.div>
      ))}
    </div>
  );
}

export default function CV() {
  const { t } = useSettings();
  const { play } = useSound();
  const [version, setVersion] = useState(0);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);
  const onError = useCallback(() => setFailed(true), []);
  const [override, setOverride] = useState(null); // freshly uploaded CV shown before GitHub rebuilds
  const src = override || (version ? `${CV_URL}?v=${version}` : CV_URL);

  const onReplace = async (file) => {
    setMsg('');
    try {
      const local = await uploadCv(file);
      setFailed(false); if (local) setOverride(local); else setVersion(Date.now()); setMsg(t('cv.replaced')); play('success');
    } catch (e) {
      setMsg(e.message); play('error');
    }
  };

  return (
    <OSWindow title={t('cv.title')} className="cv-win" enter="rise">
      <div className="cv-toolbar">
        <a className="btn primary tap" href={src} target="_blank" rel="noreferrer" onClick={() => play('click')}><Icon name="external" size={15} /> {t('cv.open')}</a>
        <a className="btn tap" href={src} download="CV-Vu-Dinh-Dat.pdf" onClick={() => play('click')}><Icon name="download" size={15} /> {t('cv.download')}</a>
        {EDIT_MODE && <>
          <button type="button" className="ed-mini cv-replace" onClick={() => fileRef.current?.click()}><Icon name="file" size={14} /> {t('cv.replace')}</button>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onReplace(f); e.target.value = ''; }} />
        </>}
        {msg && <span className="cv-msg mono">{msg}</span>}
      </div>
      <div className="cv-stage">
        {failed
          ? <p className="cv-error">{t('cv.error')}</p>
          : <PdfPages key={src} src={src} onError={onError} />}
      </div>
    </OSWindow>
  );
}
