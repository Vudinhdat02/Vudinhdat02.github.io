import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { asset } from '../utils/asset';
import Icon from '../components/Icons';
import Reveal from '../components/fx/Reveal';
import Lightbox from '../components/Lightbox';
import Coverflow from '../components/Coverflow';
import ScrambleText from '../components/fx/ScrambleText';
import { useTilt } from '../hooks/useTilt';
import achievementsData from '../data/achievements.json';
import { EDIT_MODE, useEditableList, uploadImage, removeUpload, newId } from '../admin/adminApi';
import { EditorModal, Field, ImagePicker, ItemTools, TextArea } from '../admin/EditorKit';
import { sortByTime, catOf, parseWhen } from './achUtils';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './Achievements.css';

/**
 * Achievements / certificates showcase.
 * Rows alternate: odd rows → text left, image right; even rows → image left, text right.
 * Default order = time (newest first). Visitors can filter by category and flip the order.
 * While running `npm run dev` you can add / edit / reorder / delete entries on the page;
 * they are saved into src/data/achievements.json and images into public/uploads/.
 */

function Frame({ item, onZoom }) {
  const tilt = useTilt({ max: 6, scale: 1.015 });
  const { t, tr } = useSettings();
  return (
    <button
      ref={tilt.ref}
      type="button"
      className="ar-frame"
      onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}
      onPointerDown={tilt.onPointerDown} onPointerUp={tilt.onPointerUp} onPointerCancel={tilt.onPointerCancel}
      onClick={onZoom}
      aria-label={`${tr(item.title)} — ${t('ach.zoom')}`}
      data-hover
    >
      {item.image ? <img src={asset(item.image)} alt={tr(item.title)} loading="lazy" /> : <span className="ar-noimg"><Icon name="image" size={40} /></span>}
      <span className="ar-glare" aria-hidden="true" />
      <span className="ar-scan" aria-hidden="true" />
      <span className="ar-zoom mono"><Icon name="zoom" size={14} /> {t('ach.zoom')}</span>
      <i className="ar-c tl" /><i className="ar-c tr" /><i className="ar-c bl" /><i className="ar-c br" />
    </button>
  );
}

/** Card for the "Grid" view: photo keeps its real shape, the card tilts and glows under the pointer. */
function GridCard({ item, index, onZoom, tools }) {
  const tilt = useTilt({ max: 7, scale: 1.02 });
  const { t, tr } = useSettings();
  return (
    <motion.li className="ag-item"
      initial={{ opacity: 0, y: 40, rotateX: -12 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}>
      <div ref={tilt.ref} className={`ag-card ${item.featured ? 'gold' : ''}`}
        onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave}
        onPointerDown={tilt.onPointerDown} onPointerUp={tilt.onPointerUp} onPointerCancel={tilt.onPointerCancel}>
        <button type="button" className="ag-photo" onClick={onZoom} aria-label={`${tr(item.title)} — ${t('ach.zoom')}`}>
          {item.image ? <img src={asset(item.image)} alt={tr(item.title)} loading="lazy" /> : <span className="ar-noimg"><Icon name="image" size={36} /></span>}
          <span className="ag-zoom mono"><Icon name="zoom" size={14} /></span>
        </button>
        <div className="ag-body">
          <span className="ar-meta">
            {item.date && <span className="ar-date mono"><Icon name="flag" size={13} /> {tr(item.date)}</span>}
            {catOf(item) && <span className="ar-cat mono">{tr(item.category)}</span>}
            {item.featured && <span className="ar-star mono"><Icon name="star" size={12} /></span>}
          </span>
          <h3 className="ag-title display">{tr(item.title)}</h3>
          {item.desc && <p className="ag-desc">{tr(item.desc)}</p>}
          {tools}
        </div>
        <span className="ag-glare" aria-hidden="true" />
      </div>
    </motion.li>
  );
}

const VIEW_KEY = 'nexus.achView';
const readView = () => { try { return localStorage.getItem(VIEW_KEY) || 'timeline'; } catch { return 'timeline'; } };
const VIEW_MODES = [
  { id: 'timeline', icon: 'flag' },
  { id: 'grid', icon: 'dashboard' },
  { id: 'gallery', icon: 'image' },
];

