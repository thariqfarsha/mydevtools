import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useTabStore = defineStore('tabStore', () => {
  const isLocked = ref(true);
  const isHovered = ref(false);
  const wrapText = ref(true);
  
  const activeTabId = reactive<Record<string, number>>({ json: 1, html: 2, sql: 3 });

  const tabs = reactive<any>({
    json: { 1: { id: 1, title: 'Tab 1', input: '', output: '' } },
    html: { 2: { id: 2, title: 'Tab 1', input: '', output: '' } },
    sql: { 3: { id: 3, title: 'Tab 1', input: '', output: '' } },
    diff: { original: '', modified: '' }
  });

  const addTab = (tool: string) => {
    const id = Date.now();
    tabs[tool][id] = { id, title: `Tab ${Object.keys(tabs[tool]).length + 1}`, input: '', output: '' };
    activeTabId[tool] = id;
  };

  const removeTab = (tool: string, id: number) => {
    const keys = Object.keys(tabs[tool]);
    if (keys.length > 1) {
      delete tabs[tool][id];
      activeTabId[tool] = Number(Object.keys(tabs[tool])[0]);
    }
  };

  return { isLocked, isHovered, wrapText, tabs, activeTabId, addTab, removeTab };
});