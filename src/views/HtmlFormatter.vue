<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import { html as beautifyHtml } from 'js-beautify';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const leftEditorRef = ref<HTMLElement | null>(null);
const rightEditorRef = ref<HTMLElement | null>(null);
const leftEditor = shallowRef<any>(null);
const rightEditor = shallowRef<any>(null);

onMounted(() => {
  const options = { theme: 'vs-dark', automaticLayout: true, fontSize: 13, minimap: { enabled: false } };
  leftEditor.value = monaco.editor.create(leftEditorRef.value!, { ...options, language: 'html', value: store.tabs.html[2].input });
  rightEditor.value = monaco.editor.create(rightEditorRef.value!, { ...options, language: 'html', value: store.tabs.html[2].output, readOnly: true });

  leftEditor.value.onDidChangeModelContent(() => {
    store.tabs.html[2].input = leftEditor.value.getValue();
  });
});

const process = (mode: 'format' | 'minify') => {
  const raw = leftEditor.value.getValue();
  let result = '';
  if (mode === 'format') {
    result = beautifyHtml(raw, { indent_size: 2, wrap_line_length: 0, preserve_newlines: true });
  } else {
    result = raw.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }
  rightEditor.value.setValue(result);
  store.tabs.html[2].output = result;
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="h-14 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">HTML Processor</span>
      <div class="flex gap-2">
        <button @click="process('minify')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1.5 text-xs font-bold rounded hover:bg-orange-600/30">Minify</button>
        <button @click="process('format')" class="bg-blue-600 text-white px-4 py-1.5 text-xs font-bold rounded hover:bg-blue-500 shadow-lg">Beautify</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden bg-[#1e1e1e]">
      <div class="flex-1 flex flex-col border-r border-white/5">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase">Input HTML</div>
        <div ref="leftEditorRef" class="flex-1"></div>
      </div>
      <div class="flex-1 flex flex-col">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase">Output Result</div>
        <div ref="rightEditorRef" class="flex-1"></div>
      </div>
    </div>
  </div>
</template>