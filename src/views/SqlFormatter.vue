<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { format as formatSql } from 'sql-formatter';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const leftEditorRef = ref<HTMLElement | null>(null);
const rightEditorRef = ref<HTMLElement | null>(null);
const leftEditor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const rightEditor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);

onMounted(() => {
  // Casting tipe wordWrap agar sesuai dengan spek Monaco
  const wrapMode = (store.wrapText ? 'on' : 'off') as 'on' | 'off';

  const options: monaco.editor.IStandaloneEditorConstructionOptions = { 
    theme: 'vs-dark', 
    automaticLayout: true, 
    fontSize: 13, 
    minimap: { enabled: false },
    wordWrap: wrapMode,
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true }
  };
  
  if (leftEditorRef.value && rightEditorRef.value) {
    leftEditor.value = monaco.editor.create(leftEditorRef.value, { 
      ...options, 
      language: 'sql', 
      value: store.tabs.sql[3].input 
    });
    
    rightEditor.value = monaco.editor.create(rightEditorRef.value, { 
      ...options, 
      language: 'sql', 
      value: store.tabs.sql[3].output, 
      readOnly: true 
    });

    leftEditor.value.onDidChangeModelContent(() => {
      store.tabs.sql[3].input = leftEditor.value?.getValue() || '';
    });
  }
});

// Watcher untuk Toggle Word Wrap
watch(() => store.wrapText, (newVal) => {
  const mode = newVal ? 'on' : 'off';
  leftEditor.value?.updateOptions({ wordWrap: mode });
  rightEditor.value?.updateOptions({ wordWrap: mode });
});

const process = (mode: 'format' | 'minify') => {
  if (!leftEditor.value || !rightEditor.value) return;

  const raw = leftEditor.value.getValue();
  let result = '';
  
  try {
    if (mode === 'format') {
      result = formatSql(raw, { 
        language: 'postgresql', 
        keywordCase: 'upper' 
      });
    } else {
      // Minify logic
      result = raw.replace(/\s+/g, ' ').replace(/\s?([\(\),;])\s?/g, '$1').trim();
    }
    
    rightEditor.value.setValue(result);
    store.tabs.sql[3].output = result;
  } catch (e) {
    alert('SQL Syntax Error atau library belum terload sempurna');
  }
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="h-14 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5">
      <div class="flex items-center gap-4">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">SQL Processor</span>
        <button @click="store.wrapText = !store.wrapText" 
                :class="store.wrapText ? 'text-blue-400 bg-blue-400/10' : 'text-slate-500 bg-white/5'"
                class="text-[10px] px-2 py-1 rounded border border-white/5 transition uppercase font-bold">
          Word Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="flex gap-2">
        <button @click="process('minify')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1.5 text-xs font-bold rounded hover:bg-orange-600/30">Minify</button>
        <button @click="process('format')" class="bg-blue-600 text-white px-4 py-1.5 text-xs font-bold rounded hover:bg-blue-500 shadow-lg">Format SQL</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden bg-[#1e1e1e]">
      <div class="flex-1 flex flex-col border-r border-white/5 relative">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase flex justify-between">
          <span>Input Query</span>
          <span class="text-blue-400 lowercase">Alt + Click for Multi-cursor</span>
        </div>
        <div ref="leftEditorRef" class="flex-1"></div>
      </div>
      <div class="flex-1 flex flex-col">
        <div class="bg-[#1a1a1a] px-4 py-1 text-[10px] text-slate-500 uppercase">Formatted Result</div>
        <div ref="rightEditorRef" class="flex-1"></div>
      </div>
    </div>
  </div>
</template>