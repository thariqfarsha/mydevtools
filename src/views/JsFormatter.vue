<script setup lang="ts">
import { ref } from 'vue';
import { js as beautifyJs } from 'js-beautify';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';

const indent = ref<'2' | '4' | 'tab'>('2');
const mangle = ref(true);
const busy = ref(false);
const editors = useTabbedEditors('js', 'javascript', () => { beautify(); });

const beautify = () =>
  editors.run((raw) => beautifyJs(raw, {
    indent_size: indent.value === 'tab' ? 1 : Number(indent.value),
    indent_char: indent.value === 'tab' ? '\t' : ' ',
    preserve_newlines: true,
    max_preserve_newlines: 2,
    space_after_anon_function: true,
  }), 'JavaScript error');

// Terser is large, so it is only loaded the first time someone minifies.
const minify = async () => {
  busy.value = true;
  try {
    const { minify: terserMinify } = await import('terser');
    const result = await terserMinify(editors.getInput(), {
      compress: true,
      mangle: mangle.value,
      format: { comments: false },
    });
    editors.setOutput(result.code ?? '');
    editors.error.value = '';
  } catch (e) {
    const err = e as Error & { line?: number; col?: number };
    editors.error.value = `JavaScript error: ${err.message}${err.line ? ` (line ${err.line}, column ${(err.col ?? 0) + 1})` : ''}`;
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <EditorToolLayout tool="js" :editors="editors">
    <template #actions>
      <button @click="minify" :disabled="busy" class="btn-secondary">{{ busy ? 'Minifying…' : 'Minify' }}</button>
      <button @click="beautify" class="btn-primary">Beautify</button>
    </template>
    <template #options>
      <button class="chip font-sans" :aria-pressed="mangle" @click="mangle = !mangle"
              title="When minifying, shorten local variable names">Mangle names</button>
      <span class="text-subtle">Indent</span>
      <div class="segmented">
        <button v-for="opt in (['2', '4', 'tab'] as const)" :key="opt" :aria-pressed="indent === opt" @click="indent = opt">
          {{ opt === 'tab' ? 'Tab' : opt }}
        </button>
      </div>
    </template>
  </EditorToolLayout>
</template>
