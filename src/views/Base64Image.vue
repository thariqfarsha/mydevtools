<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type ImageFormat = 'png' | 'jpg';

const input = ref('');
const format = ref<ImageFormat>('png');
const previewUrl = ref('');
const errorMessage = ref('');

const hasPreview = computed(() => Boolean(previewUrl.value));
const detectedType = ref('');

const MIME: Record<ImageFormat, string> = { png: 'image/png', jpg: 'image/jpeg' };

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

const convert = async () => {
  const cleaned = normalizeBase64(input.value);

  if (!cleaned) {
    errorMessage.value = 'Please paste a base64 string to preview.';
    previewUrl.value = '';
    return;
  }

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    errorMessage.value = 'The value does not look like valid base64.';
    previewUrl.value = '';
    return;
  }

  try {
    const sourceMime = sniffMime(cleaned);
    detectedType.value = sourceMime;
    const img = await loadImage(`data:${sourceMime};base64,${cleaned}`);

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
    errorMessage.value = '';
  } catch {
    errorMessage.value = 'Could not decode this base64 as an image.';
    previewUrl.value = '';
  }
};

watch(format, () => {
  if (previewUrl.value) convert();
});

const downloadImage = () => {
  if (!previewUrl.value) return;

  const link = document.createElement('a');
  link.href = previewUrl.value;
  link.download = `converted-image.${format.value}`;
  link.click();
};
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-[#1e1e1e]">
    <div class="h-12 flex items-center justify-between px-6 bg-[#252526] border-b border-white/5">
      <div>
        <h2 class="text-sm font-semibold text-white">Base64 to PNG / JPG</h2>
        <p class="text-xs text-slate-500">Paste a base64 string and preview the image with a bright background.</p>
      </div>
      <div class="flex items-center gap-2">
        <select v-model="format" class="rounded-md border border-white/10 bg-[#1e1e1e] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
        </select>
        <button @click="convert" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500">
          Preview
        </button>
      </div>
    </div>

    <div class="flex-1 grid gap-4 overflow-hidden p-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="flex flex-col rounded-xl border border-white/10 bg-[#252526] p-4">
        <label for="base64-input" class="mb-2 text-sm font-medium text-slate-300">Base64 input</label>
        <textarea
          id="base64-input"
          v-model="input"
          rows="16"
          class="flex-1 resize-none rounded-lg border border-white/10 bg-[#1e1e1e] p-3 font-mono text-sm text-slate-200 outline-none focus:border-blue-500"
          placeholder="Paste your base64 string here..."
        />
      </div>

      <div class="flex flex-col rounded-xl border border-white/10 bg-[#252526] p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-white">
            Preview
            <span v-if="hasPreview && detectedType" class="ml-2 text-xs font-normal text-slate-500">source: {{ detectedType }}</span>
          </h3>
          <button
            v-if="hasPreview"
            @click="downloadImage"
            class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Download
          </button>
        </div>

        <div class="flex-1 rounded-xl border border-slate-700 bg-white p-4 shadow-inner">
          <div v-if="errorMessage" class="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            {{ errorMessage }}
          </div>
          <div v-else-if="hasPreview" class="flex h-full items-center justify-center overflow-hidden rounded-lg bg-white p-2">
            <img :src="previewUrl" :alt="`Converted ${format}`" class="max-h-full max-w-full object-contain" />
          </div>
          <div v-else class="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
            Your image preview will appear here once you convert the base64 value.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
