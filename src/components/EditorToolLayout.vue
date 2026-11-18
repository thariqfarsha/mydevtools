<script setup lang="ts">
import { useTabStore, type EditorToolId } from '../stores/tabStore';
import { formatStats, type TabbedEditors } from '../composables/useTabbedEditors';
import ToolHeader from './ToolHeader.vue';
import PaneHeader from './PaneHeader.vue';
import StatusBar from './StatusBar.vue';
import WrapToggle from './WrapToggle.vue';
import Icon from './Icon.vue';

withDefaults(defineProps<{
  tool: EditorToolId;
  editors: TabbedEditors;
  inputLabel?: string;
  outputLabel?: string;
}>(), { inputLabel: 'Input', outputLabel: 'Output' });

const store = useTabStore();
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions><slot name="actions" /></template>
    </ToolHeader>

    <!-- Tabs + tool options -->
    <div class="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas px-3">
      <div class="flex min-w-0 items-center gap-1 overflow-x-auto">
        <div v-for="tab in store.tabs[tool]" :key="tab.id"
             role="tab"
             :aria-selected="store.activeTabId[tool] === tab.id"
             @click="store.activeTabId[tool] = tab.id"
             :class="store.activeTabId[tool] === tab.id
               ? 'bg-raised text-fg border-line-strong'
               : 'text-subtle border-transparent hover:text-muted hover:bg-raised/60'"
             class="group flex h-7 shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-md border pl-3 pr-1 text-xs transition-colors">
          <span v-if="store.activeTabId[tool] === tab.id" class="size-1.5 shrink-0 rounded-full bg-highlight"></span>
          <span class="max-w-28 truncate">{{ tab.title }}</span>
          <button v-if="Object.keys(store.tabs[tool]).length > 1"
                  @click.stop="store.removeTab(tool, tab.id)"
                  class="flex size-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-hover hover:text-fg group-hover:opacity-100"
                  title="Close tab">
            <Icon name="x" :size="11" />
          </button>
          <span v-else class="w-1"></span>
        </div>
        <button @click="store.addTab(tool)" class="btn-icon" title="New tab">
          <Icon name="plus" :size="14" />
        </button>
      </div>
      <div class="flex shrink-0 items-center gap-3 text-xs text-muted">
        <slot name="options" />
        <WrapToggle />
      </div>
    </div>

    <!-- Editors -->
    <div class="grid min-h-0 flex-1 grid-cols-2 gap-px bg-line">
      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader :label="inputLabel" :meta="formatStats(editors.stats.input)">
          <button class="btn-icon" title="Paste from clipboard" @click="editors.pasteInput"><Icon name="paste" :size="15" /></button>
          <button class="btn-icon" title="Clear" @click="editors.clearAll"><Icon name="trash" :size="15" /></button>
        </PaneHeader>
        <div class="min-h-0 flex-1" :ref="editors.bindInput"></div>
      </section>
      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader :label="outputLabel" :meta="formatStats(editors.stats.output)">
          <slot name="output-actions" />
          <button class="btn-icon" title="Copy output" @click="editors.copyOutput"><Icon name="copy" :size="15" /></button>
        </PaneHeader>
        <div class="min-h-0 flex-1" :ref="editors.bindOutput"></div>
      </section>
    </div>

    <StatusBar :error="editors.error.value" :hint="`Ready · ${isMac ? '⌘' : 'Ctrl'}+Enter to run`" />
  </div>
</template>
