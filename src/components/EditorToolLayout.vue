<script setup lang="ts">
import { useTabStore, type EditorToolId } from '../stores/tabStore';
import WrapToggle from './WrapToggle.vue';

defineProps<{ tool: EditorToolId; error?: string }>();
const store = useTabStore();
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex bg-[#252526] border-b border-white/5">
      <div v-for="tab in store.tabs[tool]" :key="tab.id"
           @click="store.activeTabId[tool] = tab.id"
           :class="[store.activeTabId[tool] === tab.id ? 'bg-[#1e1e1e] border-t-2 border-blue-600 text-white' : 'text-slate-500 hover:bg-white/5']"
           class="px-4 py-2 cursor-pointer text-xs border-r border-white/5 flex items-center gap-2 select-none group">
        <span class="truncate max-w-25">{{ tab.title }}</span>
        <span @click.stop="store.removeTab(tool, tab.id)" class="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">×</span>
      </div>
      <button @click="store.addTab(tool)" class="px-3 text-slate-500 hover:text-white cursor-pointer">+</button>
    </div>

    <div class="h-12 flex items-center justify-between gap-4 px-6 bg-[#1e1e1e] border-b border-white/5 font-sans">
      <div class="flex items-center gap-4 min-w-0">
        <WrapToggle />
        <slot name="options" />
        <span v-if="error" class="text-[11px] text-red-400 truncate" :title="error">{{ error }}</span>
      </div>
      <div class="flex gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <!-- Editor panes come from the view so their template refs stay in the view's scope. -->
    <div class="flex-1 flex overflow-hidden bg-[#1e1e1e]">
      <slot />
    </div>
  </div>
</template>
