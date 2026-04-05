<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useTabStore } from '../stores/tabStore';
import { useMonaco } from '../composables/useMonaco';

const store = useTabStore();
const getTab = () => store.tabs.json[store.activeTabId.json];

const { editorRef: leftRef, editor: leftEditor, initEditor: initLeft } = useMonaco('json', getTab().input);
const { editorRef: rightRef, editor: rightEditor, initEditor: initRight } = useMonaco('json', getTab().output, true);

onMounted(() => {
  if (leftRef.value && rightRef.value) {
    initLeft();
    initRight();
  }
  leftEditor.value?.onDidChangeModelContent(() => {
    getTab().input = leftEditor.value?.getValue() || '';
  });
});

watch(() => store.activeTabId.json, () => {
  leftEditor.value?.setValue(getTab().input);
  rightEditor.value?.setValue(getTab().output);
});

// Format & Minify
const process = (mode: 'format' | 'minify') => {
  const raw = leftEditor.value?.getValue() || '';
  try {
    const parsed = JSON.parse(raw);
    let res = '';
    
    if (mode === 'format') {
      res = JSON.stringify(parsed, null, 2); // Indentasi 2 spasi
    } else {
      res = JSON.stringify(parsed); // Tanpa spasi (Minify)
    }
    
    rightEditor.value?.setValue(res);
    getTab().output = res;
  } catch (e) {
    alert('JSON tidak valid! Pastikan format input sudah benar.');
  }
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex bg-[#252526] border-b border-white/5">
      <div v-for="tab in store.tabs.json" :key="tab.id" 
           @click="store.activeTabId.json = tab.id"
           :class="[store.activeTabId.json === tab.id ? 'bg-[#1e1e1e] border-t-2 border-blue-600 text-white' : 'text-slate-500 hover:bg-white/5']"
           class="px-4 py-2 cursor-pointer text-xs border-r border-white/5 flex items-center gap-2 select-none group">
        <span class="truncate max-w-25">{{ tab.title }}</span>
        <span @click.stop="store.removeTab('json', tab.id)" class="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">×</span>
      </div>
      <button @click="store.addTab('json')" class="px-3 text-slate-500 hover:text-white cursor-pointer">+</button>
    </div>

    <div class="h-12 flex items-center justify-between px-6 bg-[#1e1e1e] border-b border-white/5 font-sans">
      <div class="flex items-center gap-4">
        <button @click="store.wrapText = !store.wrapText" class="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer uppercase font-bold transition-colors">
          Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="flex gap-2">
        <button @click="process('minify')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-orange-600/30">Minify</button>
        <button @click="process('format')" class="bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-blue-500 shadow-lg">Beautify JSON</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden bg-[#1e1e1e]">
      <div class="flex-1 border-r border-white/5" ref="leftRef"></div>
      <div class="flex-1" ref="rightRef"></div>
    </div>
  </div>
</template>