function Row({ item, index, total, onZoom, tools }) {
  const { tr } = useSettings();
  const imageFirst = index % 2 === 1; // row 1: image right, row 2: image left, …
  return (
    <li className={`ar-row ${imageFirst ? 'img-left' : 'img-right'}`}>
      <span className="ar-node" aria-hidden="true"><span /></span>
      <Reveal className="ar-info" effect={imageFirst ? 'right' : 'left'} amount={0.25}>
        <span className="ar-index display">{String(index + 1).padStart(2, '0')}<small>/{String(total).padStart(2, '0')}</small></span>
        <span className="ar-meta">
          {item.date && <span className="ar-date mono"><Icon name="flag" size={13} /> {tr(item.date)}</span>}
          {catOf(item) && <span className="ar-cat mono">{tr(item.category)}</span>}
          {item.featured && <span className="ar-star mono" title="★"><Icon name="star" size={12} /></span>}
        </span>
        <h3 className="ar-title display">{tr(item.title)}</h3>
        {item.desc && <p className="ar-desc">{tr(item.desc)}</p>}
        {tools}
      </Reveal>
      <Reveal className="ar-media" effect={imageFirst ? 'wipe' : 'wipeLeft'} delay={0.1} duration={0.9} amount={0.25}>
        <Frame item={item} onZoom={onZoom} />
      </Reveal>
    </li>
  );
}

const EMPTY = { index: -1, title: '', date: '', category: '', featured: false, desc: '', image: '', file: null };
const SUGGESTED = { vi: ['Chứng chỉ', 'Giải thưởng', 'Cuộc thi', 'Học tập', 'Hoạt động'], en: ['Certificate', 'Award', 'Competition', 'Academic', 'Activity'] };

