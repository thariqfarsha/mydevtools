<script setup lang="ts">
import { useTabStore } from '../stores/tabStore';
const store = useTabStore();
</script>

<template>
  <button @click="store.wrapText = !store.wrapText" class="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer uppercase font-bold transition-colors">
    Wrap: {{ store.wrapText ? 'ON' : 'OFF' }}
  </button>
</template>
