import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useTabStore = defineStore('tabStore', () => {
  const isSidebarCollapsed = ref(false);
  const activeTabId = reactive<Record<string, number>>({ json: 1, html: 2, base64: 3 });
  const tabs = reactive<any>({
    json: { 1: { id: 1, title: 'Tab 1', content: '{\n  "status": "ready"\n}' } },
    html: { 2: { id: 2, title: 'Tab 1', content: '\n<div></div>' } },
    base64: { 3: { id: 3, title: 'Tab 1', content: '' } }
  });

  const addTab = (tool: string) => {
    const id = Date.now();
    tabs[tool][id] = { id, title: `Tab ${Object.keys(tabs[tool]).length + 1}`, content: '' };
    activeTabId[tool] = id;
  };

  const removeTab = (tool: string, id: number) => {
    if (Object.keys(tabs[tool]).length > 1) {
      delete tabs[tool][id];
      activeTabId[tool] = Number(Object.keys(tabs[tool])[0]);
    }
  };

  return { isSidebarCollapsed, tabs, activeTabId, addTab, removeTab };
});