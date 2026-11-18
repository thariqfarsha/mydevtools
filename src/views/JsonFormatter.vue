<script setup lang="ts">
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const { error, run } = useTabbedEditors('json', 'json');

const process = (mode: 'format' | 'minify') =>
  run((raw) => {
    const parsed = JSON.parse(raw);
    return mode === 'format' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
  }, 'Invalid JSON');
</script>

<template>
  <EditorToolLayout tool="json" :error="error">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Beautify JSON</button>
    </template>
    <div class="flex-1 border-r border-white/5" ref="input"></div>
    <div class="flex-1" ref="output"></div>
  </EditorToolLayout>
</template>
