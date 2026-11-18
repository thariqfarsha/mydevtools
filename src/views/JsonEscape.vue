<script setup lang="ts">
import { ref } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const { error, run, getOutput, setInput, setOutput } = useTabbedEditors('jsonEscape', 'plaintext');

const wrapQuotes = ref(false);

const escapeJson = (raw: string) => {
  const quoted = JSON.stringify(raw);
  return wrapQuotes.value ? quoted : quoted.slice(1, -1);
};

const unescapeJson = (raw: string) => {
  const trimmed = raw.trim();
  // Accept either a full JSON string literal ("...") or just its inner content.
  const literal = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
    ? trimmed
    : `"${raw}"`;
  const result = JSON.parse(literal);
  if (typeof result !== 'string') throw new Error('Input is not a JSON string');
  return result;
};

const swap = () => {
  setInput(getOutput());
  setOutput('');
};

const copyOutput = () => navigator.clipboard?.writeText(getOutput());
</script>

<template>
  <EditorToolLayout tool="jsonEscape" :error="error">
    <template #options>
      <label class="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none whitespace-nowrap">
        <input type="checkbox" v-model="wrapQuotes" class="accent-blue-600" />
        Add surrounding quotes on escape
      </label>
    </template>
    <template #actions>
      <button @click="swap" class="btn-ghost" title="Move output to input">⇄ Swap</button>
      <button @click="copyOutput" class="btn-ghost">Copy</button>
      <button @click="run(unescapeJson, 'Unescape failed')" class="btn-secondary">Unescape</button>
      <button @click="run(escapeJson)" class="btn-primary">Escape</button>
    </template>
    <div class="flex-1 border-r border-white/5" ref="input"></div>
    <div class="flex-1" ref="output"></div>
  </EditorToolLayout>
</template>
