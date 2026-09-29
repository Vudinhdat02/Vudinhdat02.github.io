import { profile } from '../data/profile';
import { useSettings } from '../context/SettingsContext';
import './SiteFooter.css';

/** Copyright line at the bottom of every page. Text: 'foot.*' keys in src/i18n/translations.js */
export default function SiteFooter() {
  const { t } = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="site-foot">
      <span className="site-foot-line" aria-hidden="true" />
      <p className="site-foot-copy">© {year} {t('foot.name')}. {t('foot.rights')}</p>
      <p className="site-foot-meta mono">
        <span>{t('foot.built')}</span>
        <span className="sep" aria-hidden="true">◆</span>
        <span>{t('foot.place')}</span>
        {profile.email && <><span className="sep" aria-hidden="true">◆</span><a href={`mailto:${profile.email}`}>{profile.email}</a></>}
      </p>
    </footer>
  );
}
