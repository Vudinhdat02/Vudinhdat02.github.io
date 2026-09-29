import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import adminApi from './vite-plugins/admin-api.js';

// Security rules for the published site (not used by `npm run dev`):
// the page may only run its own code, and may only talk to GitHub's API (for the #admin editor).
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' blob: data: https://api.github.com https://formspree.io",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
].join('; ');
const securityHeaders = {
  name: 'security-meta',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<head>', `<head>
    <meta http-equiv="Content-Security-Policy" content="${CSP}" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
};

export default defineConfig({
  // GitHub Pages: set automatically by .github/workflows/deploy.yml ('/' for user.github.io, '/<repo>/' otherwise)
  base: process.env.BASE_PATH || '/',
  plugins: [
    // Dev only: hold Shift + Alt (Mac: Option + Shift) and hover an element to see its file:line,
    // click to open that exact line in VS Code. Or use the floating toggle button.
    // Not included in `npm run build`.
    codeInspectorPlugin({ bundler: 'vite', editor: 'code', showSwitch: true }),
    react(),
    // Dev only: lets the "+ Add" editors on the page save achievements, skills, images and the CV into this project.
    adminApi(),
    securityHeaders,
  ],
  // Auto-open the browser for `npm run dev`; F5 in VS Code opens its own browser window instead.
  server: { open: !process.env.VSCODE_LAUNCH, port: 5173 }, // if 5173 is busy, Vite uses 5174, 5175…
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion', 'gsap'],
        },
      },
    },
  },
});
