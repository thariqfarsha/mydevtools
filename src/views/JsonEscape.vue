<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useTabStore } from '../stores/tabStore';
import { useMonaco } from '../composables/useMonaco';

const store = useTabStore();
const getTab = () => store.tabs.jsonEscape[store.activeTabId.jsonEscape];

const { editorRef: leftRef, editor: leftEditor, initEditor: initLeft } = useMonaco('plaintext', getTab().input);
const { editorRef: rightRef, editor: rightEditor, initEditor: initRight } = useMonaco('plaintext', getTab().output, true);

const wrapQuotes = ref(false);
const errorMessage = ref('');

onMounted(() => {
  if (leftRef.value && rightRef.value) {
    initLeft();
    initRight();
  }
  leftEditor.value?.onDidChangeModelContent(() => {
    getTab().input = leftEditor.value?.getValue() || '';
  });
});

watch(() => store.activeTabId.jsonEscape, () => {
  leftEditor.value?.setValue(getTab().input);
  rightEditor.value?.setValue(getTab().output);
  errorMessage.value = '';
});

const escapeJson = (raw: string) => {
  const quoted = JSON.stringify(raw);
  return wrapQuotes.value ? quoted : quoted.slice(1, -1);
};

const unescapeJson = (raw: string) => {
  const trimmed = raw.trim();
  // Accept either a full JSON string literal ("...") or just its inner content.
  const literal = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
    ? trimmed
    : `"${raw}"`;
  const result = JSON.parse(literal);
  if (typeof result !== 'string') throw new Error('Input is not a JSON string');
  return result;
};

const process = (mode: 'escape' | 'unescape') => {
  const raw = leftEditor.value?.getValue() || '';
  try {
    const res = mode === 'escape' ? escapeJson(raw) : unescapeJson(raw);
    rightEditor.value?.setValue(res);
    getTab().output = res;
    errorMessage.value = '';
  } catch (e) {
    errorMessage.value = `Unescape failed: ${(e as Error).message}`;
  }
};

const swap = () => {
  const out = rightEditor.value?.getValue() || '';
  leftEditor.value?.setValue(out);
  rightEditor.value?.setValue('');
  getTab().output = '';
};

const copyOutput = () => {
  navigator.clipboard?.writeText(rightEditor.value?.getValue() || '');
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex bg-[#252526] border-b border-white/5">
      <div v-for="tab in store.tabs.jsonEscape" :key="tab.id"
           @click="store.activeTabId.jsonEscape = tab.id"
           :class="[store.activeTabId.jsonEscape === tab.id ? 'bg-[#1e1e1e] border-t-2 border-blue-600 text-white' : 'text-slate-500 hover:bg-white/5']"
           class="px-4 py-2 cursor-pointer text-xs border-r border-white/5 flex items-center gap-2 select-none group">
        {{ tab.title }}
        <span @click.stop="store.removeTab('jsonEscape', tab.id)" class="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">×</span>
      </div>
      <button @click="store.addTab('jsonEscape')" class="px-3 text-slate-500 hover:text-white cursor-pointer">+</button>
    </div>

    <div class="h-12 flex items-center justify-between px-6 bg-[#1e1e1e] border-b border-white/5 font-sans">
      <div class="flex items-center gap-4">
        <button @click="store.wrapText = !store.wrapText" class="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer uppercase font-bold transition-colors">
          Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
        </button>
        <label class="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
          <input type="checkbox" v-model="wrapQuotes" class="accent-blue-600" />
          Add surrounding quotes on escape
        </label>
        <span v-if="errorMessage" class="text-[11px] text-red-400">{{ errorMessage }}</span>
      </div>
      <div class="flex gap-2">
        <button @click="swap" class="bg-white/5 text-slate-300 border border-white/10 px-3 py-1 text-xs font-bold rounded cursor-pointer hover:bg-white/10" title="Move output to input">⇄ Swap</button>
        <button @click="copyOutput" class="bg-white/5 text-slate-300 border border-white/10 px-3 py-1 text-xs font-bold rounded cursor-pointer hover:bg-white/10">Copy</button>
        <button @click="process('unescape')" class="bg-orange-600/20 text-orange-400 border border-orange-600/30 px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-orange-600/30">Unescape</button>
        <button @click="process('escape')" class="bg-blue-600 text-white px-4 py-1 text-xs font-bold rounded cursor-pointer hover:bg-blue-500 shadow-lg">Escape</button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 border-r border-white/5" ref="leftRef"></div>
      <div class="flex-1" ref="rightRef"></div>
    </div>
  </div>
</template>
