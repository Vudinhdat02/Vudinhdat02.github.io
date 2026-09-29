import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icons';
import { asset } from '../utils/asset';
import './Lightbox.css';

/**
 * Full-screen image viewer. items = [{ src, title, sub }], index = open item (null = closed).
 * Arrow keys / buttons move between images, Esc or a click outside closes.
 */
export default function Lightbox({ items, index, onClose, onNav }) {
  useEffect(() => {
    if (index == null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, onNav]);
  const item = index != null ? items[index] : null;
  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div className="ar-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.figure key={index} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}>
            <img src={asset(item.src)} alt={item.title || ''} />
            {(item.title || item.sub) && (
              <figcaption>{item.title && <b>{item.title}</b>}{item.sub && <span className="mono"> · {item.sub}</span>}</figcaption>
            )}
            {items.length > 1 && <span className="lb-count mono">{index + 1} / {items.length}</span>}
          </motion.figure>
          <button className="ar-lb-btn close tap" onClick={onClose} aria-label="Close"><Icon name="close" size={22} /></button>
          {items.length > 1 && <>
            <button className="ar-lb-btn prev tap" onClick={(e) => { e.stopPropagation(); onNav(-1); }} aria-label="Previous"><Icon name="chevronL" size={26} /></button>
            <button className="ar-lb-btn next tap" onClick={(e) => { e.stopPropagation(); onNav(1); }} aria-label="Next"><Icon name="chevronR" size={26} /></button>
          </>}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
