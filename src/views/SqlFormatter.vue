<script setup lang="ts">
import { format as formatSql } from 'sql-formatter';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const editors = useTabbedEditors('sql', 'sql', () => { process('format'); });

const process = (mode: 'format' | 'minify') =>
  editors.run((raw) => mode === 'format'
    ? formatSql(raw, { language: 'postgresql', keywordCase: 'upper' })
    : raw.replace(/\s+/g, ' ').replace(/\s?([\(\),;])\s?/g, '$1').trim(),
  'SQL error');
</script>

<template>
  <EditorToolLayout tool="sql" :editors="editors">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Format</button>
    </template>
  </EditorToolLayout>
</template>
