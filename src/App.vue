<script setup lang="ts">
import { useTabStore } from './stores/tabStore';
const store = useTabStore();
const menu = [
  { path: '/json', label: 'JSON Formatter', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7m-16 0V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7h16" /></svg>' },
  { path: '/html', label: 'HTML Formatter', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>' },
  { path: '/sql', label: 'SQL Formatter', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7m-16 0V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7h16" /></svg>' },
  { path: '/diff', label: 'Diff Checker', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h8m0 0l-4-4m4 4l-4 4m0 6H8m0 0l4 4m-4-4l4-4" /></svg>' },
];
</script>

<template>
  <div class="flex h-screen bg-[#1e1e1e] text-slate-300 overflow-hidden font-sans">
    <aside 
      @mouseenter="store.isHovered = true"
      @mouseleave="store.isHovered = false"
      :class="[
        (store.isLocked || store.isHovered) ? 'w-64' : 'w-16', 
        'bg-[#252526] border-r border-white/5 flex flex-col transition-all duration-300 z-50 shadow-2xl'
      ]"
    >
      <div class="p-4 h-14 border-b border-white/5 flex items-center justify-between overflow-hidden">
        <div class="flex items-center gap-3 min-w-0">
          <!-- <div class="w-8 h-8 min-w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold italic shadow-lg">D</div> -->
          <h1 v-show="store.isLocked || store.isHovered" class="font-bold text-white whitespace-nowrap uppercase tracking-tighter text-sm truncate">My DevTools</h1>
        </div>
        
        <button 
          @click="store.isLocked = !store.isLocked" 
          :class="[store.isLocked ? 'text-blue-400' : 'text-slate-500']"
          class="hover:bg-white/5 p-1 rounded transition-colors cursor-pointer"
        >
          <svg v-if="store.isLocked" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
        </button>
      </div>

      <nav class="flex-1 p-2 space-y-1">
        <router-link 
          v-for="item in menu" 
          :key="item.path" :to="item.path" 
          class="flex items-center h-10 rounded-md transition-all group overflow-hidden"
          :class="[
            $route.path === item.path ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5',
            (store.isLocked || store.isHovered) ? 'px-3 gap-3' : 'justify-center px-0'
          ]"
        >
          <div 
            class="w-8 h-8 shrink-0 flex items-center justify-center rounded-md transition-colors"
            :class="[$route.path === item.path ? 'bg-blue-600 text-white' : 'bg-white/5 group-hover:text-white']"
            v-html="item.icon"
          ></div>
          <span v-show="store.isLocked || store.isHovered" class="whitespace-nowrap text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <main class="flex-1 min-w-0"><router-view /></main>
  </div>
</template>