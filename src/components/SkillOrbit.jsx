import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icons';
import skillsData from '../data/skills.json';
import { EDIT_MODE, useEditableList, newId } from '../admin/adminApi';
import { EditorModal, Field, ItemTools, TextArea, move } from '../admin/EditorKit';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './SkillOrbit.css';

const SIZE = 280, C = SIZE / 2;
const RINGS = [{ r: 118, dur: 70 }, { r: 76, dur: 48 }];

/** Split skills over two rings (outer gets the extra one). */
function layout(n) {
  const outer = Math.ceil(n / 2), inner = n - outer;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const onOuter = i % 2 === 0;
    const k = Math.floor(i / 2);
    const count = onOuter ? outer : inner;
    const ring = onOuter ? 0 : 1;
    const a = (Math.PI * 2 * k) / Math.max(count, 1) - Math.PI / 2 + (onOuter ? 0 : Math.PI / Math.max(count, 1));
    pts.push({ ring, x: C + Math.cos(a) * RINGS[ring].r, y: C + Math.sin(a) * RINGS[ring].r });
  }
  return pts;
}

/**
 * Rings are HTML layers rotated with CSS transforms (GPU-composited, no per-frame repaint).
 * Each node counter-rotates so its number stays upright.
 */
function Orbit({ items, active, setActive }) {
  const { tr } = useSettings();
  const pts = layout(items.length);
  const current = active != null ? items[active] : null;
  const pct = (v) => `${(v / SIZE) * 100}%`;
  return (
    <div className="so-orbit" onMouseLeave={() => setActive(null)} role="img" aria-label="Skill orbit">
      <svg className="so-static" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <defs>
          <radialGradient id="so-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity=".5" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>
        </defs>
        {RINGS.map((ring, ri) => <circle key={ri} cx={C} cy={C} r={ring.r} className={`so-track t${ri}`} />)}
        <circle cx={C} cy={C} r="60" fill="url(#so-core)" />
        <circle cx={C} cy={C} r="40" className="so-core" />
      </svg>
      <span className="so-core-pulse" aria-hidden="true" />
      {RINGS.map((ring, ri) => (
        <div key={ri} className={`so-ring r${ri}`} style={{ animationDuration: `${ring.dur}s` }}>
          <svg className="so-beams" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
            {pts.map((p, i) => p.ring === ri && active === i && <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} className="so-beam" />)}
          </svg>
          {pts.map((p, i) => p.ring === ri && (
            <button key={i} type="button" className={`so-node ${active === i ? 'on' : ''}`} style={{ left: pct(p.x), top: pct(p.y) }}
              onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} aria-label={tr(items[i].name)}>
              <span className={`so-node-in r${ri}`} style={{ animationDuration: `${ring.dur}s` }}>{String(i + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      ))}
      <div className="so-core-label">
        <AnimatePresence mode="wait">
          <motion.span key={current ? active : 'total'} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.08 }} transition={{ duration: 0.18 }}>
            {current ? tr(current.name) : <><b>{items.length}</b><small>SKILLS</small></>}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SkillOrbit() {
  const { t, tr } = useSettings();
  const { play } = useSound();
  const { items, commit, status } = useEditableList(skillsData, 'skills');
  const [active, setActive] = useState(null);
  const [editing, setEditing] = useState(null); // null | {index, name, desc}
  const [error, setError] = useState('');

  const openNew = () => { setError(''); setEditing({ index: -1, name: '', desc: '' }); };
  const openEdit = (i) => { setError(''); setEditing({ index: i, name: tr(items[i].name), desc: tr(items[i].desc) }); };
  const save = async () => {
    if (!editing.name.trim()) { setError(t('skills.needName')); return; }
    const entry = { ...(editing.index >= 0 ? items[editing.index] : { id: newId() }), name: editing.name.trim(), desc: editing.desc.trim() };
    const next = editing.index >= 0 ? items.map((x, i) => (i === editing.index ? entry : x)) : [...items, entry];
    if (await commit(next)) { setEditing(null); play('success'); } else play('error');
  };

  return (
    <div className="so">
      <Orbit items={items} active={active} setActive={setActive} />
      <div className="so-list-wrap">
        {!items.length && <p className="so-empty dim">{t('skills.empty')}</p>}
        <ol className="so-list">
          {items.map((s, i) => (
            <motion.li key={s.id || i}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`so-item ${active === i ? 'on' : ''}`}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active === i ? null : i)}
            >
              <span className="so-num mono">{String(i + 1).padStart(2, '0')}</span>
              <div className="so-text">
                <span className="so-name">{tr(s.name)}</span>
                {s.desc && <span className="so-desc">{tr(s.desc)}</span>}
              </div>
              {EDIT_MODE && (
                  <ItemTools compact first={i === 0} last={i === items.length - 1}
                    onUp={() => commit(move(items, i, -1))} onDown={() => commit(move(items, i, 1))}
                    onEdit={() => openEdit(i)} onDelete={() => commit(items.filter((_, j) => j !== i))} />
                )}
              <span className="so-bar" aria-hidden="true" />
            </motion.li>
          ))}
        </ol>
        {EDIT_MODE && (
          <button type="button" className="ed-add so-add" onClick={openNew}><Icon name="plus" size={16} /> {t('skills.add')}</button>
        )}
        {status.error && <div className="ed-error">{status.error}</div>}
      </div>

      {EDIT_MODE && (
        <EditorModal open={!!editing} title={editing?.index >= 0 ? t('skills.editTitle') : t('skills.addTitle')} onClose={() => setEditing(null)}
          footer={<>
            <button type="button" className="btn tap" onClick={() => setEditing(null)}>{t('ed.cancel')}</button>
            <button type="button" className="btn primary tap" onClick={save} disabled={status.busy}>{status.busy ? t('ed.saving') : t('ed.save')}</button>
          </>}>
          {editing && <>
            <Field label={t('skills.name')}>
              <input autoFocus value={editing.name} placeholder={t('skills.namePh')} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') save(); }} />
            </Field>
            <Field label={t('skills.desc')} hint={t('ed.multiline')}>
              <TextArea value={editing.desc} placeholder={t('skills.descPh')} onChange={(desc) => setEditing({ ...editing, desc })} onSubmit={save} />
            </Field>
            {error && <div className="ed-error">{error}</div>}
          </>}
        </EditorModal>
      )}
    </div>
  );
}
