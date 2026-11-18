<script setup lang="ts">
import { useTabStore } from '../stores/tabStore';
import Icon from './Icon.vue';

const store = useTabStore();
</script>

<template>
  <button
    class="btn-icon"
    :aria-pressed="store.wrapText"
    :title="store.wrapText ? 'Word wrap: on' : 'Word wrap: off'"
    @click="store.wrapText = !store.wrapText"
  >
    <Icon name="wrap" />
  </button>
</template>
