/**
 * Turns the free-text "Thời gian" of an achievement into a sortable number.
 * Understands 12/09/2024, 09/2024, 9-2024, 2024, 2024-09, 2024-09-12, "Tháng 9 năm 2024" …
 * Returns { key, year } — key = yyyymmdd (0 when no year was found).
 */
export function parseWhen(text) {
  const s = String(text || '');
  const nums = s.match(/\d+/g) || [];
  const yi = nums.findIndex((n) => n.length === 4 && +n >= 1900 && +n <= 2100);
  if (yi < 0) return { key: 0, year: null };
  const year = +nums[yi];
  let month = 0, day = 0;
  if (yi === 0) { month = +(nums[1] || 0); day = +(nums[2] || 0); }
  else if (yi === 1) { month = +nums[0]; }
  else { day = +nums[yi - 2]; month = +nums[yi - 1]; }
  if (month > 12) { [month, day] = [day, month]; }
  month = Math.min(Math.max(month, 0), 12); day = Math.min(Math.max(day, 0), 31);
  return { key: year * 10000 + month * 100 + day, year };
}

/** Newest first (dir = 'desc') or oldest first ('asc'); items without a date go last; ties keep saved order. */
export function sortByTime(list, dir = 'desc') {
  return list
    .map((x, i) => ({ x, i, k: parseWhen(typeof x.date === 'object' ? x.date.vi || x.date.en : x.date).key }))
    .sort((a, b) => {
      if (!a.k !== !b.k) return a.k ? -1 : 1;
      if (a.k !== b.k) return dir === 'desc' ? b.k - a.k : a.k - b.k;
      return a.i - b.i;
    })
    .map((o) => o.x);
}

/** Category of an achievement ('' when none). */
export const catOf = (x) => (typeof x.category === 'object' ? x.category.vi || x.category.en : x.category || '').trim();
