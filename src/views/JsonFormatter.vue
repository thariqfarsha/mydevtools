<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const leftEditorRef = ref<HTMLElement | null>(null);
const rightEditorRef = ref<HTMLElement | null>(null);
const leftEditor = shallowRef<any>(null);
const rightEditor = shallowRef<any>(null);

onMounted(() => {
  const commonOptions = { theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 13 };
  
  leftEditor.value = monaco.editor.create(leftEditorRef.value!, { ...commonOptions, language: 'json', value: store.tabs.json[1].input });
  rightEditor.value = monaco.editor.create(rightEditorRef.value!, { ...commonOptions, language: 'json', value: store.tabs.json[1].output, readOnly: true });

  leftEditor.value.onDidChangeModelContent(() => {
    store.tabs.json[1].input = leftEditor.value.getValue();
  });
});

const process = (mode: 'format' | 'minify') => {
  try {
    const raw = leftEditor.value.getValue();
    const parsed = JSON.parse(raw);
    const result = mode === 'format' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    rightEditor.value.setValue(result);
    store.tabs.json[1].output = result;
  } catch (e) { alert('Invalid JSON Syntax'); }
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="h-14 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5">
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">JSON Processor</span>
      </div>
      <div class="flex gap-2">
        <button @click="process('minify')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1.5 text-xs font-bold rounded hover:bg-orange-600/30 transition">Minify</button>
        <button @click="process('format')" class="bg-blue-600 text-white px-4 py-1.5 text-xs font-bold rounded hover:bg-blue-500 transition shadow-lg">Beautify</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col border-r border-white/5">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase">Input Raw</div>
        <div ref="leftEditorRef" class="flex-1"></div>
      </div>
      <div class="flex-1 flex flex-col">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase">Output Result</div>
        <div ref="rightEditorRef" class="flex-1"></div>
      </div>
    </div>
  </div>
</template>