<script setup lang="ts">
import { html as beautifyHtml } from 'js-beautify';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const { error, run } = useTabbedEditors('html', 'html');

const process = (mode: 'format' | 'minify') =>
  run((raw) => mode === 'format'
    ? beautifyHtml(raw, {
        indent_size: 2,
        wrap_line_length: 0,
        preserve_newlines: true,
        unformatted: ['em', 'strong', 'span'],
      })
    // Simple HTML minify
    : raw.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim(),
  'HTML error');
</script>

<template>
  <EditorToolLayout tool="html" :error="error">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Beautify HTML</button>
    </template>
    <div class="flex-1 border-r border-white/5" ref="input"></div>
    <div class="flex-1" ref="output"></div>
  </EditorToolLayout>
</template>
