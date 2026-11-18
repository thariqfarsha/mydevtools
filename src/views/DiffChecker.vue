<script setup lang="ts">
import { onMounted, ref, shallowRef, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';
import { baseEditorOptions, ensureEditorTheme } from '../composables/useMonaco';
import ToolHeader from '../components/ToolHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import WrapToggle from '../components/WrapToggle.vue';
import Icon from '../components/Icon.vue';

const store = useTabStore();
const diffContainer = ref<HTMLElement | null>(null);
const diffEditor = shallowRef<monaco.editor.IDiffEditor | null>(null);
const sideBySide = ref(true);
const changeCount = ref(0);
let original: monaco.editor.ITextModel | null = null;
let modified: monaco.editor.ITextModel | null = null;

onMounted(() => {
  if (!diffContainer.value) return;
  ensureEditorTheme();

  diffEditor.value = monaco.editor.createDiffEditor(diffContainer.value, {
    ...baseEditorOptions(),
    automaticLayout: true,
    originalEditable: true,
    renderSideBySide: sideBySide.value,
    renderOverviewRuler: false,
    wordWrap: store.wrapText ? 'on' : 'off',
  });

  original = monaco.editor.createModel(store.diff.original, 'plaintext');
  modified = monaco.editor.createModel(store.diff.modified, 'plaintext');
  diffEditor.value.setModel({ original, modified });

  original.onDidChangeContent(() => (store.diff.original = original!.getValue()));
  modified.onDidChangeContent(() => (store.diff.modified = modified!.getValue()));
  diffEditor.value.onDidUpdateDiff(() => {
    changeCount.value = diffEditor.value?.getLineChanges()?.length ?? 0;
  });
});

watch(() => store.wrapText, (val) => {
  diffEditor.value?.updateOptions({ wordWrap: val ? 'on' : 'off' });
});

watch(sideBySide, (val) => diffEditor.value?.updateOptions({ renderSideBySide: val }));

const swap = () => {
  if (!original || !modified) return;
  const left = original.getValue();
  original.setValue(modified.getValue());
  modified.setValue(left);
};

const clear = () => {
  original?.setValue('');
  modified?.setValue('');
};

onBeforeUnmount(() => {
  // Dispose the editor and its models so nothing leaks between visits.
  diffEditor.value?.dispose();
  original?.dispose();
  modified?.dispose();
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <div class="segmented" role="group" aria-label="View">
          <button :aria-pressed="sideBySide" @click="sideBySide = true">Split</button>
          <button :aria-pressed="!sideBySide" @click="sideBySide = false">Inline</button>
        </div>
        <button class="btn-secondary" @click="swap"><Icon name="swap" :size="14" /> Swap</button>
        <button class="btn-ghost" @click="clear"><Icon name="trash" :size="14" /> Clear</button>
      </template>
    </ToolHeader>

    <div class="flex h-9 shrink-0 items-center border-b border-line bg-surface pr-1.5">
      <template v-if="sideBySide">
        <span class="label flex-1 pl-4">Original</span>
        <span class="label flex-1 pl-4">Modified</span>
      </template>
      <span v-else class="label flex-1 pl-4">Original → Modified</span>
      <WrapToggle />
    </div>

    <div ref="diffContainer" class="min-h-0 flex-1"></div>

    <StatusBar :hint="store.diff.original || store.diff.modified
      ? (changeCount ? `${changeCount} ${changeCount === 1 ? 'change' : 'changes'}` : 'No differences')
      : 'Type or paste text on both sides'" />
  </div>
</template>
