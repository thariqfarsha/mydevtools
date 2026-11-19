<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import ValueRow from '../components/ValueRow.vue';
import Icon from '../components/Icon.vue';
import { readClipboard } from '../composables/useToast';
import { digest, HASH_ALGORITHMS, type HashAlgorithm } from '../utils/hash';
import { base64ToBytes, bytesToBase64, bytesToHex, utf8Encode } from '../utils/encoding';

const MAX_FILE_BYTES = 512 * 1024 * 1024;

const text = ref('');
const file = shallowRef<{ name: string; size: number; bytes: Uint8Array } | null>(null);
const useHmac = ref(false);
const hmacKey = ref('');
const outputFormat = ref<'hex' | 'HEX' | 'base64'>('hex');
const expected = ref('');
const results = ref<Partial<Record<HashAlgorithm, Uint8Array>>>({});
const error = ref('');
const busy = ref(false);
const dragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const source = computed(() => (file.value ? file.value.bytes : utf8Encode(text.value)));

const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`;

const formatDigest = (bytes?: Uint8Array) => {
  if (!bytes) return '';
  if (outputFormat.value === 'base64') return bytesToBase64(bytes);
  const hex = bytesToHex(bytes);
  return outputFormat.value === 'HEX' ? hex.toUpperCase() : hex;
};

// Normalise a pasted checksum to raw bytes (accepts hex in any case, or base64) for comparison.
const expectedBytes = computed(() => {
  const value = expected.value.trim();
  if (!value) return null;
  if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) {
    return Uint8Array.from(value.match(/../g)!, (h) => parseInt(h, 16));
  }
  try {
    return base64ToBytes(value);
  } catch {
    return null;
  }
});

const sameBytes = (a?: Uint8Array, b?: Uint8Array | null) =>
  !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

const matchedAlgorithm = computed(() =>
  HASH_ALGORITHMS.find((alg) => sameBytes(results.value[alg], expectedBytes.value)));

// Recompute all digests whenever the input, file or key changes (debounced; large files are not re-read).
let timer: ReturnType<typeof setTimeout> | undefined;
let run = 0;
watch([source, useHmac, hmacKey], () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    const id = ++run;
    busy.value = true;
    try {
      const key = useHmac.value ? utf8Encode(hmacKey.value) : undefined;
      const entries = await Promise.all(HASH_ALGORITHMS.map(async (alg) => [alg, await digest(alg, source.value, key)] as const));
      if (id === run) {
        results.value = Object.fromEntries(entries);
        error.value = '';
      }
    } catch (e) {
      if (id === run) error.value = `Hashing failed: ${(e as Error).message}`;
    } finally {
      if (id === run) busy.value = false;
    }
  }, file.value ? 0 : 150);
}, { immediate: true });

const loadFile = async (f: File | undefined | null) => {
  if (!f) return;
  if (f.size > MAX_FILE_BYTES) {
    error.value = `File is larger than ${formatBytes(MAX_FILE_BYTES)}`;
    return;
  }
  file.value = { name: f.name, size: f.size, bytes: new Uint8Array(await f.arrayBuffer()) };
};

const onDrop = (e: DragEvent) => {
  dragging.value = false;
  loadFile(e.dataTransfer?.files[0]);
};

const clearFile = () => {
  file.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const paste = async () => {
  const value = await readClipboard();
  if (value !== null) {
    clearFile();
    text.value = value;
  }
};

const status = computed(() => {
  if (error.value) return { error: error.value };
  if (busy.value) return { hint: 'Hashing…' };
  const what = file.value ? `${file.value.name} (${formatBytes(file.value.size)})` : `${source.value.length.toLocaleString()} bytes of UTF-8 text`;
  return { hint: `${useHmac.value ? 'HMAC of' : 'Hashed'} ${what}` };
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <input ref="fileInput" type="file" class="hidden" @change="loadFile(($event.target as HTMLInputElement).files?.[0])" />
        <button class="btn-secondary" @click="fileInput?.click()"><Icon name="upload" :size="14" /> Hash a file</button>
      </template>
    </ToolHeader>

    <div class="grid min-h-0 flex-1 grid-cols-2 gap-px bg-line">
      <!-- Input -->
      <section class="flex min-h-0 flex-col bg-surface" :class="dragging ? 'ring-2 ring-inset ring-accent' : ''"
               @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
        <PaneHeader :label="file ? 'File' : 'Text'" :meta="file ? formatBytes(file.size) : `${text.length.toLocaleString()} chars`">
          <button class="btn-icon" title="Paste from clipboard" @click="paste"><Icon name="paste" :size="15" /></button>
          <button class="btn-icon" title="Clear" @click="clearFile(); text = ''"><Icon name="trash" :size="15" /></button>
        </PaneHeader>

        <div v-if="file" class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div class="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent"><Icon name="upload" :size="22" /></div>
          <div>
            <div class="max-w-sm truncate text-sm font-medium text-fg">{{ file.name }}</div>
            <div class="text-xs text-subtle">{{ formatBytes(file.size) }} · read locally, never uploaded</div>
          </div>
          <button class="btn-ghost" @click="clearFile">Hash text instead</button>
        </div>
        <textarea v-else v-model="text" spellcheck="false" aria-label="Text to hash"
                  placeholder="Type or paste text, or drop a file here"
                  class="min-h-0 flex-1 resize-none bg-surface px-4 py-3 font-mono text-[13px] leading-5 text-fg outline-none focus-visible:outline-none placeholder:text-subtle"></textarea>

        <div class="shrink-0 space-y-2.5 border-t border-line p-4">
          <div class="flex items-center gap-2">
            <button class="chip font-sans" :aria-pressed="useHmac" @click="useHmac = !useHmac"
                    title="Keyed hash (HMAC) instead of a plain digest">HMAC</button>
            <input v-if="useHmac" v-model="hmacKey" class="field flex-1 font-mono" placeholder="Secret key (UTF-8)"
                   aria-label="HMAC key" autocomplete="off" spellcheck="false" />
          </div>
        </div>
      </section>

      <!-- Results -->
      <section class="min-h-0 overflow-y-auto bg-canvas p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <span class="label">{{ useHmac ? 'HMAC digests' : 'Digests' }}</span>
          <div class="segmented" role="group" aria-label="Output format">
            <button :aria-pressed="outputFormat === 'hex'" @click="outputFormat = 'hex'">hex</button>
            <button :aria-pressed="outputFormat === 'HEX'" @click="outputFormat = 'HEX'">HEX</button>
            <button :aria-pressed="outputFormat === 'base64'" @click="outputFormat = 'base64'">Base64</button>
          </div>
        </div>

        <div class="card overflow-hidden" :class="busy ? 'opacity-60' : ''">
          <ValueRow v-for="alg in HASH_ALGORITHMS" :key="alg" :label="alg"
                    :hint="alg === 'MD5' || alg === 'SHA-1' ? 'not collision-safe' : `${(results[alg]?.length ?? 0) * 8} bits`"
                    :value="formatDigest(results[alg])"
                    :tone="matchedAlgorithm === alg ? 'match' : 'default'" />
        </div>

        <div class="mt-5 space-y-2">
          <span class="label">Compare with a checksum</span>
          <input v-model="expected" class="field w-full font-mono" placeholder="Paste the expected hash (hex or base64)"
                 aria-label="Expected hash" spellcheck="false" />
          <p v-if="expected.trim()" class="flex items-center gap-1.5 text-xs" :class="matchedAlgorithm ? 'text-success' : 'text-danger'">
            <Icon :name="matchedAlgorithm ? 'check' : 'x'" :size="14" />
            {{ matchedAlgorithm ? `Matches ${matchedAlgorithm}` : 'Does not match any digest above' }}
          </p>
        </div>
      </section>
    </div>

    <StatusBar :error="status.error" :hint="status.hint" />
  </div>
</template>
