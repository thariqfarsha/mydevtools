import { ref, shallowRef, watch, onBeforeUnmount } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';

export function useMonaco(language: string, initialValue: string, isReadOnly = false) {
  const store = useTabStore();
  const editorRef = ref<HTMLElement | null>(null);
  const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const initEditor = () => {
    if (!editorRef.value) return;
    
    // Hapus instance lama jika ada (Fix stuck editor)
    if (editor.value) editor.value.dispose();

    editor.value = monaco.editor.create(editorRef.value, {
      value: initialValue,
      language: language,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      minimap: { enabled: false },
      readOnly: isReadOnly,
      wordWrap: store.wrapText ? 'on' : 'off',
      cursorStyle: 'line',
      lineNumbers: 'on',
    });

    return editor.value;
  };

  // Watcher Global untuk Word Wrap
  watch(() => store.wrapText, (newVal) => {
    editor.value?.updateOptions({ wordWrap: newVal ? 'on' : 'off' });
  });

  // Cleanup saat pindah menu agar tidak stuck
  onBeforeUnmount(() => {
    if (editor.value) {
      editor.value.dispose();
    }
  });

  return { editorRef, editor, initEditor };
}