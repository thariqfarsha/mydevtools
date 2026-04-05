<script setup lang="ts">
import { onMounted, ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const diffContainer = ref<HTMLElement | null>(null);
const diffEditor = shallowRef<monaco.editor.IDiffEditor | null>(null);

onMounted(() => {
  if (diffContainer.value) {
    diffEditor.value = monaco.editor.createDiffEditor(diffContainer.value, {
      theme: 'vs-dark',
      automaticLayout: true,
      originalEditable: true,
      renderSideBySide: true,
      fontSize: 13,
      wordWrap: store.wrapText ? 'on' : 'off'
    });

    const originalModel = monaco.editor.createModel(store.tabs.diff.original, 'text/plain');
    const modifiedModel = monaco.editor.createModel(store.tabs.diff.modified, 'text/plain');

    diffEditor.value.setModel({ original: originalModel, modified: modifiedModel });

    originalModel.onDidChangeContent(() => store.tabs.diff.original = originalModel.getValue());
    modifiedModel.onDidChangeContent(() => store.tabs.diff.modified = modifiedModel.getValue());
  }
});

watch(() => store.wrapText, (val) => {
  diffEditor.value?.updateOptions({ wordWrap: val ? 'on' : 'off' });
});

onBeforeUnmount(() => {
  diffEditor.value?.dispose(); // Penting: Hapus instance agar tidak stuck!
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="h-12 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5 font-sans">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Text Diff Checker</span>
      <button @click="store.wrapText = !store.wrapText" class="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer uppercase font-bold">
        Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
      </button>
    </div>
    <div ref="diffContainer" class="flex-1"></div>
  </div>
</template>