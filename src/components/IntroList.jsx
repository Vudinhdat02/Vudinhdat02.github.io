import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icons';
import introData from '../data/intro.json';
import { EDIT_MODE, useEditableList, newId } from '../admin/adminApi';
import { EditorModal, Field, ItemTools, TextArea, move } from '../admin/EditorKit';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './IntroList.css';

/**
 * "Giới thiệu" entries under the bio: [năng lực] — [mô tả].
 * Add / edit on the page while running `npm run dev`; saved into src/data/intro.json.
 */
export default function IntroList() {
  const { t, tr } = useSettings();
  const { play } = useSound();
  const { items, commit, status } = useEditableList(introData, 'intro');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const openNew = () => { setError(''); setEditing({ index: -1, name: '', desc: '' }); };
  const openEdit = (i) => { setError(''); setEditing({ index: i, name: tr(items[i].name), desc: tr(items[i].desc || '') }); };
  const save = async () => {
    if (!editing.name.trim()) { setError(t('intro.needName')); return; }
    const entry = { ...(editing.index >= 0 ? items[editing.index] : { id: newId() }), name: editing.name.trim(), desc: editing.desc.trim() };
    const next = editing.index >= 0 ? items.map((x, i) => (i === editing.index ? entry : x)) : [...items, entry];
    if (await commit(next)) { setEditing(null); play('success'); } else play('error');
  };

  if (!items.length && !EDIT_MODE) return null;

  return (
    <div className="intro">
      {items.length > 0 && (
        <dl className="intro-list">
          {items.map((x, i) => (
            <motion.div key={x.id || i} className="intro-item"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}>
              <dt><span className="intro-dot" aria-hidden="true" />{tr(x.name)}</dt>
              {x.desc && <dd>{tr(x.desc)}</dd>}
              {EDIT_MODE && (
                <ItemTools compact first={i === 0} last={i === items.length - 1}
                  onUp={() => commit(move(items, i, -1))} onDown={() => commit(move(items, i, 1))}
                  onEdit={() => openEdit(i)} onDelete={() => commit(items.filter((_, j) => j !== i))} />
              )}
            </motion.div>
          ))}
        </dl>
      )}
      {EDIT_MODE && <button type="button" className="ed-add intro-add" onClick={openNew}><Icon name="plus" size={16} /> {t('intro.add')}</button>}
      {status.error && <div className="ed-error">{status.error}</div>}

      {EDIT_MODE && (
        <EditorModal open={!!editing} title={editing?.index >= 0 ? t('intro.editTitle') : t('intro.addTitle')} onClose={() => setEditing(null)}
          footer={<>
            <button type="button" className="btn tap" onClick={() => setEditing(null)}>{t('ed.cancel')}</button>
            <button type="button" className="btn primary tap" onClick={save} disabled={status.busy}>{status.busy ? t('ed.saving') : t('ed.save')}</button>
          </>}>
          {editing && <>
            <Field label={t('intro.name')}>
              <input autoFocus value={editing.name} placeholder={t('intro.namePh')} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) save(); }} />
            </Field>
            <Field label={t('intro.desc')} hint={t('ed.multiline')}>
              <TextArea value={editing.desc} placeholder={t('intro.descPh')} onChange={(desc) => setEditing({ ...editing, desc })} onSubmit={save} />
            </Field>
            {error && <div className="ed-error">{error}</div>}
          </>}
        </EditorModal>
      )}
    </div>
  );
}
