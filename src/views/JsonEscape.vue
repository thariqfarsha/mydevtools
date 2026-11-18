<script setup lang="ts">
import { ref } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import Icon from '../components/Icon.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const wrapQuotes = ref(false);
const editors = useTabbedEditors('jsonEscape', 'plaintext', () => { editors.run(escapeJson); });

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
  editors.setInput(editors.getOutput());
  editors.setOutput('');
};
</script>

<template>
  <EditorToolLayout tool="jsonEscape" :editors="editors">
    <template #actions>
      <button @click="editors.run(unescapeJson, 'Unescape failed')" class="btn-secondary">Unescape</button>
      <button @click="editors.run(escapeJson)" class="btn-primary">Escape</button>
    </template>
    <template #options>
      <button class="chip !font-sans" :aria-pressed="wrapQuotes" @click="wrapQuotes = !wrapQuotes"
              title="Wrap the escaped result in double quotes">
        "…" Surround with quotes
      </button>
    </template>
    <template #output-actions>
      <button class="btn-icon" title="Use output as input" @click="swap"><Icon name="swap" :size="15" /></button>
    </template>
  </EditorToolLayout>
</template>
