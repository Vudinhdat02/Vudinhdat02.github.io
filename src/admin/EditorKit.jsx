import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../components/Icons';
import { useSettings } from '../context/SettingsContext';
import './EditorKit.css';

/** Floating OS-style dialog used by all editors. */
export function EditorModal({ open, title, onClose, children, footer }) {
  const { t } = useSettings();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="ed-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div className="ed-modal" role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 30, scale: 0.96, clipPath: 'inset(40% 0 40% 0)' }}
            animate={{ opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% 0 0% 0)' }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <header className="ed-bar">
              <span className="ed-led" />
              <h3>{title}</h3>
              <button type="button" className="ed-x tap" onClick={onClose} aria-label={t('ed.close')}><Icon name="close" size={18} /></button>
            </header>
            <div className="ed-body">{children}</div>
            {footer && <footer className="ed-foot">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      {children}
      {hint && <span className="ed-hint">{hint}</span>}
    </label>
  );
}

/** Image picker: click or drag & drop, with preview. */
export function ImagePicker({ value, file, onFile }) {
  const { t } = useSettings();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const shown = preview || value;
  return (
    <div
      className={`ed-drop ${drag ? 'drag' : ''} ${shown ? 'has' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      {shown ? <img src={shown} alt="" /> : (
        <div className="ed-drop-empty">
          <Icon name="image" size={30} />
          <span>{t('ed.pickImage')}</span>
        </div>
      )}
      {shown && <span className="ed-drop-change">{t('ed.changeImage')}</span>}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

/** Two-step delete button (no browser confirm dialog). */
export function DeleteButton({ onConfirm, label, compact = false }) {
  const { t } = useSettings();
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const id = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(id); }, [armed]);
  return (
    <button type="button" className={`ed-mini danger ${armed ? 'armed' : ''}`} onClick={() => (armed ? onConfirm() : setArmed(true))}
      title={label || t('ed.delete')}>
      <Icon name="trash" size={14} />{armed ? <> {t('ed.confirmDelete')}</> : !compact && <> {label || t('ed.delete')}</>}
    </button>
  );
}

/** Small toolbar shown on each item in edit mode. `compact` = icon-only buttons. */
export function ItemTools({ onEdit, onUp, onDown, onDelete, first, last, compact = false, children }) {
  const { t } = useSettings();
  return (
    <div className={`ed-tools ${compact ? 'compact' : ''}`} onClick={(e) => e.stopPropagation()}>
      {!compact && <span className="ed-tools-tag mono">{t('ed.editMode')}</span>}
      {children}
      {onUp && <button type="button" className="ed-mini" onClick={onUp} disabled={first} title={t('ed.up')} aria-label={t('ed.up')}><Icon name="arrowUp" size={14} /></button>}
      {onDown && <button type="button" className="ed-mini" onClick={onDown} disabled={last} title={t('ed.down')} aria-label={t('ed.down')}><Icon name="arrowDown" size={14} /></button>}
      <button type="button" className="ed-mini" onClick={onEdit} title={t('ed.edit')} aria-label={t('ed.edit')}><Icon name="edit" size={14} />{!compact && <> {t('ed.edit')}</>}</button>
      <DeleteButton onConfirm={onDelete} compact={compact} />
    </div>
  );
}

export const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/**
 * Multi-line text box: Shift + Enter = new line, Enter = save (calls onSubmit).
 * Line breaks are kept and shown on the page.
 */
export function TextArea({ value, onChange, onSubmit, rows = 3, ...rest }) {
  const ref = useRef(null);
  // grow with the content
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, 360)}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={rows} value={value} {...rest}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && onSubmit) { e.preventDefault(); onSubmit(); }
      }} />
  );
}

/**
 * Several photos at once. value = [{ url } | { file }]; click / drop to add, ✕ to remove, ← → to reorder.
 */
export function MultiImagePicker({ value, onChange }) {
  const { t } = useSettings();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [previews, setPreviews] = useState([]);
  useEffect(() => {
    const urls = value.map((v) => (v.file ? URL.createObjectURL(v.file) : v.url));
    setPreviews(urls);
    return () => value.forEach((v, i) => { if (v.file) URL.revokeObjectURL(urls[i]); });
  }, [value]);
  const add = (files) => {
    const imgs = [...files].filter((f) => f.type.startsWith('image/')).map((file) => ({ file }));
    if (imgs.length) onChange([...value, ...imgs]);
  };
  return (
    <div className={`ed-multi ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files || []); }}>
      {previews.map((src, i) => (
        <div key={src + i} className="ed-thumb">
          <img src={src} alt="" />
          <div className="ed-thumb-tools">
            <button type="button" className="ed-mini" disabled={i === 0} onClick={() => onChange(move(value, i, -1))} aria-label={t('ed.up')}><Icon name="chevronL" size={14} /></button>
            <button type="button" className="ed-mini danger" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t('ed.delete')}><Icon name="close" size={14} /></button>
            <button type="button" className="ed-mini" disabled={i === value.length - 1} onClick={() => onChange(move(value, i, 1))} aria-label={t('ed.down')}><Icon name="chevronR" size={14} /></button>
          </div>
          {i === 0 && <span className="ed-thumb-cover mono">{t('ed.cover')}</span>}
        </div>
      ))}
      <button type="button" className="ed-thumb add" onClick={() => inputRef.current?.click()}>
        <Icon name="plus" size={26} />
        <span>{t('ed.addPhotos')}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files || []); e.target.value = ''; }} />
    </div>
  );
}
