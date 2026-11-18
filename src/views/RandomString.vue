<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMonaco } from '../composables/useMonaco';
import { copyText } from '../composables/useToast';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import WrapToggle from '../components/WrapToggle.vue';
import Icon from '../components/Icon.vue';

const CHARSETS = [
  { key: 'upper', label: 'A–Z', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { key: 'lower', label: 'a–z', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { key: 'digits', label: '0–9', chars: '0123456789' },
] as const;

const LENGTH_PRESETS = [8, 12, 16, 32, 64];
const MAX_LENGTH = 1024;
const MAX_ROWS = 100_000;

const length = ref(12);
const rows = ref(10);
const enabled = ref<Record<string, boolean>>({ upper: true, lower: true, digits: true });
const unique = ref(true);
const error = ref('');
const generated = ref({ rows: 0, length: 0 });

const { bindEl, editor, initEditor } = useMonaco('plaintext', '', true);

const alphabet = computed(() => CHARSETS.filter((c) => enabled.value[c.key]).map((c) => c.chars).join(''));

// Bits of entropy per string: length × log2(alphabet size).
const entropyBits = computed(() =>
  alphabet.value ? Math.floor(length.value * Math.log2(alphabet.value.length)) : 0);

const strength = computed(() => {
  const bits = entropyBits.value;
  if (bits >= 128) return { label: 'Very strong', class: 'text-success' };
  if (bits >= 64) return { label: 'Strong', class: 'text-success' };
  if (bits >= 40) return { label: 'Fair', class: 'text-warning' };
  return { label: 'Weak', class: 'text-danger' };
});

/**
 * Cryptographically secure random string.
 * Rejection sampling drops bytes >= the largest multiple of the alphabet size,
 * so every character is equally likely (plain `byte % n` would favour the first characters).
 */
const randomString = (len: number, chars: string) => {
  const n = chars.length;
  const limit = 256 - (256 % n);
  const buffer = new Uint8Array(Math.max(16, len * 2));
  let out = '';
  while (out.length < len) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (byte >= limit) continue;
      out += chars[byte % n];
      if (out.length === len) break;
    }
  }
  return out;
};

const toInt = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(Number(value) || 0)));

const generate = () => {
  const len = toInt(length.value, 1, MAX_LENGTH);
  const count = toInt(rows.value, 1, MAX_ROWS);
  length.value = len;
  rows.value = count;
  const chars = alphabet.value;

  if (!chars) {
    error.value = 'Select at least one character set.';
    return;
  }

  // Not enough distinct combinations to produce that many unique rows.
  if (unique.value && len * Math.log2(chars.length) < Math.log2(count)) {
    error.value = `Only ${Math.pow(chars.length, len).toLocaleString()} unique values exist at this length. Lower the row count or increase the length.`;
    return;
  }

  let lines: string[];
  if (unique.value) {
    const seen = new Set<string>();
    while (seen.size < count) seen.add(randomString(len, chars));
    lines = [...seen];
  } else {
    lines = Array.from({ length: count }, () => randomString(len, chars));
  }

  editor.value?.setValue(lines.join('\n'));
  generated.value = { rows: count, length: len };
  error.value = '';
};

const toggleCharset = (key: string) => {
  enabled.value = { ...enabled.value, [key]: !enabled.value[key] };
};

const copyOutput = () => copyText(editor.value?.getValue() ?? '', `Copied ${generated.value.rows.toLocaleString()} rows`);

const downloadOutput = () => {
  const blob = new Blob([editor.value?.getValue() ?? ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `random-strings-${generated.value.rows}x${generated.value.length}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

onMounted(() => {
  initEditor();
  generate();
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden" @keydown.meta.enter="generate" @keydown.ctrl.enter="generate">
    <ToolHeader>
      <template #actions>
        <button class="btn-primary" @click="generate"><Icon name="refresh" :size="14" /> Generate</button>
      </template>
    </ToolHeader>

    <!-- Options -->
    <form class="flex shrink-0 flex-wrap items-end gap-x-6 gap-y-3 border-b border-line bg-canvas px-5 py-3.5" @submit.prevent="generate">
      <div class="flex flex-col gap-1.5">
        <span class="label">Length</span>
        <div class="flex items-center gap-1.5">
          <input v-model.number="length" type="number" min="1" :max="MAX_LENGTH" class="field w-16 font-mono" aria-label="Length" />
          <div class="segmented">
            <button v-for="n in LENGTH_PRESETS" :key="n" type="button" :aria-pressed="length === n" @click="length = n">{{ n }}</button>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="label">Rows</span>
        <input v-model.number="rows" type="number" min="1" :max="MAX_ROWS" class="field w-24 font-mono" aria-label="Rows" />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="label">Characters</span>
        <div class="flex items-center gap-1.5">
          <button v-for="set in CHARSETS" :key="set.key" type="button" class="chip"
                  :aria-pressed="enabled[set.key]" @click="toggleCharset(set.key)">{{ set.label }}</button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="label">Options</span>
        <button type="button" class="chip !font-sans" :aria-pressed="unique" @click="unique = !unique"
                title="Guarantee there are no duplicate rows">No duplicates</button>
      </div>

      <div class="ml-auto flex flex-col items-end gap-1.5" title="Bits of entropy per string">
        <span class="label">Strength</span>
        <div class="flex h-8 items-center gap-2 text-xs">
          <span :class="strength.class" class="font-medium">{{ strength.label }}</span>
          <span class="text-subtle">≈ {{ entropyBits }} bits</span>
        </div>
      </div>
    </form>

    <!-- Output -->
    <section class="flex min-h-0 flex-1 flex-col bg-surface">
      <PaneHeader label="Output" :meta="generated.rows ? `${generated.rows.toLocaleString()} rows × ${generated.length} chars` : ''">
        <WrapToggle />
        <button class="btn-icon" title="Download .txt" @click="downloadOutput"><Icon name="download" :size="15" /></button>
        <button class="btn-icon" title="Copy all" @click="copyOutput"><Icon name="copy" :size="15" /></button>
      </PaneHeader>
      <div class="min-h-0 flex-1" :ref="bindEl"></div>
    </section>

    <StatusBar :error="error" :hint="`Uses crypto.getRandomValues · ${isMac ? '⌘' : 'Ctrl'}+Enter to regenerate`" />
  </div>
</template>
