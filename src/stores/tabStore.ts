import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export type EditorToolId = 'json' | 'jsonEscape' | 'html' | 'sql';

export interface EditorTab {
  id: number;
  title: string;
  input: string;
  output: string;
}

const EDITOR_TOOLS: EditorToolId[] = ['json', 'jsonEscape', 'html', 'sql'];

export const useTabStore = defineStore('tabStore', () => {
  const isLocked = ref(true);
  const isHovered = ref(false);
  const wrapText = ref(true);

  let nextId = 1;
  const newTab = (number: number): EditorTab => ({ id: nextId++, title: `Tab ${number}`, input: '', output: '' });

  const tabs = reactive({} as Record<EditorToolId, Record<number, EditorTab>>);
  const activeTabId = reactive({} as Record<EditorToolId, number>);
  // Running counter per tool so titles never repeat after a tab is closed.
  const tabCounter = reactive({} as Record<EditorToolId, number>);

  for (const tool of EDITOR_TOOLS) {
    const tab = newTab(1);
    tabs[tool] = { [tab.id]: tab };
    activeTabId[tool] = tab.id;
    tabCounter[tool] = 1;
  }

  const diff = reactive({ original: '', modified: '' });

  const addTab = (tool: EditorToolId) => {
    tabCounter[tool] += 1;
    const tab = newTab(tabCounter[tool]);
    tabs[tool][tab.id] = tab;
    activeTabId[tool] = tab.id;
  };

  const removeTab = (tool: EditorToolId, id: number) => {
    const ids = Object.keys(tabs[tool]).map(Number);
    if (ids.length <= 1) return;

    const index = ids.indexOf(id);
    delete tabs[tool][id];

    // Only move the selection when the closed tab was the active one; pick its neighbour.
    if (activeTabId[tool] === id) {
      const remaining = ids.filter((tabId) => tabId !== id);
      activeTabId[tool] = remaining[Math.min(index, remaining.length - 1)];
    }
  };

  return { isLocked, isHovered, wrapText, tabs, activeTabId, diff, addTab, removeTab };
});
