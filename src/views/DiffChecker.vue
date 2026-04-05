<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const diffContainer = ref<HTMLElement | null>(null);
const diffEditor = shallowRef<any>(null);

onMounted(() => {
  if (diffContainer.value) {
    diffEditor.value = monaco.editor.createDiffEditor(diffContainer.value, {
      theme: 'vs-dark',
      automaticLayout: true,
      originalEditable: true,
      renderSideBySide: true, // Paksa tampilan berdampingan
      fontSize: 13,
      minimap: { enabled: false }
    });

    const originalModel = monaco.editor.createModel(store.tabs.diff[3].original, 'text/plain');
    const modifiedModel = monaco.editor.createModel(store.tabs.diff[3].modified, 'text/plain');

    diffEditor.value.setModel({ 
      original: originalModel, 
      modified: modifiedModel 
    });

    // Sync balik ke Pinia jika ada perubahan
    originalModel.onDidChangeContent(() => store.tabs.diff[3].original = originalModel.getValue());
    modifiedModel.onDidChangeContent(() => store.tabs.diff[3].modified = modifiedModel.getValue());
  }
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
    <div class="h-14 flex items-center px-6 bg-[#252526] border-b border-white/5 justify-between">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Text Diff Checker</span>
      <div class="text-[10px] text-slate-600 italic">Kiri: Original | Kanan: Modified</div>
    </div>
    <div ref="diffContainer" class="flex-1 overflow-hidden"></div>
  </div>
</template>