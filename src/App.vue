<script setup lang="ts">
import { useTabStore } from './stores/tabStore';
const store = useTabStore();

const menu = [
  { 
    path: '/json', 
    label: 'JSON Formatter', 
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7m-16 0V5a2 2 0 012-2h8a2 2 0 012 2v2M4 7h16" /></svg>' 
  },
  { 
    path: '/html', 
    label: 'HTML Formatter', 
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>' 
  },
  { 
    path: '/diff', 
    label: 'Diff Checker', 
    icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m0 0l-4-4m4 4l-4 4m0 6H8m0 0l4 4m-4-4l4-4" /></svg>' 
  }
];
</script>

<template>
  <div class="flex h-screen bg-[#1e1e1e] text-slate-300 overflow-hidden font-sans">
    <aside 
      @mouseenter="store.isSidebarHovered = true"
      @mouseleave="store.isSidebarHovered = false"
      :class="[
        (store.isSidebarCollapsed && !store.isSidebarHovered) ? 'w-16' : 'w-64', 
        'bg-[#252526] border-r border-white/5 flex flex-col transition-all duration-300 z-50 shadow-xl'
      ]"
    >
      <div class="p-4 h-14 border-b border-white/5 flex items-center justify-between overflow-hidden">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 min-w-[32px] bg-blue-600 rounded flex items-center justify-center text-white font-bold italic shadow-lg shadow-blue-900/20">D</div>
          <h1 v-show="!store.isSidebarCollapsed || store.isSidebarHovered" class="font-bold text-white whitespace-nowrap uppercase tracking-tighter text-sm">DevTools Pro</h1>
        </div>
        <button @click="store.isSidebarCollapsed = !store.isSidebarCollapsed" class="text-slate-500 hover:text-white transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <nav class="flex-1 p-3 space-y-2">
        <router-link 
          v-for="item in menu" 
          :key="item.path" 
          :to="item.path" 
          class="flex items-center gap-3 px-2 py-2.5 rounded-md transition-all group"
          :class="[$route.path === item.path ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-white/5']"
        >
          <div 
            class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md transition-colors"
            :class="[$route.path === item.path ? 'bg-blue-600 text-white' : 'bg-white/5 group-hover:bg-blue-600/20 group-hover:text-blue-400']"
            v-html="item.icon"
          ></div>
          <span v-show="!store.isSidebarCollapsed || store.isSidebarHovered" class="whitespace-nowrap text-sm font-medium">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 relative">
      <router-view />
    </main>
  </div>
</template>