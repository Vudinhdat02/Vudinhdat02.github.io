import { forwardRef, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import OSWindow from '../components/OSWindow';
import Icon from '../components/Icons';
import Lightbox from '../components/Lightbox';
import projectsData from '../data/projects.json';
import { PROJECT_CATEGORIES } from '../data/projects';
import { EDIT_MODE, useEditableList, uploadImage, removeUpload, newId } from '../admin/adminApi';
import { EditorModal, Field, ItemTools, MultiImagePicker, TextArea, move } from '../admin/EditorKit';
import { asset } from '../utils/asset';
import { useTilt } from '../hooks/useTilt';
import { useSound } from '../context/SoundContext';
import { useSettings } from '../context/SettingsContext';
import { Cover, Photo, useCatLabel } from '../components/ProjectArt';
import './Projects.css';

const ProjectCard = forwardRef(function ProjectCard({ p, index, onZoom, tools }, ref) {
  const tilt = useTilt({ max: p.featured ? 5 : 9 });
  const { play } = useSound();
  const { t, tr } = useSettings();
  const cat = useCatLabel();
  const imgs = p.images || [];
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`pc-wrap ${p.featured ? 'featured' : ''}`}
    >
      <div
        ref={tilt.ref}
        className={`pc ${p.featured ? 'pc-featured' : ''}`}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
        onPointerDown={tilt.onPointerDown}
        onPointerUp={tilt.onPointerUp}
        onPointerCancel={tilt.onPointerCancel}
        onMouseEnter={() => play('hover')}
        data-hover
      >
        <div className={`pc-media ${imgs.length ? 'has-photo' : ''}`}>
          {imgs.length
            ? <button type="button" className="pc-media-btn" onClick={() => onZoom(0)} aria-label={t('ach.zoom')}><Photo src={imgs[0]} alt={p.title} /></button>
            : <Cover hue={p.hue ?? 200} seed={index + 1} category={p.category} />}
          {p.featured && <span className="pc-badge mono">{t('proj.featured')}</span>}
          {p.year && <span className="pc-year mono">{p.year}</span>}
          {imgs.length > 1 && <span className="pc-count mono"><Icon name="image" size={13} /> {imgs.length}</span>}
        </div>
        <div className="pc-body">
          <span className="pc-cat mono">{cat(p.category)}</span>
          <h3 className="pc-title display">{p.title}</h3>
          <p className="pc-desc">{tr(p.desc)}</p>
          {p.tags?.length > 0 && <ul className="pc-tags">{p.tags.map((tag) => <li key={tag} className="mono">{tag}</li>)}</ul>}
          <div className="pc-links">
            {p.demo && <a href={p.demo} target="_blank" rel="noreferrer" className="btn tap" onClick={() => play('click')}><Icon name="external" size={14} /> {t('proj.launch')}</a>}
            {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" className="btn tap" onClick={() => play('click')}><Icon name="github" size={14} /> {t('proj.github')}</a>}
          </div>
          {tools}
        </div>
        <span className="pc-glare" aria-hidden="true" />
        <span className="pc-scan" aria-hidden="true" />
      </div>
    </motion.article>
  );
});

const EMPTY = { index: -1, title: '', category: 'MOBILE', year: String(new Date().getFullYear()), vi: '', en: '', tags: '', repo: '', demo: '', images: [], featured: false, pinned: false };
const isUrl = (u) => !u || /^https?:\/\/\S+$/i.test(u);

