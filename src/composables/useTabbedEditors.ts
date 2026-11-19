import { onMounted, reactive, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore, type EditorToolId } from '../stores/tabStore';
import { useMonaco } from './useMonaco';
import { copyText, readClipboard } from './useToast';

interface TextStats {
  lines: number;
  chars: number;
}

const statsOf = (text: string): TextStats => ({
  lines: text ? text.split('\n').length : 0,
  chars: text.length,
});

export const formatStats = ({ lines, chars }: TextStats) =>
  chars ? `${lines.toLocaleString()} ${lines === 1 ? 'line' : 'lines'} · ${chars.toLocaleString()} chars` : 'empty';

/**
 * Input/output editor pair bound to a tool's tabs in the store. Pass the result to
 * <EditorToolLayout :editors="...">, which hosts the editors and pane actions.
 *
 * @param onSubmit run when the user presses Cmd/Ctrl+Enter in the input editor.
 */
export function useTabbedEditors(tool: EditorToolId, language: string, onSubmit?: () => void) {
  const store = useTabStore();
  const getTab = () => store.tabs[tool][store.activeTabId[tool]];

  const input = useMonaco(language, getTab().input);
  const output = useMonaco(language, getTab().output, true);
  const error = ref('');
  const stats = reactive({ input: statsOf(getTab().input), output: statsOf(getTab().output) });

  onMounted(() => {
    input.initEditor();
    output.initEditor();
    input.editor.value?.onDidChangeModelContent(() => {
      const value = input.editor.value?.getValue() ?? '';
      getTab().input = value;
      stats.input = statsOf(value);
    });
    if (onSubmit) {
      input.editor.value?.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onSubmit);
    }
    input.editor.value?.focus();
  });

  watch(() => store.activeTabId[tool], () => {
    input.editor.value?.setValue(getTab().input);
    output.editor.value?.setValue(getTab().output);
    stats.output = statsOf(getTab().output);
    error.value = '';
  });

  const getInput = () => input.editor.value?.getValue() ?? '';
  const getOutput = () => output.editor.value?.getValue() ?? '';
  const setInput = (value: string) => input.editor.value?.setValue(value);

  const setOutput = (value: string) => {
    output.editor.value?.setValue(value);
    getTab().output = value;
    stats.output = statsOf(value);
  };

  /** Run a transform on the input; show its result, or its error message in the status bar. */
  const run = (transform: (raw: string) => string, errorPrefix = 'Error') => {
    try {
      setOutput(transform(getInput()));
      error.value = '';
    } catch (e) {
      error.value = `${errorPrefix}: ${(e as Error).message}`;
    }
  };

  const pasteInput = async () => {
    const text = await readClipboard();
    if (text !== null) setInput(text);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    error.value = '';
    input.editor.value?.focus();
  };

  const copyOutput = () => copyText(getOutput());

  /** Switch syntax highlighting, e.g. when a converter changes its input or output format. */
  const setLanguages = (inputLanguage: string, outputLanguage = inputLanguage) => {
    const inModel = input.editor.value?.getModel();
    const outModel = output.editor.value?.getModel();
    if (inModel) monaco.editor.setModelLanguage(inModel, inputLanguage);
    if (outModel) monaco.editor.setModelLanguage(outModel, outputLanguage);
  };

  return {
    bindInput: input.bindEl,
    bindOutput: output.bindEl,
    error,
    stats,
    getInput,
    getOutput,
    setInput,
    setOutput,
    run,
    pasteInput,
    clearAll,
    copyOutput,
    setLanguages,
  };
}

export type TabbedEditors = ReturnType<typeof useTabbedEditors>;
