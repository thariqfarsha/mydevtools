<script setup lang="ts">
import Icon from './Icon.vue';

defineProps<{ error?: string; hint?: string }>();
</script>

<template>
  <footer class="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-line bg-canvas px-4 text-[11px] text-subtle">
    <div class="flex min-w-0 items-center gap-2">
      <template v-if="error">
        <span class="size-1.5 shrink-0 rounded-full bg-danger"></span>
        <span class="truncate text-danger" :title="error">{{ error }}</span>
      </template>
      <template v-else>
        <span class="size-1.5 shrink-0 rounded-full bg-success/70"></span>
        <span class="truncate">{{ hint ?? 'Ready' }}</span>
      </template>
    </div>
    <div class="flex shrink-0 items-center gap-4">
      <slot />
      <span class="flex items-center gap-1" title="All processing happens in this browser tab. Nothing is uploaded.">
        <Icon name="shield" :size="12" /> Local only
      </span>
    </div>
  </footer>
</template>
