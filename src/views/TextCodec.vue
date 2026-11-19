<script setup lang="ts">
import { computed, ref } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import Icon from '../components/Icon.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';
import { base64ToBytes, bytesToBase64, toBase64Url, utf8Decode, utf8Encode } from '../utils/encoding';

type Codec = 'base64' | 'url' | 'html';

const CODECS: { value: Codec; label: string }[] = [
  { value: 'base64', label: 'Base64' },
  { value: 'url', label: 'URL' },
  { value: 'html', label: 'HTML entities' },
];

const codec = ref<Codec>('base64');
const urlSafe = ref(false);
const encodeAllHtml = ref(false);

const editors = useTabbedEditors('encode', 'plaintext', () => { process('encode'); });

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const encoders: Record<Codec, (s: string) => string> = {
  base64: (s) => {
    const b64 = bytesToBase64(utf8Encode(s));
    return urlSafe.value ? toBase64Url(b64) : b64;
  },
  url: (s) => encodeURIComponent(s),
  html: (s) => {
    const escaped = s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
    // Optionally turn every non-ASCII character into a numeric entity too.
    return encodeAllHtml.value
      ? escaped.replace(/[^\x00-\x7f]/gu, (c) => `&#x${c.codePointAt(0)!.toString(16).toUpperCase()};`)
      : escaped;
  },
};

const decoders: Record<Codec, (s: string) => string> = {
  base64: (s) => {
    try {
      return utf8Decode(base64ToBytes(s));
    } catch (e) {
      // Valid base64 but not text (e.g. an image) fails the strict UTF-8 decode.
      throw new Error(e instanceof TypeError ? 'Decoded bytes are not valid UTF-8 text' : (e as Error).message);
    }
  },
  // Treat "+" as a space, as in form-encoded query strings.
  url: (s) => decodeURIComponent(s.replace(/\+/g, ' ')),
  html: (s) => {
    // Parsing inside a <textarea> decodes entities but keeps tags as plain text and never runs scripts.
    const textarea = document.createElement('textarea');
    textarea.innerHTML = s;
    return textarea.value;
  },
};

const label = computed(() => CODECS.find((c) => c.value === codec.value)!.label);

const process = (direction: 'encode' | 'decode') =>
  editors.run(direction === 'encode' ? encoders[codec.value] : decoders[codec.value],
    `${label.value} ${direction} failed`);

const swap = () => {
  editors.setInput(editors.getOutput());
  editors.setOutput('');
};
</script>

<template>
  <EditorToolLayout tool="encode" :editors="editors">
    <template #actions>
      <button @click="process('decode')" class="btn-secondary">Decode</button>
      <button @click="process('encode')" class="btn-primary">Encode</button>
    </template>
    <template #options>
      <div class="segmented" role="group" aria-label="Encoding">
        <button v-for="c in CODECS" :key="c.value" :aria-pressed="codec === c.value" @click="codec = c.value">{{ c.label }}</button>
      </div>
      <button v-if="codec === 'base64'" class="chip font-sans" :aria-pressed="urlSafe" @click="urlSafe = !urlSafe"
              title="Use - and _ instead of + and /, without padding (decoding accepts both)">URL-safe</button>
      <button v-if="codec === 'html'" class="chip font-sans" :aria-pressed="encodeAllHtml" @click="encodeAllHtml = !encodeAllHtml"
              title="Also encode every non-ASCII character as a numeric entity">Encode non-ASCII</button>
    </template>
    <template #output-actions>
      <button class="btn-icon" title="Use output as input" @click="swap"><Icon name="swap" :size="15" /></button>
    </template>
  </EditorToolLayout>
</template>
