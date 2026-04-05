import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useTabStore = defineStore('tabStore', () => {
  const isSidebarCollapsed = ref(false);
  const isSidebarHovered = ref(false);
  
  const activeTabId = reactive<Record<string, number>>({ json: 1, html: 2, diff: 3 });

  const tabs = reactive<any>({
    json: { 1: { id: 1, title: 'Tab 1', input: '', output: '' } },
    html: { 2: { id: 2, title: 'Tab 1', input: '', output: '' } },
    diff: { 3: { id: 3, title: 'Compare 1', original: '', modified: '' } }
  });

  const addTab = (tool: string) => {
    const id = Date.now();
    tabs[tool][id] = { id, title: `Tab ${Object.keys(tabs[tool]).length + 1}`, input: '', output: '' };
    activeTabId[tool] = id;
  };

  return { isSidebarCollapsed, isSidebarHovered, tabs, activeTabId, addTab };
});