import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useTabStore = defineStore('tabStore', () => {
  const isLocked = ref(true); // Default terbuka/terkunci
  const isHovered = ref(false);
  
  const activeTabId = reactive<Record<string, number>>({ 
    json: 1, 
    html: 2, 
    diff: 3 
  });

  const tabs = reactive<any>({
    json: { 1: { id: 1, title: 'Tab 1', input: '', output: '' } },
    html: { 2: { id: 2, title: 'Tab 1', input: '', output: '' } },
    diff: { 3: { id: 3, title: 'Compare 1', original: '', modified: '' } }
  });

  return { isLocked, isHovered, tabs, activeTabId };
});