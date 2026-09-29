import { asset } from '../utils/asset';
import OSWindow from '../components/OSWindow';
import SkillOrbit from '../components/SkillOrbit';
import Icon from '../components/Icons';
import { profile } from '../data/profile';
import projectsData from '../data/projects.json';
import SocialLinks from '../components/SocialLinks';
import IntroList from '../components/IntroList';
import Blog from '../blog/Blog';
import achievementsData from '../data/achievements.json';
import { sortByTime, catOf } from '../achievements/achUtils';
import { EDIT_MODE, useData } from '../admin/adminApi';
import FeaturedProjects from './FeaturedProjects';
import Coverflow from '../components/Coverflow';
import { useSound } from '../context/SoundContext';
import { useSettings } from '../context/SettingsContext';
import './Dashboard.css';


function Avatar({ initials, photo, alt }) {
  return (
    <div className={`dos-avatar ${photo ? 'has-photo' : ''}`}>
      {photo && <img className="dos-photo" src={asset(photo)} alt={alt} />}
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="74" className="dos-ring r1" />
        <circle cx="80" cy="80" r="64" className="dos-ring r2" />
        {!photo && <path className="dos-bust" d="M80 34a22 22 0 110 44 22 22 0 010-44zM38 132c4-24 22-38 42-38s38 14 42 38" />}
        {!photo && <text x="80" y="152" textAnchor="middle" className="dos-initials">{initials}</text>}
      </svg>
      <span className="dos-scan" aria-hidden="true" />
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { play } = useSound();
  const { t, tr } = useSettings();
  const initials = profile.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  // signed in on the live site → newest data from the repo; otherwise the data built into the site
  const projectList = useData(projectsData, 'projects');
  const achList = useData(achievementsData, 'achievements');

  // "Dự án tiêu biểu" = projects ticked "Hiện ở trang Tổng quan" (falls back to the flagship ones)
  const pinned = projectList.filter((p) => p.pinned);
  const showcase = pinned.length ? pinned : [...projectList].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 3);

  // "Thành tích tiêu biểu" = achievements marked ★; topped up with the newest ones so the carousel is never tiny
  const stars = sortByTime(achList.filter((a) => a.featured));
  const reel = (stars.length >= 3 ? stars : [...stars, ...sortByTime(achList.filter((a) => !a.featured)).slice(0, 5 - stars.length)])
    .map((a, i) => ({ key: a.id || String(i), image: a.image, title: a.title, date: a.date, category: catOf(a) ? a.category : '', desc: a.desc, star: !!a.featured }));

  return (
    <div className="dash-page">
      <div className="dash">
        <div className="dash-col">
          <OSWindow title={t('dash.profileTitle')} className="dash-dossier" enter="unfold">
            <div className="dos-top">
              <Avatar initials={initials} photo={profile.avatar} alt={profile.name} />
              <div className="dos-id">
                <span className="label">{t('dash.operative')}</span>
                <h1 className="dos-name display glitch" data-text={profile.name}>{profile.name}</h1>
                <p className="dos-role">{tr(profile.role)}</p>
                <div className="dos-status mono"><span className="dot-live" /> {tr(profile.status)}</div>
              </div>
              <div className="dos-stamp display" aria-hidden="true">{t('dash.classified')}</div>
            </div>

            <dl className="dos-fields">
              <div><dt className="label">{t('dash.codename')}</dt><dd className="mono">{profile.codename}</dd></div>
              <div><dt className="label">{t('dash.base')}</dt><dd className="mono">{tr(profile.location)}</dd></div>
            </dl>

            <div className="dos-bio">
              <span className="label">{t('dash.brief')}</span>
              <p>{tr(profile.bio)}</p>
              <IntroList />
            </div>

            <div className="dos-stats">
              {profile.stats.map((s) => (
                <div key={s.value} className="dos-stat">
                  <span className="display dos-stat-v">{s.value}</span>
                  <span className="label">{tr(s.label)}</span>
                </div>
              ))}
            </div>
          </OSWindow>
        </div>

        <div className="dash-col">
          <OSWindow title={t('dash.skills')} className="dash-skills" delay={0.12} enter="side">
            <SkillOrbit />
          </OSWindow>
          <OSWindow title={t('dash.links')} className="dash-links" delay={0.22} enter="rise">
            <SocialLinks />
          </OSWindow>
        </div>
      </div>

      <OSWindow title={t('dash.ops')} className="dash-projects" delay={0.3} enter="rise">
        <FeaturedProjects projects={showcase} onNavigate={onNavigate} />
        {EDIT_MODE && <p className="hl-empty dim"><Icon name="dashboard" size={16} /> {t('dash.opsHint')}</p>}
        <button className="dash-more touch-scale" onClick={() => { play('open'); onNavigate('projects'); }} onMouseEnter={() => play('hover')}>
          <Icon name="projects" size={20} />
          <span><b className="display">{t('dash.projCount', { n: projectList.length })}</b> · {t('dash.viewAll')}</span>
          <Icon name="chevronR" size={16} />
        </button>
      </OSWindow>

      <OSWindow title={t('dash.highlights')} className="dash-ach" delay={0.3} enter="rise">
        {reel.length > 0 && <Coverflow items={reel} onOpen={() => onNavigate('achievements')} />}
        {EDIT_MODE && stars.length < 3 && <p className="hl-empty dim"><Icon name="star" size={16} /> {t('dash.hlEmpty')}</p>}
        <button className="dash-more gold touch-scale" onClick={() => { play('open'); onNavigate('achievements'); }} onMouseEnter={() => play('hover')}>
          <Icon name="trophy" size={20} />
          <span><b className="display">{t('dash.achCount', { n: achList.length })}</b> · {t('dash.viewAll')}</span>
          <Icon name="chevronR" size={16} />
        </button>
      </OSWindow>

      <Blog />
    </div>
  );
}
