<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import Icon from '../components/Icon.vue';
import { readClipboard } from '../composables/useToast';

type ImageFormat = 'png' | 'jpg';

const MIME: Record<ImageFormat, string> = { png: 'image/png', jpg: 'image/jpeg' };

const input = ref('');
const format = ref<ImageFormat>('png');
const previewUrl = ref('');
const errorMessage = ref('');
const info = ref<{ width: number; height: number; sourceType: string; bytes: number } | null>(null);

const hasPreview = computed(() => Boolean(previewUrl.value));

const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 ** 2).toFixed(2)} MB`;

const previewMeta = computed(() => info.value
  ? `${info.value.width}×${info.value.height} · ${info.value.sourceType.replace('image/', '').toUpperCase()} · ${formatBytes(info.value.bytes)}`
  : '');

// Strip data URL prefix, whitespace/newlines, and convert base64url to standard base64.
const normalizeBase64 = (value: string) => {
  let cleaned = value.trim().replace(/^data:[^;,]*(;[^,]*)?;base64,/i, '').replace(/\s+/g, '');
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const pad = cleaned.length % 4;
  if (pad === 2) cleaned += '==';
  else if (pad === 3) cleaned += '=';
  return cleaned;
};

// Sniff the real image type from the decoded bytes' magic numbers.
const sniffMime = (b64: string) => {
  const head = atob(b64.slice(0, 24));
  const bytes = Array.from(head, (c) => c.charCodeAt(0));
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x47, 0x49, 0x46)) return 'image/gif';
  if (starts(0x52, 0x49, 0x46, 0x46) && head.slice(8, 12) === 'WEBP') return 'image/webp';
  if (starts(0x42, 0x4d)) return 'image/bmp';
  if (head.trimStart().startsWith('<')) return 'image/svg+xml';
  return 'image/png';
};

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('decode failed'));
  img.src = src;
});

const reset = (message = '') => {
  errorMessage.value = message;
  previewUrl.value = '';
  info.value = null;
};

const convert = async () => {
  const cleaned = normalizeBase64(input.value);

  if (!cleaned) return reset();

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    return reset('The value does not look like valid base64.');
  }

  try {
    const sourceType = sniffMime(cleaned);
    const img = await loadImage(`data:${sourceType};base64,${cleaned}`);

    // Re-encode through a canvas so the output really is the selected format.
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    if (format.value === 'jpg') {
      // JPG has no alpha channel; fill white so transparent areas don't turn black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);
    previewUrl.value = canvas.toDataURL(MIME[format.value], 0.92);
    info.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      sourceType,
      bytes: Math.floor((cleaned.length * 3) / 4) - (cleaned.match(/=+$/)?.[0].length ?? 0),
    };
    errorMessage.value = '';
  } catch {
    reset('Could not decode this base64 as an image.');
  }
};

// Convert as the user types/pastes (debounced), and whenever the output format changes.
let timer: ReturnType<typeof setTimeout> | undefined;
watch(input, () => {
  clearTimeout(timer);
  timer = setTimeout(convert, 250);
});
watch(format, convert);

const paste = async () => {
  const text = await readClipboard();
  if (text !== null) input.value = text;
};

const downloadImage = () => {
  if (!previewUrl.value) return;
  const link = document.createElement('a');
  link.href = previewUrl.value;
  link.download = `converted-image.${format.value}`;
  link.click();
};
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <div class="segmented" role="group" aria-label="Output format">
          <button :aria-pressed="format === 'png'" @click="format = 'png'">PNG</button>
          <button :aria-pressed="format === 'jpg'" @click="format = 'jpg'">JPG</button>
        </div>
        <button class="btn-primary" :disabled="!hasPreview" @click="downloadImage">
          <Icon name="download" :size="14" /> Download {{ format.toUpperCase() }}
        </button>
      </template>
    </ToolHeader>

    <div class="grid min-h-0 flex-1 grid-cols-[1fr_1fr] gap-px bg-line">
      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader label="Base64" :meta="input ? `${input.length.toLocaleString()} chars` : ''">
          <button class="btn-icon" title="Paste from clipboard" @click="paste"><Icon name="paste" :size="15" /></button>
          <button class="btn-icon" title="Clear" @click="input = ''"><Icon name="trash" :size="15" /></button>
        </PaneHeader>
        <textarea
          v-model="input"
          spellcheck="false"
          aria-label="Base64 input"
          class="min-h-0 flex-1 resize-none break-all bg-surface px-4 py-3 font-mono text-[13px] leading-5 text-fg outline-none focus-visible:outline-none placeholder:text-subtle"
          placeholder="Paste a base64 string or a data:image/...;base64, URL"
        />
      </section>

      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader label="Preview" :meta="previewMeta" />
        <div class="checkerboard flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
          <!-- Tiny images (icons, pixels) are scaled up crisply so they stay visible. -->
          <img v-if="hasPreview" :src="previewUrl" :alt="`Converted ${format}`"
               :style="info && Math.max(info.width, info.height) < 128 ? { width: `${info.width * 8}px`, imageRendering: 'pixelated' } : undefined"
               class="max-h-full max-w-full object-contain shadow-xl shadow-black/15 dark:shadow-black/40" />
          <div v-else class="flex max-w-xs flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface/80 px-6 py-8 text-center">
            <Icon name="download" :size="22" class="text-subtle" />
            <p class="text-[13px] text-muted">The image preview appears here as soon as you paste a base64 value.</p>
            <p class="text-[11px] text-subtle">PNG, JPEG, GIF, WebP, BMP and SVG are detected automatically.</p>
          </div>
        </div>
      </section>
    </div>

    <StatusBar :error="errorMessage" :hint="hasPreview ? `Converted to ${format.toUpperCase()}` : 'Waiting for input'" />
  </div>
</template>
