/**
 * Saving edits — two ways, same buttons on the page:
 *
 *  1. On your computer (`npm run dev`): files are written straight into the project
 *     (see vite-plugins/admin-api.js).
 *  2. On the live website (GitHub Pages): open  https://<your site>/#admin  and sign in with a
 *     GitHub access token. Each save becomes a commit in your repo through the GitHub API,
 *     and GitHub rebuilds the site in 1–2 minutes.
 *
 * Visitors never see any editing tool. Even if someone opened the sign-in box, GitHub only
 * accepts a token that has write access to YOUR repo — the website itself stores no password.
 */
import { useCallback, useEffect, useState } from 'react';
import { GITHUB } from '../data/site';
import { previews } from '../utils/asset';

const DEV = import.meta.env.DEV;
const TOKEN_KEY = 'vdd.gh.token';
const API = 'https://api.github.com';

/* ---------- sign-in state ---------- */

const store = {
  get() { try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
  set(token, remember) {
    try {
      sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY);
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
    } catch { /* storage blocked */ }
  },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

/** true on the live site after the owner signed in */
export const GH_MODE = !DEV && !!store.get();
/** show the editing tools (on your computer, or on the live site when signed in) */
export const EDIT_MODE = DEV || GH_MODE;

const ghHeaders = (token, json) => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  Authorization: `Bearer ${token}`,
  ...(json ? { 'Content-Type': 'application/json' } : {}),
});

/** Check a token: it must belong to the repo owner and be able to write to the repo. */
export async function signIn(token, remember) {
  token = String(token || '').trim();
  if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(token)) throw new Error('bad-format');
  const [u, r] = await Promise.all([
    fetch(`${API}/user`, { headers: ghHeaders(token) }),
    fetch(`${API}/repos/${GITHUB.owner}/${GITHUB.repo}`, { headers: ghHeaders(token) }),
  ]);
  if (u.status === 401 || r.status === 401) throw new Error('bad-token');
  if (!r.ok) throw new Error('no-repo');
  const user = await u.json(); const repo = await r.json();
  if (String(user.login).toLowerCase() !== GITHUB.owner.toLowerCase()) throw new Error('not-owner');
  if (repo.permissions && !repo.permissions.push) throw new Error('no-write');
  store.set(token, remember);
  return user.login;
}

export function signOut() { store.clear(); }

/* ---------- GitHub contents API ---------- */

const repoUrl = (path) => `${API}/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;

async function gh(path, init = {}) {
  const res = await fetch(path, { ...init, headers: ghHeaders(store.get(), !!init.body), cache: 'no-store' });
  if (res.status === 401) throw new Error('Mã truy cập GitHub đã hết hạn hoặc bị thu hồi — hãy đăng nhập lại (#admin).');
  if (res.status === 403) throw new Error('Mã truy cập không có quyền ghi. Tạo mã mới với quyền "Contents: Read and write".');
  return res;
}

async function getFile(path) {
  const res = await gh(`${repoUrl(path)}?ref=${GITHUB.branch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub: ${res.status}`);
  return res.json();
}

// all writes go one after another, so two quick saves never clash
let queue = Promise.resolve();
const serial = (fn) => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run; };

function putFile(path, base64, message) {
  return serial(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const cur = await getFile(path);
      const res = await gh(repoUrl(path), {
        method: 'PUT',
        body: JSON.stringify({ message, content: base64, branch: GITHUB.branch, ...(cur ? { sha: cur.sha } : {}) }),
      });
      if (res.ok) { window.dispatchEvent(new CustomEvent('admin:saved')); return res.json(); }
      if (res.status !== 409 && res.status !== 422) throw new Error(`GitHub: ${res.status}`);
    }
    throw new Error('GitHub đang bận, hãy thử lưu lại.');
  });
}

function deleteFile(path, message) {
  return serial(async () => {
    const cur = await getFile(path);
    if (!cur) return;
    await gh(repoUrl(path), { method: 'DELETE', body: JSON.stringify({ message, sha: cur.sha, branch: GITHUB.branch }) });
    window.dispatchEvent(new CustomEvent('admin:saved'));
  });
}

const utf8ToB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64ToUtf8 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

/** Latest version of a data file straight from the repo (so edits show before the rebuild). */
export async function loadData(file) {
  if (!GH_MODE) return null;
  const f = await getFile(`src/data/${file}.json`);
  return f?.content ? JSON.parse(b64ToUtf8(f.content)) : null;
}

/* ---------- local dev API ---------- */

async function post(route, body) {
  const res = await fetch(`/__admin/${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

/* ---------- what the editors call ---------- */

export const saveData = (file, data) => (GH_MODE
  ? putFile(`src/data/${file}.json`, utf8ToB64(JSON.stringify(data, null, 2) + '\n'), `Cập nhật ${file} từ website`)
  : post('save', { file, data }));

export const removeUpload = (url) => (GH_MODE
  ? deleteFile(`public${url}`, `Xóa ảnh ${url.split('/').pop()}`).catch(() => {})
  : post('remove-upload', { url }).catch(() => {}));

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('Không đọc được file'));
  r.readAsDataURL(blob);
});

