import Icon from './Icons';
import { profile } from '../data/profile';
import { useSettings } from '../context/SettingsContext';
import { useSound } from '../context/SoundContext';
import './SocialLinks.css';

/** Link for a social entry: uses `url`; if it's missing and the handle is an email, builds a mailto: link. */
export const socialHref = (s) => s.url || (s.handle && s.handle.indexOf('@') > 0 ? `mailto:${s.handle}` : '#');

/**
 * Social / contact rows: [icon + platform]  ………  [channel name ↗]
 * Data lives in `socials` in src/data/profile.js.
 */
export default function SocialLinks({ className = '' }) {
  const { tr } = useSettings();
  const { play } = useSound();
  return (
    <ul className={`sl ${className}`}>
      {profile.socials.map((s, i) => {
        const href = socialHref(s);
        const ext = href.startsWith('http');
        return (
          <li key={i}>
            <a href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noreferrer' : undefined}
              className={`sl-item touch-scale sl-${s.icon || 'link'}`} onMouseEnter={() => play('hover')}>
              <span className="sl-icon"><Icon name={s.icon || 'external'} size={18} /></span>
              <span className="sl-platform">{tr(s.label)}</span>
              <span className="sl-handle">{s.handle}</span>
              <Icon name="external" size={14} className="sl-go" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
