<script setup lang="ts">
import { copyText } from '../composables/useToast';
import Icon from './Icon.vue';

withDefaults(defineProps<{
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  /** `match` highlights the row green, e.g. when a pasted checksum matches. */
  tone?: 'default' | 'match';
}>(), { mono: true, tone: 'default' });
</script>

<template>
  <div class="group flex items-center gap-4 border-b border-line px-4 py-2.5 last:border-b-0 transition-colors"
       :class="tone === 'match' ? 'bg-success/10' : ''">
    <div class="w-32 shrink-0">
      <div class="flex items-center gap-1.5 text-xs font-medium text-muted">
        {{ label }}
        <Icon v-if="tone === 'match'" name="check" :size="13" class="text-success" />
      </div>
      <div v-if="hint" class="text-[11px] text-subtle">{{ hint }}</div>
    </div>
    <div class="min-w-0 flex-1 break-all text-[13px] leading-5"
         :class="[mono ? 'font-mono' : '', value ? 'text-fg' : 'text-subtle']">
      {{ value || '—' }}
    </div>
    <button v-if="value" class="btn-icon opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            :title="`Copy ${label}`" @click="copyText(value)">
      <Icon name="copy" :size="14" />
    </button>
  </div>
</template>
