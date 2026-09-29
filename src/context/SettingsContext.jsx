import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

/**
 * Language (EN / VI) + colour theme (dark / light).
 * Both are remembered in localStorage and applied to <html lang> / <html data-theme>.
 */
const SettingsContext = createContext(null);

const read = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* storage blocked — ignore */ }
};

const defaultLang = () => (navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en';

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const l = read('nexus.lang', defaultLang());
    document.documentElement.lang = l;
    return l;
  });
  const [theme, setTheme] = useState(() => {
    const th = read('nexus.theme2', 'light'); // default = light; visitors can switch to dark
    document.documentElement.dataset.theme = th;
    return th;
  });

  useEffect(() => { document.documentElement.lang = lang; write('nexus.lang', lang); }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F4F7FB' : '#0B0F19');
    write('nexus.theme2', theme);
  }, [theme]);

  /** UI string lookup: t('nav.projects'), t('proj.records', { a: 1, b: 8 }) */
  const t = useCallback((key, vars) => {
    let s = translations[lang]?.[key] ?? translations.en[key] ?? key;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
    return s;
  }, [lang]);

  /** Data lookup: a value can be a plain string or { en: '...', vi: '...' } */
  const tr = useCallback(function tr(v) {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return v;
    if (Array.isArray(v)) return v.map(tr);
    return v[lang] ?? v.en ?? '';
  }, [lang]);

  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB';
  const fmtDate = useCallback((iso, style = 'short') =>
    new Date(iso + 'T00:00:00').toLocaleDateString(locale, {
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      month: { month: 'short', year: 'numeric' },
      short: { day: '2-digit', month: 'short', year: 'numeric' },
    }[style]).toUpperCase(), [locale]);

  const value = useMemo(() => ({
    lang, setLang, toggleLang: () => setLang((l) => (l === 'en' ? 'vi' : 'en')),
    theme, setTheme, toggleTheme: () => setTheme((th) => (th === 'dark' ? 'light' : 'dark')),
    t, tr, locale, fmtDate,
  }), [lang, theme, t, tr, locale, fmtDate]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
