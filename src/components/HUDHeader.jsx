import { motion } from 'framer-motion';
import Icon from './Icons';
import { LangToggle, ThemeToggle } from './SettingsToggles';
import { useSound } from '../context/SoundContext';
import { useSettings } from '../context/SettingsContext';
import './HUDHeader.css';

export const VIEWS = [
  { id: 'dashboard', icon: 'dashboard' },
  { id: 'projects', icon: 'projects' },
  { id: 'achievements', icon: 'achievements' },
  { id: 'contact', icon: 'contact' },
  { id: 'cv', icon: 'file' },
];

export default function HUDHeader({ view, onNavigate }) {
  const { play } = useSound();
  const { t } = useSettings();

  return (
    <>
      <header className="hud">
        <div className="hud-brand">
          <span className="hud-logo" aria-hidden="true"><i /><i /><i /></span>
          <span className="display hud-name glitch" data-text="VŨ ĐÌNH ĐẠT">VU DINH DAT</span>
        </div>

        <nav className="hud-nav" aria-label="Primary">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className={`hud-tab ${view === v.id ? 'active' : ''}`}
              onClick={() => { play('click'); onNavigate(v.id); }}
              onMouseEnter={() => play('hover')}
              aria-current={view === v.id ? 'page' : undefined}
              title={t(`nav.${v.id}`)}
            >
              <Icon name={v.icon} size={15} />
              <span>{t(`nav.${v.id}`)}</span>
              {view === v.id && <motion.span layoutId="hud-tab-glow" className="hud-tab-glow" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            </button>
          ))}
        </nav>

        <div className="hud-status">
          <div className="hud-controls">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="mnav" aria-label="Primary mobile">
        {VIEWS.map((v) => (
          <button key={v.id} className={`mnav-btn ${view === v.id ? 'active' : ''}`} onClick={() => { play('click'); onNavigate(v.id); }} aria-current={view === v.id ? 'page' : undefined}>
            <Icon name={v.icon} size={20} />
            <span>{t(`navShort.${v.id}`)}</span>
            {view === v.id && <motion.span layoutId="mnav-glow" className="mnav-glow" />}
          </button>
        ))}
      </nav>
    </>
  );
}
