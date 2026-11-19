<script setup lang="ts">
import { ref } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';
import { formatXml } from '../utils/xml';

const indent = ref<'2' | '4' | 'tab'>('2');
const editors = useTabbedEditors('xml', 'xml', () => { process('format'); });

const process = (mode: 'format' | 'minify') =>
  editors.run((raw) => formatXml(raw, mode, indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value))), 'Invalid XML');
</script>

<template>
  <EditorToolLayout tool="xml" :editors="editors">
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
