<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useMonaco } from '../composables/useMonaco';
import { copyText } from '../composables/useToast';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import WrapToggle from '../components/WrapToggle.vue';
import Icon from '../components/Icon.vue';
import { createUlidFactory, idTimestamp, uuidV4, uuidV7 } from '../utils/ids';
import { formatLocalDate } from '../utils/format';

type Kind = 'v4' | 'v7' | 'ulid';

const KINDS: { value: Kind; label: string; description: string }[] = [
  { value: 'v4', label: 'UUID v4', description: 'Fully random. The default choice for most IDs.' },
  { value: 'v7', label: 'UUID v7', description: 'Starts with a millisecond timestamp, so IDs sort by creation time. Good for database keys.' },
  { value: 'ulid', label: 'ULID', description: '26-char, time-sortable, URL-safe. Monotonic within the same millisecond.' },
];

const MAX_COUNT = 100_000;

const kind = ref<Kind>('v4');
const count = ref(10);
const uppercase = ref(false);
const hyphens = ref(true);
const braces = ref(false);
const error = ref('');
const generated = ref(0);
const inspect = ref('');

const { bindEl, editor, initEditor } = useMonaco('plaintext', '', true);

const isUuid = computed(() => kind.value !== 'ulid');
const description = computed(() => KINDS.find((k) => k.value === kind.value)!.description);

const format = (id: string) => {
  if (!isUuid.value) return id;
  let out = hyphens.value ? id : id.replace(/-/g, '');
  if (uppercase.value) out = out.toUpperCase();
  return braces.value ? `{${out}}` : out;
};

const generate = () => {
  const n = Math.min(MAX_COUNT, Math.max(1, Math.floor(Number(count.value) || 0)));
  count.value = n;
  const nextUlid = createUlidFactory();
  const make = kind.value === 'v4' ? uuidV4 : kind.value === 'v7' ? () => uuidV7() : () => nextUlid();
  const ids = Array.from({ length: n }, () => format(make()));
  editor.value?.setValue(ids.join('\n'));
  generated.value = n;
  error.value = '';
};

watch([kind, uppercase, hyphens, braces], generate);

const inspected = computed(() => {
  const value = inspect.value.trim();
  if (!value) return null;
  const ms = idTimestamp(value);
  return ms === null ? { ok: false as const } : { ok: true as const, text: `${formatLocalDate(ms)} · ${new Date(ms).toISOString()}` };
});

const copyAll = () => copyText(editor.value?.getValue() ?? '', `Copied ${generated.value.toLocaleString()} IDs`);

const download = () => {
  const blob = new Blob([editor.value?.getValue() ?? ''], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${kind.value}-${generated.value}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

onMounted(() => {
  initEditor();
  generate();
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden" @keydown.meta.enter="generate" @keydown.ctrl.enter="generate">
    <ToolHeader>
      <template #actions>
        <button class="btn-primary" @click="generate"><Icon name="refresh" :size="14" /> Generate</button>
      </template>
    </ToolHeader>

    <form class="flex shrink-0 flex-wrap items-end gap-x-6 gap-y-3 border-b border-line bg-canvas px-5 py-3.5" @submit.prevent="generate">
      <div class="flex flex-col gap-1.5">
        <span class="label">Type</span>
        <div class="segmented" role="group" aria-label="ID type">
          <button v-for="k in KINDS" :key="k.value" type="button" :aria-pressed="kind === k.value" @click="kind = k.value">{{ k.label }}</button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="label">Count</span>
        <input v-model.number="count" type="number" min="1" :max="MAX_COUNT" class="field w-24 font-mono" aria-label="Count" />
      </div>

      <div v-if="isUuid" class="flex flex-col gap-1.5">
        <span class="label">Format</span>
        <div class="flex items-center gap-1.5">
          <button type="button" class="chip font-sans" :aria-pressed="uppercase" @click="uppercase = !uppercase">Uppercase</button>
          <button type="button" class="chip font-sans" :aria-pressed="hyphens" @click="hyphens = !hyphens">Hyphens</button>
          <button type="button" class="chip" :aria-pressed="braces" @click="braces = !braces">{ }</button>
        </div>
      </div>

      <p class="max-w-xs pb-1.5 text-xs text-subtle">{{ description }}</p>
    </form>

    <section class="flex min-h-0 flex-1 flex-col bg-surface">
      <PaneHeader label="Output" :meta="generated ? `${generated.toLocaleString()} IDs` : ''">
        <WrapToggle />
        <button class="btn-icon" title="Download .txt" @click="download"><Icon name="download" :size="15" /></button>
        <button class="btn-icon" title="Copy all" @click="copyAll"><Icon name="copy" :size="15" /></button>
      </PaneHeader>
      <div class="min-h-0 flex-1" :ref="bindEl"></div>
    </section>

    <!-- Inspect an existing ID -->
    <div class="flex shrink-0 items-center gap-3 border-t border-line bg-canvas px-5 py-2.5">
      <span class="label shrink-0">Inspect</span>
      <input v-model="inspect" class="field w-96 max-w-full font-mono" placeholder="Paste a UUIDv7 or ULID to read its timestamp"
             aria-label="ID to inspect" spellcheck="false" />
      <span v-if="inspected" class="truncate text-xs" :class="inspected.ok ? 'text-fg' : 'text-subtle'">
        {{ inspected.ok ? `Created ${inspected.text}` : 'No timestamp: only UUIDv7 and ULID embed one' }}
      </span>
    </div>

    <StatusBar :error="error" :hint="`Uses crypto.getRandomValues · ${isMac ? '⌘' : 'Ctrl'}+Enter to regenerate`" />
  </div>
</template>