/** Shrinks big photos (phone pictures are often 5–10 MB) to max 1800px before saving. */
async function compressImage(file, max = 1800, quality = 0.86) {
  if (file.type === 'image/gif') return readAsDataUrl(file);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('File ảnh không hợp lệ'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const keepAlpha = file.type === 'image/png' && file.size < 1.5e6;
    if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const slug = (s) =>
  String(s || 'file').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export async function uploadImage(file, name) {
  if (!file.type.startsWith('image/')) throw new Error('Hãy chọn một file ảnh (JPG, PNG, WEBP)');
  const dataUrl = await compressImage(file);
  if (!GH_MODE) return (await post('upload', { name, dataUrl })).url;
  const [head, b64] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] || 'image/jpeg';
  const url = `/uploads/${slug(name)}-${Date.now().toString(36)}.${EXT[mime] || 'jpg'}`;
  await putFile(`public${url}`, b64, `Thêm ảnh ${url.split('/').pop()}`);
  previews.set(url, dataUrl); // visible right away, before GitHub rebuilds
  return url;
}

/** Returns a URL you can show immediately. */
export async function uploadCv(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Hãy chọn file PDF');
  const dataUrl = await readAsDataUrl(new Blob([file], { type: 'application/pdf' }));
  if (!GH_MODE) { await post('cv', { dataUrl }); return null; }
  await putFile('public/cv.pdf', dataUrl.split(',')[1], 'Thay CV từ website');
  const blobUrl = URL.createObjectURL(file);
  previews.set('/cv.pdf', blobUrl);
  return blobUrl;
}

/* ---------- hooks ---------- */

/** A list stored in src/data/<file>.json that the page can edit and save. */
export function useEditableList(initial, file) {
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState({ busy: false, error: '' });
  // signed in on the live site → start from the newest version in the repo
  useEffect(() => {
    if (!GH_MODE) return;
    let alive = true;
    loadData(file).then((d) => { if (alive && Array.isArray(d)) setItems(d); }).catch(() => {});
    return () => { alive = false; };
  }, [file]);
  const commit = useCallback(async (next) => {
    const prev = items;
    setItems(next);
    setStatus({ busy: true, error: '' });
    try {
      await saveData(file, next);
      setStatus({ busy: false, error: '' });
      return true;
    } catch (e) {
      setItems(prev);
      setStatus({ busy: false, error: e.message });
      return false;
    }
  }, [items, file]);
  return { items, commit, status };
}

/** Read-only view of a data file; on the live site while signed in it shows the newest version. */
export function useData(initial, file) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    if (!GH_MODE) return;
    let alive = true;
    loadData(file).then((d) => { if (alive && d) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, [file]);
  return data;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