export default function Achievements() {
  const { t, tr, lang } = useSettings();
  const { play } = useSound();
  const { items, commit, status } = useEditableList(achievementsData, 'achievements');
  const [zoom, setZoom] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cat, setCat] = useState('');          // '' = all categories
  const [order, setOrder] = useState('desc');  // desc = newest first
  const [view, setViewState] = useState(readView); // timeline | grid | gallery (remembered on this device)
  const setView = (v) => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };

  // categories with counts, in first-seen order
  const cats = useMemo(() => {
    const m = new Map();
    items.forEach((x) => { const c = catOf(x); if (c) m.set(c, { label: x.category, n: (m.get(c)?.n || 0) + 1 }); });
    return [...m.entries()].map(([key, v]) => ({ key, ...v }));
  }, [items]);
  useEffect(() => { if (cat && !cats.some((c) => c.key === cat)) setCat(''); }, [cats, cat]);

  // what is shown: filtered + sorted; `_i` = index in the saved list
  const shown = useMemo(
    () => sortByTime(items.map((x, i) => ({ ...x, _i: i })).filter((x) => !cat || catOf(x) === cat), order),
    [items, cat, order]
  );

  const withImages = shown.filter((x) => x.image);
  const openZoom = (i) => { const k = withImages.findIndex((x) => x._i === i); if (k >= 0) { setZoom(k); play('open'); } };
  const nav = useCallback((d) => setZoom((z) => (z == null ? z : (z + d + withImages.length) % withImages.length)), [withImages.length]);

  const openNew = () => { setError(''); setForm({ ...EMPTY, category: cat ? cats.find((c) => c.key === cat)?.key || '' : '' }); };
  const openEdit = (i) => {
    const x = items[i]; setError('');
    setForm({ index: i, title: tr(x.title), date: tr(x.date || ''), category: tr(x.category || ''), featured: !!x.featured, desc: tr(x.desc || ''), image: x.image || '', file: null });
  };
  const toggleFeatured = (i) => { commit(items.map((x, j) => (j === i ? { ...x, featured: !x.featured } : x))); play('click'); };

  const save = async () => {
    if (saving) return;
    if (!form.title.trim()) { setError(t('ach.needTitle')); return; }
    if (!form.file && !form.image) { setError(t('ach.needImage')); return; }
    setSaving(true); setError('');
    try {
      const image = form.file ? await uploadImage(form.file, form.title) : form.image;
      const prev = form.index >= 0 ? items[form.index] : null;
      const entry = {
        id: prev?.id || newId(), title: form.title.trim(), date: form.date.trim(), category: form.category.trim(),
        featured: !!form.featured, desc: form.desc.trim(), image,
      };
      const next = prev ? items.map((x, i) => (i === form.index ? entry : x)) : [...items, entry];
      const ok = await commit(next);
      if (!ok) throw new Error(status.error || 'Save failed');
      if (prev && prev.image && prev.image !== image) removeUpload(prev.image);
      setForm(null); play('success');
    } catch (e) {
      setError(e.message); play('error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (i) => {
    const gone = items[i];
    if (await commit(items.filter((_, j) => j !== i)) && gone.image) removeUpload(gone.image);
  };

  const suggestions = [...new Set([...cats.map((c) => c.key), ...SUGGESTED[lang === 'vi' ? 'vi' : 'en']])];
  const dateHint = form?.date && !parseWhen(form.date).year ? t('ach.dateWarn') : t('ach.fDateHint');

  const toolsFor = (item) => EDIT_MODE && (
    <ItemTools onEdit={() => openEdit(item._i)} onDelete={() => remove(item._i)}>
      <button type="button" className={`ed-mini ${item.featured ? 'star-on' : ''}`} onClick={() => toggleFeatured(item._i)}
        title={t('ach.fFeatured')} aria-pressed={!!item.featured}>
        <Icon name="star" size={14} /> {item.featured ? t('ach.featuredOn') : t('ach.featuredOff')}
      </button>
    </ItemTools>
  );

  // timeline: rows + a year marker whenever the year changes
  let lastYear;
  const rows = [];
  shown.forEach((item, k) => {
    const y = parseWhen(tr(item.date || '')).year;
    if (y !== lastYear) {
      rows.push(<li key={`y-${y ?? 'none'}-${k}`} className="ar-year"><span className="display">{y ?? t('ach.noDate')}</span></li>);
      lastYear = y;
    }
    rows.push(<Row key={item.id || item._i} item={item} index={k} total={shown.length} onZoom={() => openZoom(item._i)} tools={toolsFor(item)} />);
  });

  return (
    <div className="ach">
      <header className="ach-hero">
        <Reveal effect="up">
          <span className="label ach-kicker"><span className="ach-kicker-led" /> {t('ach.count', { n: items.length })}</span>
          <h1 className="ach-title display"><ScrambleText text={t('ach.title1')} duration={900} /></h1>
          <p className="ach-sub dim">{t('ach.sub')}</p>
        </Reveal>
      </header>

      {EDIT_MODE && (
        <div className="ach-admin">
          <p className="ed-note"><Icon name="edit" size={16} /> <span>{t('ed.devNote')}</span></p>
          <button type="button" className="ed-add" onClick={openNew}><Icon name="plus" size={18} /> {t('ach.add')}</button>
          {status.error && <div className="ed-error">{status.error}</div>}
        </div>
      )}

      {items.length > 0 && (
        <div className="ach-bar" data-noswipe>
          <div className="ach-cats" role="radiogroup" aria-label={t('ach.filterAria')}>
            <button type="button" role="radio" aria-checked={!cat} className={`chip ${!cat ? 'active' : ''}`} onClick={() => { setCat(''); play('click'); }}>
              {t('ach.all')} <span className="ach-n">{items.length}</span>
            </button>
            {cats.map((c) => (
              <button type="button" key={c.key} role="radio" aria-checked={cat === c.key} className={`chip ${cat === c.key ? 'active' : ''}`}
                onClick={() => { setCat(c.key); play('click'); }}>
                {tr(c.label)} <span className="ach-n">{c.n}</span>
              </button>
            ))}
          </div>
          <div className="ach-right">
            <div className="ach-views" role="radiogroup" aria-label={t('ach.viewAria')}>
              {VIEW_MODES.map((m) => (
                <button type="button" key={m.id} role="radio" aria-checked={view === m.id} className={`ach-view ${view === m.id ? 'on' : ''}`}
                  onClick={() => { setView(m.id); play('click'); }} title={t(`ach.v.${m.id}`)}>
                  <Icon name={m.icon} size={15} /> <span>{t(`ach.v.${m.id}`)}</span>
                </button>
              ))}
            </div>
            <button type="button" className="chip ach-order" onClick={() => { setOrder(order === 'desc' ? 'asc' : 'desc'); play('click'); }}
              title={t('ach.sortAria')}>
              <Icon name={order === 'desc' ? 'arrowDown' : 'arrowUp'} size={14} /> {order === 'desc' ? t('ach.newest') : t('ach.oldest')}
            </button>
          </div>
        </div>
      )}

      {!items.length ? (
        <Reveal className="ar-empty" effect="zoom">
          <span className="ar-empty-icon"><Icon name="trophy" size={44} /></span>
          <p className="display">{t('ach.empty')}</p>
          {EDIT_MODE && <p className="dim">{t('ach.emptyEdit')}</p>}
        </Reveal>
      ) : (
        view === 'grid' ? (
          <ul className="ag-grid" key={`g|${cat}|${order}`}>
            {shown.map((item, k) => <GridCard key={item.id || item._i} item={item} index={k} onZoom={() => openZoom(item._i)} tools={toolsFor(item)} />)}
          </ul>
        ) : view === 'gallery' ? (
          <div className="ach-gallery" key={`c|${cat}|${order}`}>
            <Coverflow autoplay={0}
              items={shown.map((a) => ({ key: a.id || String(a._i), image: a.image, title: a.title, date: a.date, category: catOf(a) ? a.category : '', desc: a.desc, star: !!a.featured }))}
              onOpen={(k) => openZoom(shown[k]._i)} />
          </div>
        ) : (
          <ol className="ar-list" key={`${cat}|${order}`}>{rows}</ol>
        )
      )}

      <Lightbox items={withImages.map((x) => ({ src: x.image, title: tr(x.title), sub: tr(x.date || '') }))} index={zoom} onClose={() => setZoom(null)} onNav={nav} />

      {EDIT_MODE && (
        <EditorModal open={!!form} title={form?.index >= 0 ? t('ach.editTitle') : t('ach.addTitle')} onClose={() => !saving && setForm(null)}
          footer={<>
            <button type="button" className="btn tap" onClick={() => setForm(null)} disabled={saving}>{t('ed.cancel')}</button>
            <button type="button" className="btn primary tap" onClick={save} disabled={saving}>{saving ? t('ed.saving') : t('ed.save')}</button>
          </>}>
          {form && <>
            <Field label={t('ach.fImage')}>
              <ImagePicker value={form.image} file={form.file} onFile={(file) => setForm({ ...form, file })} />
            </Field>
            <Field label={t('ach.fTitle')}>
              <input value={form.title} placeholder={t('ach.fTitlePh')} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="ed-row2">
              <Field label={t('ach.fDate')} hint={dateHint}>
                <input value={form.date} placeholder={t('ach.fDatePh')} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label={t('ach.fCat')} hint={t('ach.fCatHint')}>
                <input list="ach-cat-list" value={form.category} placeholder={t('ach.fCatPh')} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <datalist id="ach-cat-list">{suggestions.map((c) => <option key={c} value={c} />)}</datalist>
              </Field>
            </div>
            <Field label={t('ach.fDesc')} hint={t('ed.multiline')}>
              <TextArea value={form.desc} placeholder={t('ach.fDescPh')} rows={4} onChange={(desc) => setForm({ ...form, desc })} onSubmit={save} />
            </Field>
            <label className="ed-check">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              <span><b>★ {t('ach.fFeatured')}</b><small>{t('ach.fFeaturedHint')}</small></span>
            </label>
            {error && <div className="ed-error">{error}</div>}
          </>}
        </EditorModal>
      )}
    </div>
  );
}
