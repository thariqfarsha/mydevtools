<script setup lang="ts">
defineProps<{ label: string; meta?: string }>();
</script>

<template>
  <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface pl-4 pr-1.5">
    <div class="flex min-w-0 items-baseline gap-2">
      <span class="label">{{ label }}</span>
      <span v-if="meta" class="truncate text-[11px] text-subtle">{{ meta }}</span>
    </div>
    <div class="flex items-center gap-0.5">
      <slot />
    </div>
  </div>
</template>
