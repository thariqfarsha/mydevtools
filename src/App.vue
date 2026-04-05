<script setup lang="ts">
import { useTabStore } from './stores/tabStore';
const store = useTabStore();
</script>

<template>
  <div class="flex h-screen bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden">
    <aside :class="[store.isSidebarCollapsed ? 'w-16' : 'w-64', 'bg-[#252526] border-r border-white/5 flex flex-col transition-all duration-300']">
      <div class="p-4 border-b border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 min-w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold italic">D</div>
          <h1 v-if="!store.isSidebarCollapsed" class="font-bold text-white whitespace-nowrap">MyDevTools</h1>
        </div>
        <button @click="store.isSidebarCollapsed = !store.isSidebarCollapsed" class="text-slate-500">☰</button>
      </div>
      <nav class="flex-1 p-3 space-y-2">
        <router-link to="/json" class="nav-link" active-class="nav-active">JSON</router-link>
        <!-- <router-link to="/html" class="nav-link" active-class="nav-active">HTML</router-link>
        <router-link to="/base64" class="nav-link" active-class="nav-active">Base64</router-link> -->
      </nav>
    </aside>
    <main class="flex-1 flex flex-col min-w-0"><router-view /></main>
  </div>
</template>