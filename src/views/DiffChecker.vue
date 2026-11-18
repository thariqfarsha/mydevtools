<script setup lang="ts">
import { onMounted, ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';
import WrapToggle from '../components/WrapToggle.vue';

const store = useTabStore();
const diffContainer = ref<HTMLElement | null>(null);
const diffEditor = shallowRef<monaco.editor.IDiffEditor | null>(null);
let models: monaco.editor.ITextModel[] = [];

onMounted(() => {
  if (!diffContainer.value) return;

  diffEditor.value = monaco.editor.createDiffEditor(diffContainer.value, {
    theme: 'vs-dark',
    automaticLayout: true,
    originalEditable: true,
    renderSideBySide: true,
    fontSize: 13,
    wordWrap: store.wrapText ? 'on' : 'off',
  });

  const originalModel = monaco.editor.createModel(store.diff.original, 'plaintext');
  const modifiedModel = monaco.editor.createModel(store.diff.modified, 'plaintext');
  models = [originalModel, modifiedModel];

  diffEditor.value.setModel({ original: originalModel, modified: modifiedModel });

  originalModel.onDidChangeContent(() => (store.diff.original = originalModel.getValue()));
  modifiedModel.onDidChangeContent(() => (store.diff.modified = modifiedModel.getValue()));
});

watch(() => store.wrapText, (val) => {
  diffEditor.value?.updateOptions({ wordWrap: val ? 'on' : 'off' });
});

onBeforeUnmount(() => {
  // Dispose the editor and its models so nothing leaks between visits.
  diffEditor.value?.dispose();
  models.forEach((model) => model.dispose());
});
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="h-12 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5 font-sans">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Text Diff Checker</span>
      <WrapToggle />
    </div>
    <div ref="diffContainer" class="flex-1"></div>
  </div>
</template>
