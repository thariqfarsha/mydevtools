import type { Component } from 'vue';

export type ToolCategory = 'Formatters' | 'Encoders & Decoders' | 'Generators' | 'Text';

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

export const categories: ToolCategory[] = ['Formatters', 'Encoders & Decoders', 'Generators', 'Text'];

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
    path: '/sql',
    label: 'SQL Formatter',
    description: 'Format or minify SQL queries (PostgreSQL dialect).',
    category: 'Formatters',
    keywords: 'query postgres minify',
    icon: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    component: () => import('./views/SqlFormatter.vue'),
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
    path: '/random-string',
    label: 'Random String',
    description: 'Generate cryptographically secure random strings in bulk.',
    category: 'Generators',
    keywords: 'token password id guid uuid key secret',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/>',
    component: () => import('./views/RandomString.vue'),
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
