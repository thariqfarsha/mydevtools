<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import Icon from '../components/Icon.vue';
import { copyText, readClipboard } from '../composables/useToast';
import RegexWorker from '../workers/regex.worker?worker';
import type { RegexMatch, RegexRequest, RegexResponse } from '../workers/regex.worker';

const TIMEOUT_MS = 1500;
const MAX_MATCHES = 5000; // keep in sync with the worker
const MAX_HIGHLIGHTS = 2000; // more <mark>s than this makes typing sluggish

const FLAGS: { flag: string; label: string; title: string }[] = [
  { flag: 'g', label: 'g', title: 'Global: find all matches, not just the first' },
  { flag: 'i', label: 'i', title: 'Ignore case' },
  { flag: 'm', label: 'm', title: 'Multiline: ^ and $ match at line breaks' },
  { flag: 's', label: 's', title: 'Dot-all: . also matches line breaks' },
  { flag: 'u', label: 'u', title: 'Unicode: code points, \\p{…} classes' },
  { flag: 'y', label: 'y', title: 'Sticky: match only at lastIndex' },
];

const CHEATSHEET: { token: string; meaning: string }[] = [
  { token: '.', meaning: 'any character' },
  { token: '\\d', meaning: 'digit' },
  { token: '\\w', meaning: 'word char' },
  { token: '\\s', meaning: 'whitespace' },
  { token: '\\b', meaning: 'word boundary' },
  { token: '[abc]', meaning: 'one of a, b, c' },
  { token: '[^abc]', meaning: 'not a, b, c' },
  { token: '^', meaning: 'start' },
  { token: '$', meaning: 'end' },
  { token: '*', meaning: '0 or more' },
  { token: '+', meaning: '1 or more' },
  { token: '?', meaning: '0 or 1 / lazy' },
  { token: '{2,5}', meaning: '2 to 5 times' },
  { token: '(…)', meaning: 'capture group' },
  { token: '(?<name>…)', meaning: 'named group' },
  { token: '(?:…)', meaning: 'non-capturing' },
  { token: '(?=…)', meaning: 'lookahead' },
  { token: '(?<=…)', meaning: 'lookbehind' },
  { token: 'a|b', meaning: 'a or b' },
  { token: '\\1', meaning: 'backreference' },
];

const pattern = ref('(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)');
const flags = ref('g');
const text = ref('Contact alice@example.com or bob.smith+dev@mail.co.id\nfor access. Invalid: carol@localhost');
const replaceOn = ref(false);
const replacement = ref('$<user> at $<domain>');
const view = ref<'matches' | 'replace' | 'reference'>('matches');

const backdrop = ref<HTMLElement | null>(null);
const patternInput = ref<HTMLInputElement | null>(null);

const result = shallowRef<{ matches: RegexMatch[]; truncated: boolean; replaced: string | null; ms: number } | null>(null);
const error = ref('');
const running = ref(false);

const toggleFlag = (f: string) => {
  flags.value = flags.value.includes(f) ? flags.value.replace(f, '') : [...flags.value + f].sort().join('');
};

// Syntax errors are caught instantly on the main thread: compiling is cheap, only matching can hang.
const syntaxError = computed(() => {
  try {
    new RegExp(pattern.value, flags.value);
    return '';
  } catch (e) {
    return (e as Error).message.replace(/^Invalid regular expression: /, '');
  }
});

// ---- Worker with a watchdog ----
let worker: Worker | null = null;
let requestId = 0;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let debounce: ReturnType<typeof setTimeout> | undefined;

const getWorker = () => {
  if (!worker) {
    worker = new RegexWorker();
    worker.onmessage = (e: MessageEvent<RegexResponse>) => {
      if (e.data.id !== requestId) return;
      clearTimeout(watchdog);
      running.value = false;
      if (e.data.ok) {
        result.value = e.data;
        error.value = '';
      } else {
        result.value = null;
        error.value = e.data.error;
      }
    };
  }
  return worker;
};

