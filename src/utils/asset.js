/**
 * Paths like '/uploads/x.jpg' or '/cv.pdf' point at files in public/.
 * On GitHub Pages the site may live under a sub-folder (https://user.github.io/repo/),
 * so we prefix the site's base path. Full links (https://…, data:, blob:) are left untouched.
 *
 * `previews`: files you just uploaded from the live website are not online until GitHub
 * finishes rebuilding (1–2 min), so meanwhile we show the copy that is already in your browser.
 */
const BASE = import.meta.env.BASE_URL || '/';
export const previews = new Map();
export const asset = (url) => {
  if (typeof url !== 'string') return url;
  if (previews.has(url)) return previews.get(url);
  return url.startsWith('/') && !url.startsWith('//') ? BASE + url.slice(1) : url;
};
