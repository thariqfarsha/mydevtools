<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { tools } from '../tools';

const route = useRoute();
const tool = computed(() => tools.find((t) => t.path === route.path));
</script>

<template>
  <header class="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-canvas px-5 py-2.5">
    <div class="min-w-0">
      <h1 class="truncate text-[15px] font-semibold text-fg">{{ tool?.label }}</h1>
      <p class="truncate text-xs text-subtle">{{ tool?.description }}</p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
