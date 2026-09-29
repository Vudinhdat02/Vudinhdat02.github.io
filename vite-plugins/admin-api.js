/**
 * Local "save" API — only active during `npm run dev` (never in the built site).
 *
 * Lets the in-page editors write straight into the project:
 *   POST /__admin/save    { file: 'achievements' | 'skills' | 'intro' | 'blog' | 'projects', data }  → src/data/<file>.json
 *   POST /__admin/upload  { name, dataUrl, folder? }                  → public/uploads/<file>, returns { url }
 *   POST /__admin/cv      { dataUrl }                                  → public/cv.pdf
 *   POST /__admin/remove-upload { url }                                → deletes a file in public/uploads/
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA_FILES = new Set(['achievements', 'skills', 'intro', 'blog', 'projects']);
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 25 * 1024 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES * 1.4) { reject(new Error('File quá lớn (tối đa 25MB)')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('Dữ liệu gửi lên không hợp lệ')); }
    });
    req.on('error', reject);
  });
}

function decodeDataUrl(dataUrl) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('File không hợp lệ');
  return { mime: m[1], buf: Buffer.from(m[2], 'base64') };
}

const slug = (s) =>
  String(s || 'file').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';

export default function adminApi() {
  let root = process.cwd();
  return {
    name: 'portfolio-admin-api',
    apply: 'serve',
    configResolved(cfg) { root = cfg.root; },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/__admin/')) return next();
        const send = (code, obj) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
        if (req.method !== 'POST') return send(405, { error: 'POST only' });
        try {
          const body = await readBody(req);
          const route = req.url.split('?')[0];

          if (route === '/__admin/save') {
            if (!DATA_FILES.has(body.file) || !Array.isArray(body.data)) throw new Error('Tên file không hợp lệ');
            const target = path.join(root, 'src', 'data', `${body.file}.json`);
            fs.writeFileSync(target, JSON.stringify(body.data, null, 2) + '\n', 'utf8');
            return send(200, { ok: true });
          }

          if (route === '/__admin/upload') {
            const { mime, buf } = decodeDataUrl(body.dataUrl);
            const ext = IMAGE_TYPES[mime];
            if (!ext) throw new Error('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF');
            if (buf.length > MAX_BYTES) throw new Error('Ảnh quá lớn (tối đa 25MB)');
            const dir = path.join(root, 'public', 'uploads');
            fs.mkdirSync(dir, { recursive: true });
            const file = `${slug(body.name)}-${Date.now().toString(36)}.${ext}`;
            fs.writeFileSync(path.join(dir, file), buf);
            return send(200, { ok: true, url: `/uploads/${file}` });
          }

          if (route === '/__admin/cv') {
            const { mime, buf } = decodeDataUrl(body.dataUrl);
            if (mime !== 'application/pdf' || buf.subarray(0, 1024).indexOf('%PDF') < 0) throw new Error('Chỉ nhận file PDF');
            fs.writeFileSync(path.join(root, 'public', 'cv.pdf'), buf);
            return send(200, { ok: true, url: '/cv.pdf' });
          }

          if (route === '/__admin/remove-upload') {
            const url = String(body.url || '');
            if (!/^\/uploads\/[\w.-]+$/.test(url)) return send(200, { ok: true, skipped: true });
            const file = path.join(root, 'public', url);
            if (fs.existsSync(file)) fs.unlinkSync(file);
            return send(200, { ok: true });
          }

          return send(404, { error: 'Unknown route' });
        } catch (e) {
          return send(400, { error: e.message || String(e) });
        }
      });
    },
  };
}
