import { ref } from 'vue';

export interface Toast {
  id: number;
  text: string;
  tone: 'default' | 'error';
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function toast(text: string, tone: Toast['tone'] = 'default') {
  const item = { id: ++nextId, text, tone };
  toasts.value.push(item);
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== item.id);
  }, 1800);
}

export const useToasts = () => toasts;

export async function copyText(text: string, message = 'Copied to clipboard') {
  if (!text) {
    toast('Nothing to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('Clipboard access was blocked', 'error');
  }
}

export async function readClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    toast('Clipboard access was blocked', 'error');
    return null;
  }
}
