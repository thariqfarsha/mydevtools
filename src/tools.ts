import type { Component } from 'vue';

export interface ToolDef {
  path: string;
  label: string;
  /** Inner SVG markup (paths) rendered inside a 24×24 stroke icon. */
  icon: string;
  /** Lazy-loaded so each tool's code is only fetched when it is opened. */
  component: () => Promise<Component>;
}

// Single source of truth for the router and the sidebar. Add new tools here.
export const tools: ToolDef[] = [
  {
    path: '/json',
    label: 'JSON Formatter',
    icon: '<path d="M8 4H7a2 2 0 00-2 2v3a2 2 0 01-2 2 2 2 0 012 2v3a2 2 0 002 2h1m8-16h1a2 2 0 012 2v3a2 2 0 002 2 2 2 0 00-2 2v3a2 2 0 01-2 2h-1" />',
    component: () => import('./views/JsonFormatter.vue'),
  },
  {
    path: '/json-escape',
    label: 'JSON Escape',
    icon: '<path d="M8 4H6a2 2 0 00-2 2v4l-2 2 2 2v4a2 2 0 002 2h2m8-16h2a2 2 0 012 2v4l2 2-2 2v4a2 2 0 01-2 2h-2M10 9l4 6" />',
    component: () => import('./views/JsonEscape.vue'),
  },
  {
    path: '/html',
    label: 'HTML Formatter',
    icon: '<path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />',
    component: () => import('./views/HtmlFormatter.vue'),
  },
  {
    path: '/sql',
    label: 'SQL Formatter',
    icon: '<ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />',
    component: () => import('./views/SqlFormatter.vue'),
  },
  {
    path: '/diff',
    label: 'Diff Checker',
    icon: '<path d="M8 7h8m0 0l-4-4m4 4l-4 4m0 6H8m0 0l4 4m-4-4l4-4" />',
    component: () => import('./views/DiffChecker.vue'),
  },
  {
    path: '/base64-image',
    label: 'Base64 to PNG/JPG',
    icon: '<path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM8 9h8M8 13h5" />',
    component: () => import('./views/Base64Image.vue'),
  },
  {
    path: '/random-string',
    label: 'Random String',
    icon: '<rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.2" /><circle cx="16" cy="8" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="8" cy="16" r="1.2" /><circle cx="16" cy="16" r="1.2" />',
    component: () => import('./views/RandomString.vue'),
  },
];
