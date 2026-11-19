// Runs user regexes off the main thread so a catastrophic-backtracking pattern
// can be killed (worker.terminate) instead of freezing the whole tab.

export interface RegexRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement: string | null;
}

export interface RegexGroup {
  /** Group number (1-based) or name. */
  name: string;
  value: string | undefined;
  start?: number;
  end?: number;
}

export interface RegexMatch {
  start: number;
  end: number;
  value: string;
  groups: RegexGroup[];
}

export type RegexResponse =
  | { id: number; ok: true; matches: RegexMatch[]; truncated: boolean; replaced: string | null; ms: number }
  | { id: number; ok: false; error: string };

export const MAX_MATCHES = 5000;

self.onmessage = (e: MessageEvent<RegexRequest>) => {
  const { id, pattern, flags, text, replacement } = e.data;
  const started = performance.now();
  try {
    // "d" gives group start/end indices; it doesn't change what matches.
    const re = new RegExp(pattern, flags.includes('d') ? flags : `${flags}d`);
    const global = flags.includes('g');

    // Map group numbers to their names, if any (indices.groups only maps name → range).
    const groupNames: Record<number, string> = {};
    let n = 0;
    // Count capturing groups: "(" not followed by "?" (or followed by "?<name>"), skipping escapes and classes.
    for (let i = 0, inClass = false; i < pattern.length; i++) {
      const c = pattern[i];
      if (c === '\\') { i++; continue; }
      if (inClass) { if (c === ']') inClass = false; continue; }
      if (c === '[') { inClass = true; continue; }
      if (c !== '(') continue;
      if (pattern[i + 1] !== '?') { n++; continue; }
      const named = /^\?<([A-Za-z_$][\w$]*)>/.exec(pattern.slice(i + 1));
      if (named) groupNames[++n] = named[1];
    }

    const matches: RegexMatch[] = [];
    let truncated = false;
    const iterator = global ? text.matchAll(re) : [re.exec(text)].filter((m): m is RegExpExecArray => m !== null);
    for (const m of iterator) {
      if (matches.length >= MAX_MATCHES) {
        truncated = true;
        break;
      }
      const indices = (m as RegExpMatchArray & { indices?: [number, number][] }).indices;
      matches.push({
        start: m.index!,
        end: m.index! + m[0].length,
        value: m[0],
        groups: m.slice(1).map((value, i) => ({
          name: groupNames[i + 1] ?? String(i + 1),
          value,
          start: indices?.[i + 1]?.[0],
          end: indices?.[i + 1]?.[1],
        })),
      });
    }

    const replaced = replacement === null ? null : text.replace(new RegExp(pattern, flags), replacement);
    self.postMessage({ id, ok: true, matches, truncated, replaced, ms: performance.now() - started } satisfies RegexResponse);
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err as Error).message } satisfies RegexResponse);
  }
};
