<script setup lang="ts">
import { ref } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const indent = ref<'2' | '4' | 'tab'>('2');
const editors = useTabbedEditors('json', 'json', () => { process('format'); });

const process = (mode: 'format' | 'minify') =>
  editors.run((raw) => {
    const parsed = JSON.parse(raw);
    if (mode === 'minify') return JSON.stringify(parsed);
    return JSON.stringify(parsed, null, indent.value === 'tab' ? '\t' : Number(indent.value));
  }, 'Invalid JSON');
</script>

<template>
  <EditorToolLayout tool="json" :editors="editors">
    <template #actions>
      <button @click="process('minify')" class="btn-secondary">Minify</button>
      <button @click="process('format')" class="btn-primary">Beautify</button>
    </template>
    <template #options>
      <span class="text-subtle">Indent</span>
      <div class="segmented">
        <button v-for="opt in (['2', '4', 'tab'] as const)" :key="opt"
                :aria-pressed="indent === opt" @click="indent = opt">
          {{ opt === 'tab' ? 'Tab' : opt }}
        </button>
      </div>
    </template>
  </EditorToolLayout>
</template>
