import Icon from './Icons';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './SettingsToggles.css';

/** EN/VI language switch + dark/light theme switch. */
export function LangToggle({ className = '' }) {
  const { lang, toggleLang, t } = useSettings();
  const { play } = useSound();
  return (
    <button className={`st-lang tap ${className}`} onClick={() => { toggleLang(); play('click'); }} aria-label={t('hud.lang')} title={t('hud.lang')}>
      <span className={lang === 'en' ? 'on' : ''}>EN</span>
      <i aria-hidden="true" />
      <span className={lang === 'vi' ? 'on' : ''}>VI</span>
    </button>
  );
}

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, t } = useSettings();
  const { play } = useSound();
  const label = theme === 'dark' ? t('hud.toLight') : t('hud.toDark');
  return (
    <button className={`st-theme tap ${className}`} onClick={() => { toggleTheme(); play('click'); }} aria-label={label} title={label}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
    </button>
  );
}
