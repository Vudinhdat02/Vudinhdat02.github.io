import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icons';
import { EditorModal, Field } from './EditorKit';
import { GH_MODE, signIn, signOut } from './adminApi';
import { GITHUB } from '../data/site';
import { useSettings } from '../context/SettingsContext';
import './AdminPanel.css';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
const ACTIONS_URL = `https://github.com/${GITHUB.owner}/${GITHUB.repo}/actions`;
const isAdminHash = () => window.location.hash === '#admin';

/**
 * Owner sign-in for the live website. Open it by adding  #admin  to the address.
 * Nothing here is secret: the check is done by GitHub (the token must be yours and able to write to the repo).
 */
function SignIn({ open, onClose }) {
  const { t } = useSettings();
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await signIn(token, remember);
      setToken('');
      window.location.replace(window.location.pathname + '#dashboard');
      window.location.reload();
    } catch (e) {
      setError(t(`adm.err.${e.message}`) === `adm.err.${e.message}` ? e.message : t(`adm.err.${e.message}`));
      setBusy(false);
    }
  };
  return (
    <EditorModal open={open} title={t('adm.title')} onClose={onClose}
      footer={<>
        <button type="button" className="btn tap" onClick={onClose}>{t('ed.cancel')}</button>
        <button type="button" className="btn primary tap" onClick={submit} disabled={busy || !token.trim()}>{busy ? t('adm.checking') : t('adm.signIn')}</button>
      </>}>
      <p className="adm-intro">{t('adm.intro')}</p>
      <Field label={t('adm.token')} hint={<>{t('adm.tokenHint')} <a href={TOKEN_URL} target="_blank" rel="noreferrer">{t('adm.createToken')}</a></>}>
        <input type="password" autoComplete="off" spellCheck={false} value={token} placeholder="github_pat_…"
          onChange={(e) => setToken(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      </Field>
      <label className="ed-check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span><b>{t('adm.remember')}</b><small>{t('adm.rememberHint')}</small></span>
      </label>
      {error && <div className="ed-error">{error}</div>}
    </EditorModal>
  );
}

/** Watches GitHub Actions after each save and tells you when the public site is updated. */
function useDeployStatus() {
  const [state, setState] = useState('idle'); // idle | saving | building | done | failed
  const since = useRef(0);
  const timer = useRef(null);
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/actions/runs?per_page=1&branch=${GITHUB.branch}`, { cache: 'no-store' });
        const run = (await r.json()).workflow_runs?.[0];
        if (run && Date.parse(run.created_at) >= since.current - 15000) {
          if (run.status !== 'completed') setState('building');
          else { setState(run.conclusion === 'success' ? 'done' : 'failed'); return; }
        }
      } catch { /* offline — try again */ }
      if (Date.now() - since.current < 8 * 60 * 1000) timer.current = setTimeout(poll, 12000);
    };
    const onSaved = () => {
      since.current = Date.now();
      setState('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(poll, 8000);
    };
    window.addEventListener('admin:saved', onSaved);
    return () => { window.removeEventListener('admin:saved', onSaved); clearTimeout(timer.current); };
  }, []);
  return state;
}

function AdminBar() {
  const { t } = useSettings();
  const state = useDeployStatus();
  return createPortal(
    <div className={`adm-bar ${state}`} role="status">
      <span className="adm-dot" aria-hidden="true" />
      <span className="adm-text">
        <b>{t('adm.bar')}</b>
        <small>{t(`adm.st.${state}`)}</small>
      </span>
      {state === 'done' && <button type="button" className="ed-mini" onClick={() => window.location.reload()}>{t('adm.reload')}</button>}
      <a className="ed-mini" href={ACTIONS_URL} target="_blank" rel="noreferrer" title={t('adm.progress')}><Icon name="external" size={13} /></a>
      <button type="button" className="ed-mini" onClick={() => { signOut(); window.location.reload(); }}>{t('adm.signOut')}</button>
    </div>,
    document.body
  );
}

export default function AdminPanel() {
  const [open, setOpen] = useState(isAdminHash);
  useEffect(() => {
    const onHash = () => { if (isAdminHash()) setOpen(true); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const close = () => { setOpen(false); if (isAdminHash()) history.replaceState(null, '', '#dashboard'); };
  if (import.meta.env.DEV) return null; // on your computer everything is already editable
  return <>
    {GH_MODE && <AdminBar />}
    {!GH_MODE && <SignIn open={open} onClose={close} />}
  </>;
}
