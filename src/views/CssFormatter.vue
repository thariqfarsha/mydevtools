<script setup lang="ts">
import { ref } from 'vue';
import { css as beautifyCss } from 'js-beautify';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';
import { minifyCss } from '../utils/css';

const indent = ref<'2' | '4' | 'tab'>('2');
const editors = useTabbedEditors('css', 'css', () => { process('format'); });

const process = (mode: 'format' | 'minify') =>
  editors.run((raw) => mode === 'minify'
    ? minifyCss(raw)
    : beautifyCss(raw, {
        indent_size: indent.value === 'tab' ? 1 : Number(indent.value),
        indent_char: indent.value === 'tab' ? '\t' : ' ',
        selector_separator_newline: true,
        newline_between_rules: true,
        end_with_newline: false,
      }),
  'CSS error');
</script>

<template>
  <EditorToolLayout tool="css" :editors="editors">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Beautify</button>
    </template>
    <template #options>
      <span class="text-subtle">Indent</span>
      <div class="segmented">
        <button v-for="opt in (['2', '4', 'tab'] as const)" :key="opt" :aria-pressed="indent === opt" @click="indent = opt">
          {{ opt === 'tab' ? 'Tab' : opt }}
        </button>
      </div>
    </template>
  </EditorToolLayout>
</template>