export default function Projects() {
  const [filter, setFilter] = useState('ALL');
  const { play } = useSound();
  const { t, tr } = useSettings();
  const cat = useCatLabel();
  const { items, commit, status } = useEditableList(projectsData, 'projects');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(null); // { p, index }

  const cats = useMemo(() => {
    const seen = [...new Set(items.map((p) => p.category).filter(Boolean))];
    return [...PROJECT_CATEGORIES.filter((c) => seen.includes(c)), ...seen.filter((c) => !PROJECT_CATEGORIES.includes(c))];
  }, [items]);
  const list = items.map((p, i) => ({ p, i })).filter(({ p }) => filter === 'ALL' || p.category === filter);

  const openNew = () => { setError(''); setForm({ ...EMPTY, category: filter !== 'ALL' ? filter : 'MOBILE' }); };
  const openEdit = (i) => {
    const p = items[i]; setError('');
    const d = p.desc || '';
    setForm({
      index: i, title: p.title || '', category: p.category || '', year: String(p.year || ''),
      vi: typeof d === 'string' ? d : d.vi || '', en: typeof d === 'string' ? '' : d.en || '',
      tags: (p.tags || []).join(', '), repo: p.repo || '', demo: p.demo || '',
      images: (p.images || []).map((url) => ({ url })), featured: !!p.featured, pinned: !!p.pinned,
    });
  };

  const save = async () => {
    if (saving) return;
    if (!form.title.trim()) { setError(t('pe.needTitle')); return; }
    if (!isUrl(form.repo.trim()) || !isUrl(form.demo.trim())) { setError(t('pe.badUrl')); return; }
    setSaving(true); setError('');
    try {
      const images = [];
      for (const im of form.images) images.push(im.file ? await uploadImage(im.file, form.title) : im.url);
      const prev = form.index >= 0 ? items[form.index] : null;
      const vi = form.vi.trim(), en = form.en.trim();
      const entry = {
        id: prev?.id || newId(),
        title: form.title.trim(),
        category: form.category.trim().toUpperCase() || 'WEB',
        year: /^\d{4}$/.test(form.year.trim()) ? Number(form.year.trim()) : form.year.trim(),
        hue: prev?.hue ?? Math.floor(Math.random() * 360),
        featured: form.featured, pinned: form.pinned,
        desc: en ? { vi: vi || en, en } : vi,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        repo: form.repo.trim(), demo: form.demo.trim(), images,
      };
      const next = prev ? items.map((x, i) => (i === form.index ? entry : x)) : [...items, entry];
      if (!(await commit(next))) throw new Error(status.error || 'Save failed');
      (prev?.images || []).filter((u) => !images.includes(u)).forEach(removeUpload);
      setForm(null); play('success');
    } catch (e) {
      setError(e.message); play('error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (i) => {
    const gone = items[i];
    if (await commit(items.filter((_, j) => j !== i))) (gone.images || []).forEach(removeUpload);
  };
  const toggle = (i, key) => { commit(items.map((x, j) => (j === i ? { ...x, [key]: !x[key] } : x))); play('click'); };

  const nav = useCallback((d) => setZoom((z) => (z ? { ...z, index: (z.index + d + z.p.images.length) % z.p.images.length } : z)), []);
  const zoomItems = zoom ? zoom.p.images.map((src, k) => ({ src, title: zoom.p.title, sub: `${k + 1}/${zoom.p.images.length}` })) : [];

  return (
    <OSWindow title={t('proj.title')} enter="zoom">
      <div className="pa-filters" role="toolbar" aria-label={t('proj.filter')} data-noswipe>
        {['ALL', ...cats].map((f) => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} aria-pressed={filter === f}
            onClick={() => { setFilter(f); play('click'); }} onMouseEnter={() => play('hover')}>
            {f === 'ALL' ? t('pcat.ALL') : cat(f)}
            <span className="pa-count">{f === 'ALL' ? items.length : items.filter((p) => p.category === f).length}</span>
          </button>
        ))}
      </div>

      {EDIT_MODE && (
        <div className="pa-admin">
          <button type="button" className="ed-add" onClick={openNew}><Icon name="plus" size={18} /> {t('pe.add')}</button>
          {status.error && <div className="ed-error">{status.error}</div>}
        </div>
      )}

      <motion.div layout className="pa-grid">
        <AnimatePresence mode="popLayout">
          {list.map(({ p, i }, k) => (
            <ProjectCard key={p.id} p={p} index={k}
              onZoom={(n) => { setZoom({ p, index: n }); play('open'); }}
              tools={EDIT_MODE && (
                <ItemTools compact first={i === 0} last={i === items.length - 1}
                  onUp={() => commit(move(items, i, -1))} onDown={() => commit(move(items, i, 1))}
                  onEdit={() => openEdit(i)} onDelete={() => remove(i)}>
                  <button type="button" className={`ed-mini ${p.pinned ? 'star-on' : ''}`} aria-pressed={!!p.pinned} onClick={() => toggle(i, 'pinned')} title={t('pe.pinned')}>
                    <Icon name="dashboard" size={14} />
                  </button>
                  <button type="button" className={`ed-mini ${p.featured ? 'star-on' : ''}`} aria-pressed={!!p.featured} onClick={() => toggle(i, 'featured')} title={t('pe.featured')}>
                    <Icon name="star" size={14} />
                  </button>
                </ItemTools>
              )} />
          ))}
        </AnimatePresence>
      </motion.div>

      <Lightbox items={zoomItems} index={zoom ? zoom.index : null} onClose={() => setZoom(null)} onNav={nav} />

      {EDIT_MODE && (
        <EditorModal open={!!form} title={form?.index >= 0 ? t('pe.editTitle') : t('pe.addTitle')} onClose={() => !saving && setForm(null)}
          footer={<>
            <button type="button" className="btn tap" onClick={() => setForm(null)} disabled={saving}>{t('ed.cancel')}</button>
            <button type="button" className="btn primary tap" onClick={save} disabled={saving}>{saving ? t('ed.saving') : t('ed.save')}</button>
          </>}>
          {form && <>
            <Field label={t('pe.photos')} hint={t('pe.photosHint')}>
              <MultiImagePicker value={form.images} onChange={(images) => setForm({ ...form, images })} />
            </Field>
            <div className="ed-row2">
              <Field label={t('pe.name')}>
                <input value={form.title} placeholder="VD: Smart Home App" onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label={t('pe.year')}>
                <input value={form.year} inputMode="numeric" onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
            </div>
            <Field label={t('pe.cat')} hint={t('pe.catHint')}>
              <input list="pe-cat-list" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="pe-cat-list">{[...new Set([...PROJECT_CATEGORIES, ...cats])].map((c) => <option key={c} value={c}>{cat(c)}</option>)}</datalist>
            </Field>
            <Field label={t('pe.descVi')} hint={t('ed.multiline')}>
              <TextArea value={form.vi} rows={4} onChange={(vi) => setForm({ ...form, vi })} onSubmit={save} />
            </Field>
            <Field label={t('pe.descEn')} hint={t('pe.descEnHint')}>
              <TextArea value={form.en} rows={3} onChange={(en) => setForm({ ...form, en })} onSubmit={save} />
            </Field>
            <Field label={t('pe.tags')} hint={t('pe.tagsHint')}>
              <input value={form.tags} placeholder="Kotlin, Firebase, ESP32" onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
            <div className="ed-row2">
              <Field label={t('pe.repo')}>
                <input value={form.repo} placeholder="https://github.com/…" onChange={(e) => setForm({ ...form, repo: e.target.value })} />
              </Field>
              <Field label={t('pe.demo')}>
                <input value={form.demo} placeholder="https://…" onChange={(e) => setForm({ ...form, demo: e.target.value })} />
              </Field>
            </div>
            <label className="ed-check">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              <span><b>{t('pe.pinned')}</b><small>{t('pe.pinnedHint')}</small></span>
            </label>
            <label className="ed-check">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              <span><b>★ {t('pe.featured')}</b><small>{t('pe.featuredHint')}</small></span>
            </label>
            {error && <div className="ed-error">{error}</div>}
          </>}
        </EditorModal>
      )}
    </OSWindow>
  );
}
