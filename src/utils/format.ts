const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

/**
 * Pretty-print a value as JSON with syntax-colour spans.
 * The JSON is HTML-escaped *before* spans are added, so the result is safe for v-html.
 */
export function highlightJson(value: unknown) {
  const json = escapeHtml(JSON.stringify(value, null, 2) ?? 'undefined');
  return json.replace(
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str: string | undefined, colon: string | undefined, literal: string | undefined) => {
      if (str) {
        return colon
          ? `<span class="text-accent">${str}</span>${colon}`
          : `<span class="text-success">${str}</span>`;
      }
      if (literal) return `<span class="text-highlight">${match}</span>`;
      return `<span class="text-warning">${match}</span>`;
    },
  );
}

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

/** "in 3 hours", "2 days ago", "now". */
export function relativeTime(targetMs: number, nowMs = Date.now()) {
  const diffSeconds = (targetMs - nowMs) / 1000;
  const abs = Math.abs(diffSeconds);
  for (const [unit, seconds] of UNITS) {
    if (abs >= seconds || unit === 'second') return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
  }
  return '';
}

export const formatLocalDate = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
  });
