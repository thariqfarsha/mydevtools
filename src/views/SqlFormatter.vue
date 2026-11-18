<script setup lang="ts">
import { format as formatSql } from 'sql-formatter';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const { error, run } = useTabbedEditors('sql', 'sql');

const process = (mode: 'format' | 'minify') =>
  run((raw) => mode === 'format'
    ? formatSql(raw, { language: 'postgresql', keywordCase: 'upper' })
    : raw.replace(/\s+/g, ' ').replace(/\s?([\(\),;])\s?/g, '$1').trim(),
  'SQL error');
</script>

<template>
  <EditorToolLayout tool="sql" :error="error">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Format SQL</button>
    </template>
    <div class="flex-1 border-r border-white/5" ref="input"></div>
    <div class="flex-1" ref="output"></div>
  </EditorToolLayout>
</template>
