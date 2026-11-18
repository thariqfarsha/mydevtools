<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMonaco } from '../composables/useMonaco';
import WrapToggle from '../components/WrapToggle.vue';

const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
} as const;

const MAX_LENGTH = 1024;
const MAX_ROWS = 100_000;

const length = ref(12);
const rows = ref(10);
const useUpper = ref(true);
const useLower = ref(true);
const useDigits = ref(true);
const unique = ref(true);
const error = ref('');
const copied = ref(false);

const { editor, initEditor } = useMonaco('output', 'plaintext', '', true);

const alphabet = computed(() =>
  (useUpper.value ? CHARSETS.upper : '') +
  (useLower.value ? CHARSETS.lower : '') +
  (useDigits.value ? CHARSETS.digits : ''));

// Bits of entropy per string: length × log2(alphabet size).
const entropyBits = computed(() =>
  alphabet.value ? Math.floor(length.value * Math.log2(alphabet.value.length)) : 0);

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
    error.value = `Only ${Math.pow(chars.length, len).toLocaleString()} unique values exist for this length; lower the row count or increase the length.`;
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
  error.value = '';
};

const copyOutput = async () => {
  await navigator.clipboard?.writeText(editor.value?.getValue() ?? '');
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
};

const downloadOutput = () => {
  const blob = new Blob([editor.value?.getValue() ?? ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `random-strings-${rows.value}x${length.value}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  initEditor();
  generate();
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-3 bg-[#252526] border-b border-white/5 font-sans">
      <form class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" @submit.prevent="generate">
        <label class="flex items-center gap-2 text-slate-400">
          Length
          <input v-model.number="length" type="number" min="1" :max="MAX_LENGTH" class="field w-20" />
        </label>
        <label class="flex items-center gap-2 text-slate-400">
          Rows
          <input v-model.number="rows" type="number" min="1" :max="MAX_ROWS" class="field w-24" />
        </label>

        <div class="flex items-center gap-3 text-slate-400">
          <label class="flex items-center gap-1.5 cursor-pointer select-none"><input v-model="useUpper" type="checkbox" class="accent-blue-600" /> A–Z</label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none"><input v-model="useLower" type="checkbox" class="accent-blue-600" /> a–z</label>
          <label class="flex items-center gap-1.5 cursor-pointer select-none"><input v-model="useDigits" type="checkbox" class="accent-blue-600" /> 0–9</label>
        </div>

        <label class="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none">
          <input v-model="unique" type="checkbox" class="accent-blue-600" /> Unique rows
        </label>

        <span class="text-[11px] text-slate-500" title="Bits of entropy per string">≈ {{ entropyBits }} bits</span>

        <button type="submit" class="btn-primary">Generate</button>
      </form>

      <div class="flex items-center gap-2">
        <WrapToggle />
        <button @click="copyOutput" class="btn-ghost">{{ copied ? 'Copied ✓' : 'Copy' }}</button>
        <button @click="downloadOutput" class="btn-ghost">Download .txt</button>
      </div>
    </div>

    <div v-if="error" class="px-6 py-2 text-[11px] text-red-400 bg-red-500/5 border-b border-red-500/10">{{ error }}</div>

    <div class="flex-1 overflow-hidden bg-[#1e1e1e]" ref="output"></div>
  </div>
</template>
