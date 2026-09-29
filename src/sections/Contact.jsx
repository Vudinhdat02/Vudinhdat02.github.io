import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import OSWindow from '../components/OSWindow';
import Icon from '../components/Icons';
import SocialLinks from '../components/SocialLinks';
import { profile } from '../data/profile';
import { useSound } from '../context/SoundContext';
import { useSettings } from '../context/SettingsContext';
import './Contact.css';


const CHANNELS = ['collab', 'hire', 'general'];
const GLYPHS = 'ABCDEF0123456789#$%&@*+=<>/\\';

function cipher(text) {
  let out = '';
  for (let i = 0; i < Math.min(text.length, 220); i++) {
    const c = text.charCodeAt(i);
    out += text[i] === ' ' ? ' ' : GLYPHS[(c * 7 + i * 13) % GLYPHS.length];
  }
  return out;
}

function Field({ id, label, error, value, children }) {
  return (
    <div className={`cf-field ${error ? 'has-error' : ''} ${value ? 'filled' : ''}`}>
      {children}
      <label htmlFor={id}>{label}</label>
      <span className="cf-line" aria-hidden="true" />
      <AnimatePresence>
        {error && (
          <motion.span className="cf-error mono" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            ⚠ {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Contact() {
  const { play } = useSound();
  const { t } = useSettings();
  const STAGES = t('contact.stages');
  const [form, setForm] = useState({ name: '', email: '', message: '', channel: CHANNELS[0] });
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('idle'); // idle | sending | done | failed
  const [stage, setStage] = useState(0);
  const shakeCtl = useAnimationControls();
  const encrypted = useMemo(() => cipher(form.message), [form.message]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
    play('key');
  };

  const validate = () => {
    const er = {};
    if (form.name.trim().length < 2) er.name = 'contact.err.name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'contact.err.email';
    if (form.message.trim().length < 10) er.message = 'contact.err.message';
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) { play('error'); shakeCtl.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } }); if (navigator.vibrate) navigator.vibrate([20, 40, 20]); return; }
    setPhase('sending'); play('open');
    try {
      const request = profile.contactEndpoint
        ? fetch(profile.contactEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(form) })
            .then((r) => { if (!r.ok) throw new Error('send failed'); })
        : Promise.resolve();
      for (let i = 0; i < STAGES.length; i++) { setStage(i); play('key'); await new Promise((r) => setTimeout(r, 650)); }
      await request;
      setPhase('done'); play('success');
    } catch {
      setPhase('failed'); play('error');
    }
  };

  const mailto = `mailto:${profile.email || ''}?subject=${encodeURIComponent(`[${t(`contact.ch.${form.channel}`)}] ${t('contact.subject')} ${form.name}`)}&body=${encodeURIComponent(form.message)}`;
  const reset = () => { setForm({ name: '', email: '', message: '', channel: CHANNELS[0] }); setPhase('idle'); setStage(0); };

  return (
    <div className="contact">
      <OSWindow title={t('contact.title')} className="contact-main" enter="zoom">
        <AnimatePresence mode="wait">
          {phase === 'idle' || phase === 'sending' ? (
            <motion.form key="form" className="cf" onSubmit={submit} noValidate
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}>
              <motion.div className="cf-inner" animate={shakeCtl}>
              <div className="cf-channels" role="radiogroup" aria-label={t('contact.channel')} data-noswipe>
                <span className="label">{t('contact.channel')}</span>
                {CHANNELS.map((c) => (
                  <button type="button" key={c} role="radio" aria-checked={form.channel === c}
                    className={`chip ${form.channel === c ? 'active' : ''}`} onClick={() => { setForm((f) => ({ ...f, channel: c })); play('click'); }}>
                    {t(`contact.ch.${c}`)}
                  </button>
                ))}
              </div>
              <div className="cf-row">
                <Field id="cf-name" label={t('contact.name')} error={errors.name && t(errors.name)} value={form.name}>
                  <input id="cf-name" autoComplete="name" value={form.name} onChange={set('name')} disabled={phase === 'sending'} placeholder=" " />
                </Field>
                <Field id="cf-email" label={t('contact.email')} error={errors.email && t(errors.email)} value={form.email}>
                  <input id="cf-email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} disabled={phase === 'sending'} placeholder=" " />
                </Field>
              </div>
              <Field id="cf-msg" label={t('contact.message')} error={errors.message && t(errors.message)} value={form.message}>
                <textarea id="cf-msg" rows={5} value={form.message} onChange={set('message')} disabled={phase === 'sending'} placeholder=" " maxLength={1500} />
              </Field>
              <div className="cf-cipher mono" aria-hidden="true">
                <span className="label">{t('contact.preview')}</span>
                <p>{encrypted || t('contact.awaiting')}<span className="cf-caret" /></p>
                <span className="cf-count">{form.message.length}/1500</span>
              </div>

              {phase === 'sending' ? (
                <div className="cf-progress" aria-live="polite">
                  <div className="cf-stage mono">{STAGES[stage]}<span className="cf-ellipsis">...</span></div>
                  <div className="cf-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} transition={{ duration: 0.6 }} /></div>
                </div>
              ) : (
                <button type="submit" className="btn primary cf-submit tap" onMouseEnter={() => play('hover')}>
                  <Icon name="send" size={16} /> {t('contact.submit')}
                </button>
              )}
              </motion.div>
            </motion.form>
          ) : (
            <motion.div key="result" className={`cf-result ${phase}`} initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }}>
              <div className="cf-result-icon"><Icon name={phase === 'done' ? 'check' : 'close'} size={40} stroke={2} /></div>
              <h3 className="display">{phase === 'done' ? t('contact.delivered') : t('contact.failed')}</h3>
              <p className="dim">
                {phase === 'done'
                  ? profile.contactEndpoint ? t('contact.doneReal') : t('contact.doneDemo')
                  : t('contact.failedMsg')}
              </p>
              <div className="cf-result-actions">
                {(!profile.contactEndpoint || phase === 'failed') && <a className="btn primary tap" href={mailto}>{t('contact.openMail')}</a>}
                <button className="btn tap" onClick={reset}>{t('contact.new')}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </OSWindow>

      <OSWindow title={t('contact.direct')} className="contact-side" delay={0.15} enter="side">
        <SocialLinks />
        <div className="cc-status">
          <span className="dot-live" />
          <span className="mono">{t('contact.response')}</span>
        </div>
      </OSWindow>
    </div>
  );
}
