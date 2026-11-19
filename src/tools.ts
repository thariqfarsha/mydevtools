import type { Component } from 'vue';

export type ToolCategory = 'Formatters' | 'Encoders & Decoders' | 'Crypto' | 'Generators' | 'Converters' | 'Text';

export interface ToolDef {
  path: string;
  label: string;
  description: string;
  category: ToolCategory;
  /** Extra search terms for the sidebar search. */
  keywords?: string;
  /** Inner SVG markup for a 24×24 stroke icon. */
  icon: string;
  /** Lazy-loaded so each tool's code is only fetched when it is opened. */
  component: () => Promise<Component>;
}

export const categories: ToolCategory[] = ['Formatters', 'Encoders & Decoders', 'Crypto', 'Generators', 'Converters', 'Text'];

// Single source of truth for the router, sidebar and tool headers. Add new tools here.
export const tools: ToolDef[] = [
  {
    path: '/json',
    label: 'JSON Formatter',
    description: 'Beautify or minify JSON and validate its syntax.',
    category: 'Formatters',
    keywords: 'prettify pretty minify validate',
    icon: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>',
    component: () => import('./views/JsonFormatter.vue'),
  },
  {
    path: '/html',
    label: 'HTML Formatter',
    description: 'Beautify or minify HTML markup.',
    category: 'Formatters',
    keywords: 'prettify minify markup',
    icon: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    component: () => import('./views/HtmlFormatter.vue'),
  },
  {
    path: '/xml',
    label: 'XML Formatter',
    description: 'Beautify, minify and validate XML.',
    category: 'Formatters',
    keywords: 'prettify minify validate svg rss soap',
    icon: '<path d="M4 4h16v16H4z"/><path d="m8 9 3 3-3 3M13 15h3"/>',
    component: () => import('./views/XmlFormatter.vue'),
  },
  {
    path: '/css',
    label: 'CSS Formatter',
    description: 'Beautify or minify CSS stylesheets.',
    category: 'Formatters',
    keywords: 'prettify minify stylesheet scss',
    icon: '<path d="M4 3h16l-1.5 16L12 21l-6.5-2z"/><path d="M8 8h8l-.5 6-3.5 1-3.5-1"/>',
    component: () => import('./views/CssFormatter.vue'),
  },
  {
    path: '/js',
    label: 'JavaScript Formatter',
    description: 'Beautify JavaScript, or minify it with Terser.',
    category: 'Formatters',
    keywords: 'js prettify minify uglify terser compress',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 9v6a2 2 0 0 1-2 2M17 9.5a2 2 0 0 0-2-.5c-1 .3-1.3 1.5-.5 2l1 .6c.8.5.5 1.9-.5 2.1a2 2 0 0 1-2-.7"/>',
    component: () => import('./views/JsFormatter.vue'),
  },
  {
    path: '/sql',
    label: 'SQL Formatter',
    description: 'Format or minify SQL queries (PostgreSQL dialect).',
    category: 'Formatters',
    keywords: 'query postgres minify',
    icon: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    component: () => import('./views/SqlFormatter.vue'),
  },
  {
    path: '/encode',
    label: 'Encode / Decode',
    description: 'Base64, URL and HTML entity encoding for text (UTF-8 safe).',
    category: 'Encoders & Decoders',
    keywords: 'base64 btoa atob url percent uri component html entities escape',
    icon: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    component: () => import('./views/TextCodec.vue'),
  },
  {
    path: '/json-escape',
    label: 'JSON Escape',
    description: 'Escape text into a JSON string, or unescape it back.',
    category: 'Encoders & Decoders',
    keywords: 'unescape string quote backslash',
    icon: '<path d="M6 6v4M10 6v4M13 6l6 12"/>',
    component: () => import('./views/JsonEscape.vue'),
  },
  {
    path: '/base64-image',
    label: 'Base64 to Image',
    description: 'Decode a base64 string and save it as PNG or JPG.',
    category: 'Encoders & Decoders',
    keywords: 'png jpg jpeg data url decode picture',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    component: () => import('./views/Base64Image.vue'),
  },
  {
    path: '/jwt',
    label: 'JWT Decoder',
    description: 'Decode a JSON Web Token, check its claims and verify the signature.',
    category: 'Crypto',
    keywords: 'jwt jws token bearer oauth claims verify signature hs256 rs256',
    icon: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
    component: () => import('./views/JwtDecoder.vue'),
  },
  {
    path: '/hash',
    label: 'Hash Generator',
    description: 'MD5, SHA-1 and SHA-2 digests and HMACs of text or files.',
    category: 'Crypto',
    keywords: 'md5 sha1 sha256 sha512 hmac checksum digest file',
    icon: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    component: () => import('./views/HashGenerator.vue'),
  },
  {
    path: '/random-string',
    label: 'Random String',
    description: 'Generate cryptographically secure random strings in bulk.',
    category: 'Generators',
    keywords: 'token password id guid uuid key secret',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
    component: () => import('./views/RandomString.vue'),
  },
  {
    path: '/uuid',
    label: 'UUID / ULID',
    description: 'Generate UUID v4, time-ordered UUID v7 or ULID identifiers in bulk.',
    category: 'Generators',
    keywords: 'uuid guid ulid v4 v7 id identifier',
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 9v6M12 9v6h1.5a3 3 0 0 0 0-6H12z"/>',
    component: () => import('./views/UuidGenerator.vue'),
  },
  {
    path: '/timestamp',
    label: 'Timestamp Converter',
    description: 'Convert Unix timestamps to dates and back, in local time or UTC.',
    category: 'Converters',
    keywords: 'unix epoch time date iso 8601 utc timezone',
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    component: () => import('./views/TimestampConverter.vue'),
  },
  {
    path: '/convert',
    label: 'JSON ↔ YAML / CSV',
    description: 'Convert data between JSON, YAML and CSV.',
    category: 'Converters',
    keywords: 'yaml yml csv json convert spreadsheet excel table data',
    icon: '<path d="M7 4 3 8l4 4M3 8h13M17 12l4 4-4 4M21 16H8"/>',
    component: () => import('./views/DataConverter.vue'),
  },
  {
    path: '/cron',
    label: 'Cron Explainer',
    description: 'Explain a cron expression in plain English and list its next run times.',
    category: 'Converters',
    keywords: 'cron crontab schedule job quartz next run',
    icon: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M12 13v3l2 1"/>',
    component: () => import('./views/CronExplainer.vue'),
  },
  {
    path: '/regex',
    label: 'Regex Tester',
    description: 'Test JavaScript regular expressions with live highlighting, groups and replace.',
    category: 'Text',
    keywords: 'regex regexp regular expression match pattern replace capture group',
    icon: '<path d="M17 3v10M12.7 5.5l8.6 5M12.7 10.5l8.6-5"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    component: () => import('./views/RegexTester.vue'),
  },
  {
    path: '/diff',
    label: 'Diff Checker',
    description: 'Compare two texts side by side and highlight the changes.',
    category: 'Text',
    keywords: 'compare difference',
    icon: '<path d="M12 3v12M6 9h12M6 21h12"/>',
    component: () => import('./views/DiffChecker.vue'),
  },
];
