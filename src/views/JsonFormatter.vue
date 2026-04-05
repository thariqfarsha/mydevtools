<script setup lang="ts">
import { onMounted, ref, watch, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';

const store = useTabStore();
const editorRef = ref<HTMLElement | null>(null);
const editor = shallowRef<any>(null);

onMounted(() => {
  editor.value = monaco.editor.create(editorRef.value!, {
    value: store.tabs.json[store.activeTabId.json].content,
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true
  });
  editor.value.onDidChangeModelContent(() => {
    store.tabs.json[store.activeTabId.json].content = editor.value.getValue();
  });
});

watch(() => store.activeTabId.json, (id) => {
  if (editor.value) editor.value.setValue(store.tabs.json[id].content);
});

const format = () => {
  try {
    editor.value.setValue(JSON.stringify(JSON.parse(editor.value.getValue()), null, 2));
  } catch (e) { alert('Invalid JSON'); }
};
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex bg-[#252526] border-b border-white/5 overflow-x-auto">
      <div v-for="tab in store.tabs.json" :key="tab.id" @click="store.activeTabId.json = tab.id"
           :class="[store.activeTabId.json === tab.id ? 'bg-[#1e1e1e] border-t-2 border-blue-600 text-white' : 'text-slate-500']"
           class="px-4 py-2 cursor-pointer text-xs border-r border-white/5 flex items-center gap-2">
        {{ tab.title }} <span @click.stop="store.removeTab('json', tab.id)">×</span>
      </div>
      <button @click="store.addTab('json')" class="px-3 text-slate-500">+</button>
    </div>
    <div class="h-12 flex items-center justify-between px-6 bg-[#1e1e1e] border-b border-white/5">
      <span class="text-[10px] font-bold uppercase text-slate-600">JSON Tools</span>
      <button @click="format" class="bg-blue-600 px-4 py-1 text-xs font-bold text-white rounded">Format</button>
    </div>
    <div ref="editorRef" class="flex-1"></div>
  </div>
</template>