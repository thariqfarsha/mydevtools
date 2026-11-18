import { onMounted, ref, watch } from 'vue';
import { useTabStore, type EditorToolId } from '../stores/tabStore';
import { useMonaco } from './useMonaco';

/**
 * Input/output editor pair bound to a tool's tabs in the store.
 * Bind the editors in the template with `ref="input"` and `ref="output"`.
 * Handles editor init, syncing input to the active tab, and swapping content on tab change.
 */
export function useTabbedEditors(tool: EditorToolId, language: string) {
  const store = useTabStore();
  const getTab = () => store.tabs[tool][store.activeTabId[tool]];

  const input = useMonaco('input', language, getTab().input);
  const output = useMonaco('output', language, getTab().output, true);
  const error = ref('');

  onMounted(() => {
    input.initEditor();
    output.initEditor();
    input.editor.value?.onDidChangeModelContent(() => {
      getTab().input = input.editor.value?.getValue() ?? '';
    });
  });

  watch(() => store.activeTabId[tool], () => {
    input.editor.value?.setValue(getTab().input);
    output.editor.value?.setValue(getTab().output);
    error.value = '';
  });

  const getInput = () => input.editor.value?.getValue() ?? '';
  const getOutput = () => output.editor.value?.getValue() ?? '';
  const setInput = (value: string) => input.editor.value?.setValue(value);

  const setOutput = (value: string) => {
    output.editor.value?.setValue(value);
    getTab().output = value;
  };

  /** Run a transform on the input; show its result, or its error message in the toolbar. */
  const run = (transform: (raw: string) => string, errorPrefix = 'Error') => {
    try {
      setOutput(transform(getInput()));
      error.value = '';
    } catch (e) {
      error.value = `${errorPrefix}: ${(e as Error).message}`;
    }
  };

  return {
    error,
    getInput,
    getOutput,
    setInput,
    setOutput,
    run,
  };
}
