<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { html as beautifyHtml } from 'js-beautify';
import { useTabStore } from '../stores/tabStore';
import { useMonaco } from '../composables/useMonaco';

const store = useTabStore();
const getTab = () => store.tabs.html[store.activeTabId.html];

const { editorRef: leftRef, editor: leftEditor, initEditor: initLeft } = useMonaco('html', getTab().input);
const { editorRef: rightRef, editor: rightEditor, initEditor: initRight } = useMonaco('html', getTab().output, true);

onMounted(() => {
  initLeft();
  initRight();
  leftEditor.value?.onDidChangeModelContent(() => {
    getTab().input = leftEditor.value?.getValue() || '';
  });
});

watch(() => store.activeTabId.html, () => {
  leftEditor.value?.setValue(getTab().input);
  rightEditor.value?.setValue(getTab().output);
});

const process = (mode: 'format' | 'minify') => {
  const raw = leftEditor.value?.getValue() || '';
  try {
    let res = '';
    if (mode === 'format') {
      res = beautifyHtml(raw, { 
        indent_size: 2, 
        wrap_line_length: 0, 
        preserve_newlines: true,
        unformatted: ['em', 'strong', 'span'] 
      });
    } else {
      // Minify sederhana untuk HTML
      res = raw.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
    }
    rightEditor.value?.setValue(res);
    getTab().output = res;
  } catch (e) {
    console.error('HTML processing error', e);
  }
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex bg-[#252526] border-b border-white/5">
      <div v-for="tab in store.tabs.html" :key="tab.id" 
           @click="store.activeTabId.html = tab.id"
           :class="[store.activeTabId.html === tab.id ? 'bg-[#1e1e1e] border-t-2 border-blue-600 text-white' : 'text-slate-500 hover:bg-white/5']"
           class="px-4 py-2 cursor-pointer text-xs border-r border-white/5 flex items-center gap-2 select-none group">
        <span class="truncate max-w-25">{{ tab.title }}</span>
        <span @click.stop="store.removeTab('html', tab.id)" class="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">×</span>
      </div>
      <button @click="store.addTab('html')" class="px-3 text-slate-500 hover:text-white cursor-pointer">+</button>
    </div>

    <div class="h-12 flex items-center justify-between px-6 bg-[#1e1e1e] border-b border-white/5 font-sans">
      <div class="flex items-center gap-4">
        <button @click="store.wrapText = !store.wrapText" class="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer uppercase font-bold transition-colors">
          Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="flex gap-2">
        <button @click="process('minify')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-orange-600/30">Minify</button>
        <button @click="process('format')" class="bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-blue-500 shadow-lg">Beautify HTML</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 border-r border-white/5" ref="leftRef"></div>
      <div class="flex-1" ref="rightRef"></div>
    </div>
  </div>
</template>