const execute = () => {
  clearTimeout(watchdog);
  if (!pattern.value || syntaxError.value) {
    result.value = null;
    error.value = '';
    running.value = false;
    return;
  }
  const request: RegexRequest = {
    id: ++requestId,
    pattern: pattern.value,
    flags: flags.value,
    text: text.value,
    replacement: replaceOn.value ? replacement.value : null,
  };
  running.value = true;
  getWorker().postMessage(request);
  watchdog = setTimeout(() => {
    // Still busy: the pattern is probably backtracking exponentially. Kill it and start fresh next time.
    worker?.terminate();
    worker = null;
    running.value = false;
    result.value = null;
    error.value = `Stopped after ${TIMEOUT_MS / 1000}s: the pattern is too slow on this text (likely catastrophic backtracking, e.g. nested quantifiers like (a+)+)`;
  }, TIMEOUT_MS);
};

watch([pattern, flags, text, replaceOn, replacement], () => {
  clearTimeout(debounce);
  debounce = setTimeout(execute, 120);
}, { immediate: true });

watch(replaceOn, (on) => {
  if (on) view.value = 'replace';
  else if (view.value === 'replace') view.value = 'matches';
});

onBeforeUnmount(() => {
  clearTimeout(debounce);
  clearTimeout(watchdog);
  worker?.terminate();
});

// ---- Highlighting ----
const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

const hovered = ref<number | null>(null);

const highlighted = computed(() => {
  const source = text.value;
  const matches = result.value?.matches ?? [];
  let html = '';
  let cursor = 0;
  matches.slice(0, MAX_HIGHLIGHTS).forEach((m, i) => {
    if (m.end === m.start) return; // zero-length matches have nothing to paint
    html += escapeHtml(source.slice(cursor, m.start));
    const tone = i === hovered.value ? 'is-hovered' : i % 2 ? 'is-odd' : '';
    html += `<mark class="regex-mark ${tone}">${escapeHtml(source.slice(m.start, m.end))}</mark>`;
    cursor = m.end;
  });
  // Trailing newline keeps the backdrop height in step with the textarea.
  return html + escapeHtml(source.slice(cursor)) + '\n';
});

const syncScroll = (e: Event) => {
  if (backdrop.value) backdrop.value.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
};

// ---- Output helpers ----
const lineCol = (index: number) => {
  const before = text.value.slice(0, index);
  const line = before.split('\n').length;
  return `${line}:${index - before.lastIndexOf('\n')}`;
};

const visibleMatches = computed(() => (result.value?.matches ?? []).slice(0, 500));

const literal = computed(() => `/${pattern.value.replace(/(^|[^\\])\//g, '$1\\/')}/${flags.value}`);

const insertToken = (token: string) => {
  const el = patternInput.value;
  const insert = token.replace('…', '');
  if (!el) {
    pattern.value += insert;
    return;
  }
  const start = el.selectionStart ?? pattern.value.length;
  const end = el.selectionEnd ?? start;
  pattern.value = pattern.value.slice(0, start) + insert + pattern.value.slice(end);
  // Put the caret inside the brackets for group tokens, after the token otherwise.
  const caret = start + (token.includes('…') ? token.indexOf('…') : insert.length);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(caret, caret);
  });
};

const pasteText = async () => {
  const value = await readClipboard();
  if (value !== null) text.value = value;
};

const copyMatches = () => copyText((result.value?.matches ?? []).map((m) => m.value).join('\n'), 'Copied all matches');

const count = computed(() => result.value?.matches.length ?? 0);

