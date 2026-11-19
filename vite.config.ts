import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/**
 * Content Security Policy for the production build. `connect-src 'none'` makes the browser
 * refuse every fetch/XHR/WebSocket/beacon, so no tool (or dependency) can send data anywhere.
 * Build-only, because the dev server's hot reload needs a WebSocket.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Monaco and Vue style bindings inject inline styles.
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: for image previews, downloads and Monaco's bundled icon font.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

const contentSecurityPolicy = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY }, injectTo: 'head-prepend' },
  ],
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    contentSecurityPolicy(),
  ],
})
