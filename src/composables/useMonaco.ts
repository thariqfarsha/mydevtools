import { shallowRef, watch, onBeforeUnmount } from 'vue';
import * as monaco from 'monaco-editor';
import { useTabStore } from '../stores/tabStore';
import { resolvedTheme } from './useTheme';

const EDITOR_THEMES = { dark: 'devtools-dark', light: 'devtools-light' } as const;
let themesDefined = false;

/** Monaco themes matching the app's design tokens (see style.css). */
export function ensureEditorTheme() {
  if (themesDefined) return;
  monaco.editor.defineTheme(EDITOR_THEMES.dark, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#151518',
      'editorGutter.background': '#151518',
      'editor.lineHighlightBackground': '#1b1b1f',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#45454d',
      'editorLineNumber.activeForeground': '#a1a1aa',
      'editor.selectionBackground': '#164e63',
      'editor.inactiveSelectionBackground': '#164e6380',
      'editorCursor.foreground': '#22bcd0',
      'editorIndentGuide.background1': '#26262b',
      'editorIndentGuide.activeBackground1': '#34343b',
      'editorWidget.background': '#1b1b1f',
      'editorWidget.border': '#26262b',
      'editorOverviewRuler.border': '#00000000',
      'scrollbarSlider.background': '#ffffff12',
      'scrollbarSlider.hoverBackground': '#ffffff20',
      'scrollbarSlider.activeBackground': '#ffffff2a',
      'focusBorder': '#00000000',
      'diffEditor.insertedTextBackground': '#22c55e2e',
      'diffEditor.removedTextBackground': '#ef44442e',
      'diffEditor.insertedLineBackground': '#22c55e14',
      'diffEditor.removedLineBackground': '#ef444414',
      'diffEditor.diagonalFill': '#26262b',
    },
  });
  monaco.editor.defineTheme(EDITOR_THEMES.light, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editorGutter.background': '#ffffff',
      'editor.lineHighlightBackground': '#f6f6f7',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#b4b4bb',
      'editorLineNumber.activeForeground': '#52525b',
      'editor.selectionBackground': '#cdf3f9',
      'editor.inactiveSelectionBackground': '#e4f8fb',
      'editorCursor.foreground': '#0e7490',
      'editorIndentGuide.background1': '#ececef',
      'editorIndentGuide.activeBackground1': '#d4d4d8',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e4e4e7',
      'editorOverviewRuler.border': '#00000000',
      'scrollbarSlider.background': '#00000014',
      'scrollbarSlider.hoverBackground': '#00000024',
      'scrollbarSlider.activeBackground': '#00000030',
      'focusBorder': '#00000000',
      'diffEditor.insertedTextBackground': '#16a34a26',
      'diffEditor.removedTextBackground': '#dc262622',
      'diffEditor.insertedLineBackground': '#16a34a10',
      'diffEditor.removedLineBackground': '#dc26260d',
      'diffEditor.diagonalFill': '#e4e4e7',
    },
  });
  themesDefined = true;
}

const currentEditorTheme = () => EDITOR_THEMES[resolvedTheme.value];

// Monaco themes are global: switching once restyles every open editor.
watch(resolvedTheme, () => {
  if (themesDefined) monaco.editor.setTheme(currentEditorTheme());
});

/** Shared look for every editor in the app. */
export const baseEditorOptions = (): monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions => ({
  theme: currentEditorTheme(),
  fontFamily: "'SF Mono', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace",
  fontSize: 13,
  lineHeight: 20,
  padding: { top: 12, bottom: 12 },
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line',
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
  lineNumbersMinChars: 3,
  smoothScrolling: true,
});

/**
 * One Monaco editor. Bind its host element with `:ref="bindEl"`
 * (a function ref, so the element may live in a child component's template).
 */
export function useMonaco(language: string, initialValue: string, isReadOnly = false) {
  const store = useTabStore();
  const el = shallowRef<HTMLElement | null>(null);
  const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const bindEl = (node: unknown) => {
    el.value = (node as HTMLElement | null) ?? null;
  };

  const initEditor = () => {
    if (!el.value) return;

    // Dispose any previous instance so the editor never gets stuck.
    if (editor.value) editor.value.dispose();
    ensureEditorTheme();

    editor.value = monaco.editor.create(el.value, {
      ...baseEditorOptions(),
      value: initialValue,
      language,
      automaticLayout: true,
      readOnly: isReadOnly,
      domReadOnly: isReadOnly,
      wordWrap: store.wrapText ? 'on' : 'off',
    });

    return editor.value;
  };

  // Global word-wrap setting.
  watch(() => store.wrapText, (wrap) => {
    editor.value?.updateOptions({ wordWrap: wrap ? 'on' : 'off' });
  });

  // Clean up when leaving the view so editors don't get stuck.
  onBeforeUnmount(() => editor.value?.dispose());

  return { el, bindEl, editor, initEditor };
}