const status = computed(() => {
  if (syntaxError.value) return { error: syntaxError.value };
  if (error.value) return { error: error.value };
  if (!pattern.value) return { hint: 'Type a pattern to start' };
  if (running.value && !result.value) return { hint: 'Matching…' };
  if (!result.value) return { hint: '' };
  const r = result.value;
  const noun = count.value === 1 ? 'match' : 'matches';
  const extra = r.truncated ? ` (stopped at ${MAX_MATCHES.toLocaleString()})` : '';
  return { hint: `${count.value.toLocaleString()} ${noun}${extra} · ${r.ms.toFixed(1)} ms · JavaScript (ECMAScript) flavour, runs in a worker` };
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <button class="btn-secondary" :disabled="!pattern" @click="copyText(literal, `Copied ${literal.length > 40 ? 'regex literal' : literal}`)">
          <Icon name="copy" :size="14" /> Copy as /regex/
        </button>
      </template>
    </ToolHeader>

    <!-- Pattern bar -->
    <div class="shrink-0 space-y-2 border-b border-line bg-canvas px-5 py-3.5">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex h-9 min-w-0 flex-1 items-center rounded-md border bg-surface font-mono text-sm transition-colors focus-within:border-accent"
             :class="syntaxError ? 'border-danger' : 'border-line-strong'">
          <span class="select-none pl-3 pr-1 text-subtle">/</span>
          <input ref="patternInput" v-model="pattern" spellcheck="false" autocomplete="off" aria-label="Regular expression"
                 placeholder="pattern" class="h-full min-w-0 flex-1 bg-transparent text-fg outline-none focus-visible:outline-none placeholder:text-subtle" />
          <span class="select-none pl-1 pr-3 text-subtle">/<span class="text-highlight">{{ flags }}</span></span>
        </div>
        <div class="flex items-center gap-1" role="group" aria-label="Flags">
          <button v-for="f in FLAGS" :key="f.flag" class="chip w-8 justify-center" :aria-pressed="flags.includes(f.flag)"
                  :title="f.title" @click="toggleFlag(f.flag)">{{ f.label }}</button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="chip font-sans" :aria-pressed="replaceOn" @click="replaceOn = !replaceOn">Replace</button>
        <template v-if="replaceOn">
          <input v-model="replacement" class="field min-w-0 flex-1 font-mono" spellcheck="false" autocomplete="off"
                 aria-label="Replacement" placeholder="Replacement: $1, $<name>, $& (whole match)" />
        </template>
        <p v-else class="text-xs text-subtle">Turn on to preview a replacement with $1, $&lt;name&gt; or $&amp;.</p>
      </div>
      <p v-if="syntaxError" class="flex items-center gap-1.5 text-xs text-danger"><Icon name="alert" :size="13" /> {{ syntaxError }}</p>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-2 gap-px bg-line">
      <!-- Test string -->
      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader label="Test string" :meta="`${text.length.toLocaleString()} chars`">
          <button class="btn-icon" title="Paste from clipboard" @click="pasteText"><Icon name="paste" :size="15" /></button>
          <button class="btn-icon" title="Clear" @click="text = ''"><Icon name="trash" :size="15" /></button>
        </PaneHeader>
        <div class="relative min-h-0 flex-1">
          <div ref="backdrop" aria-hidden="true"
               class="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-4 py-3 font-mono text-[13px] leading-6 text-fg"
               v-html="highlighted"></div>
          <textarea v-model="text" @scroll="syncScroll" spellcheck="false" aria-label="Test string"
                    placeholder="Text to run the pattern against"
                    class="absolute inset-0 resize-none whitespace-pre-wrap break-words bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-transparent caret-fg outline-none focus-visible:outline-none placeholder:text-subtle"></textarea>
        </div>
      </section>

      <!-- Results -->
      <section class="flex min-h-0 flex-col bg-canvas">
        <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface pl-2 pr-1.5">
          <div class="segmented h-7" role="tablist">
            <button :aria-pressed="view === 'matches'" @click="view = 'matches'">Matches <span class="ml-1 text-subtle">{{ count.toLocaleString() }}</span></button>
            <button :aria-pressed="view === 'replace'" :disabled="!replaceOn" :class="!replaceOn ? 'opacity-40' : ''" @click="view = 'replace'">Replaced</button>
            <button :aria-pressed="view === 'reference'" @click="view = 'reference'">Reference</button>
          </div>
          <button v-if="view === 'matches'" class="btn-icon" title="Copy all matches (one per line)" :disabled="!count" @click="copyMatches">
            <Icon name="copy" :size="15" />
          </button>
          <button v-else-if="view === 'replace'" class="btn-icon" title="Copy result" @click="copyText(result?.replaced ?? '')">
            <Icon name="copy" :size="15" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <!-- Matches -->
          <template v-if="view === 'matches'">
            <div v-if="!count" class="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Icon name="search" :size="26" class="text-subtle" />
              <p class="text-[13px] text-muted">{{ syntaxError || error ? 'Fix the pattern to see matches.' : pattern ? 'No matches.' : 'Type a pattern above.' }}</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="(m, i) in visibleMatches" :key="i" class="card overflow-hidden"
                   :class="hovered === i ? 'border-highlight/60' : ''"
                   @mouseenter="hovered = i" @mouseleave="hovered = null">
                <div class="group flex items-center gap-3 px-3 py-2">
                  <span class="w-7 shrink-0 text-[11px] tabular-nums text-subtle">#{{ i + 1 }}</span>
                  <code class="min-w-0 flex-1 break-all font-mono text-[13px] text-fg">
                    <template v-if="m.value">{{ m.value }}</template>
                    <span v-else class="italic text-subtle">empty match</span>
                  </code>
                  <span class="shrink-0 font-mono text-[11px] text-subtle" :title="`Index ${m.start}–${m.end}`">{{ lineCol(m.start) }}</span>
                  <button class="btn-icon opacity-0 group-hover:opacity-100 focus-visible:opacity-100" title="Copy match" @click="copyText(m.value)">
                    <Icon name="copy" :size="13" />
                  </button>
                </div>
                <div v-if="m.groups.length" class="border-t border-line bg-canvas/50 px-3 py-1.5">
                  <div v-for="g in m.groups" :key="g.name" class="flex items-baseline gap-3 py-0.5 text-xs">
                    <span class="w-24 shrink-0 truncate font-mono text-highlight" :title="g.name">{{ /^\d+$/.test(g.name) ? `$${g.name}` : g.name }}</span>
                    <code class="min-w-0 break-all font-mono" :class="g.value === undefined ? 'italic text-subtle' : 'text-fg'">
                      {{ g.value === undefined ? 'not matched' : g.value || '(empty)' }}
                    </code>
                  </div>
                </div>
              </div>
              <p v-if="count > visibleMatches.length" class="pt-1 text-center text-xs text-subtle">
                Showing the first {{ visibleMatches.length }} of {{ count.toLocaleString() }}. Copy all to get every match.
              </p>
            </div>
          </template>

          <!-- Replace -->
          <pre v-else-if="view === 'replace'" class="card min-h-full whitespace-pre-wrap break-words px-4 py-3 font-mono text-[13px] leading-6 text-fg">{{ result?.replaced ?? '' }}</pre>

          <!-- Cheatsheet -->
          <div v-else>
            <p class="mb-3 text-xs text-subtle">Click a token to insert it at the cursor.</p>
            <div class="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
              <button v-for="c in CHEATSHEET" :key="c.token"
                      class="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-accent/60 hover:bg-raised"
                      @click="insertToken(c.token)">
                <code class="w-20 shrink-0 font-mono text-[13px] text-accent">{{ c.token }}</code>
                <span class="text-xs text-muted">{{ c.meaning }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <StatusBar :error="status.error" :hint="status.hint" />
  </div>
</template>

<style scoped>
/* The backdrop is v-html, so its marks need :deep. Padding-free so text stays aligned with the textarea. */
:deep(.regex-mark) {
  color: inherit;
  border-radius: 2px;
  background: color-mix(in srgb, var(--color-accent) 28%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-accent) 45%, transparent);
}
:deep(.regex-mark.is-odd) {
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
}
:deep(.regex-mark.is-hovered) {
  background: color-mix(in srgb, var(--color-highlight) 35%, transparent);
  box-shadow: 0 0 0 1px var(--color-highlight);
}
</style>
