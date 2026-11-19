<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import ValueRow from '../components/ValueRow.vue';
import Icon from '../components/Icon.vue';
import { copyText, readClipboard } from '../composables/useToast';
import { algorithmSpec, CLAIM_NAMES, decodeJwt, TIME_CLAIMS, verifyJwt, type DecodedJwt } from '../utils/jwt';
import { formatLocalDate, highlightJson, relativeTime } from '../utils/format';

const token = ref('');
const keyText = ref('');
const secretEncoding = ref<'utf8' | 'base64'>('utf8');
const showSecret = ref(false);
const backdrop = ref<HTMLElement | null>(null);
const now = ref(Date.now());

// ---- Decoding ----
const result = computed<{ decoded?: DecodedJwt; error?: string }>(() => {
  if (!token.value.trim()) return {};
  try {
    return { decoded: decodeJwt(token.value) };
  } catch (e) {
    return { error: (e as Error).message };
  }
});
const decoded = computed(() => result.value.decoded);
const payloadObject = computed(() => {
  const p = decoded.value?.payload;
  return p && typeof p === 'object' && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
});

// Coloured mirror of the token (header · payload · signature), drawn behind a transparent textarea.
const coloredToken = computed(() => {
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const text = token.value;
  if (!decoded.value) return escape(text) + '\n';
  const [h, p, s] = text.split('.');
  return `<span class="text-highlight">${escape(h)}</span>.<span class="text-accent">${escape(p)}</span>.<span class="text-muted">${escape(s ?? '')}</span>\n`;
});
const syncScroll = (e: Event) => {
  if (backdrop.value) backdrop.value.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
};

// ---- Claims ----
const isTimeClaim = (key: string) => (TIME_CLAIMS as readonly string[]).includes(key);

const claims = computed(() => {
  if (!payloadObject.value) return [];
  return Object.entries(payloadObject.value).map(([key, value]) => {
    let display: string;
    if (isTimeClaim(key) && typeof value === 'number') {
      display = `${formatLocalDate(value * 1000)}  ·  ${relativeTime(value * 1000, now.value)}`;
    } else {
      display = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return { key, label: CLAIM_NAMES[key] ?? key, hint: CLAIM_NAMES[key] ? key : undefined, display };
  });
});

const validity = computed(() => {
  const p = payloadObject.value;
  if (!p) return null;
  const nowSec = now.value / 1000;
  if (typeof p.nbf === 'number' && p.nbf > nowSec) {
    return { tone: 'warning', text: `Not valid yet · becomes valid ${relativeTime(p.nbf * 1000, now.value)}` };
  }
  if (typeof p.exp === 'number') {
    return p.exp < nowSec
      ? { tone: 'danger', text: `Expired ${relativeTime(p.exp * 1000, now.value)}` }
      : { tone: 'success', text: `Valid · expires ${relativeTime(p.exp * 1000, now.value)}` };
  }
  return { tone: 'muted', text: 'No expiry (exp) claim' };
});

const toneClass: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  muted: 'bg-raised text-muted border-line-strong',
};

// Keep relative times fresh while the page is open.
const clock = setInterval(() => (now.value = Date.now()), 15_000);
onBeforeUnmount(() => {
  clearInterval(clock);
  clearTimeout(verifyTimer);
});

// ---- Signature verification ----
const alg = computed(() => String(decoded.value?.header.alg ?? ''));
const spec = computed(() => algorithmSpec(alg.value));
const verification = ref<{ state: 'idle' | 'valid' | 'invalid' | 'error'; message?: string }>({ state: 'idle' });

let verifyTimer: ReturnType<typeof setTimeout> | undefined;
watch([decoded, keyText, secretEncoding], () => {
  clearTimeout(verifyTimer);
  if (!decoded.value || !keyText.value.trim()) {
    verification.value = { state: 'idle' };
    return;
  }
  verifyTimer = setTimeout(async () => {
    try {
      const ok = await verifyJwt(decoded.value!, keyText.value, secretEncoding.value);
      verification.value = { state: ok ? 'valid' : 'invalid' };
    } catch (e) {
      verification.value = { state: 'error', message: (e as Error).message || 'Could not read this key' };
    }
  }, 250);
});

const paste = async () => {
  const text = await readClipboard();
  if (text !== null) token.value = text.trim();
};

const status = computed(() => {
  if (result.value.error) return { error: result.value.error };
  if (!decoded.value) return { hint: 'Paste a JWT to decode it' };
  return { hint: `Decoded ${alg.value || 'unsigned'} token · nothing is sent anywhere` };
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <button class="btn-secondary" :disabled="!token" @click="token = ''; keyText = ''"><Icon name="trash" :size="14" /> Clear</button>
        <button class="btn-primary" @click="paste"><Icon name="paste" :size="14" /> Paste token</button>
      </template>
    </ToolHeader>

    <div class="grid min-h-0 flex-1 grid-cols-2 gap-px bg-line">
      <!-- Left: token + verification -->
      <section class="flex min-h-0 flex-col bg-surface">
        <PaneHeader label="Encoded token" :meta="token ? `${token.trim().length.toLocaleString()} chars` : ''">
          <button class="btn-icon" title="Copy token" @click="copyText(token)"><Icon name="copy" :size="15" /></button>
        </PaneHeader>

        <div class="relative min-h-0 flex-1">
          <div ref="backdrop" aria-hidden="true"
               class="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-all px-4 py-3 font-mono text-[13px] leading-5 text-fg"
               v-html="coloredToken"></div>
          <textarea v-model="token" @scroll="syncScroll" spellcheck="false" aria-label="JWT"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    class="absolute inset-0 resize-none whitespace-pre-wrap break-all bg-transparent px-4 py-3 font-mono text-[13px] leading-5 text-transparent caret-fg outline-none focus-visible:outline-none placeholder:text-subtle"></textarea>
        </div>

        <!-- Verification -->
        <div class="shrink-0 border-t border-line">
          <PaneHeader label="Verify signature" :meta="alg ? alg : ''">
            <span v-if="verification.state === 'valid'" class="flex items-center gap-1 pr-2 text-xs font-medium text-success"><Icon name="check" :size="14" /> Signature verified</span>
            <span v-else-if="verification.state === 'invalid'" class="flex items-center gap-1 pr-2 text-xs font-medium text-danger"><Icon name="x" :size="14" /> Invalid signature</span>
            <span v-else-if="verification.state === 'error'" class="max-w-64 truncate pr-2 text-xs text-danger" :title="verification.message">{{ verification.message }}</span>
          </PaneHeader>
          <div class="space-y-2 p-4">
            <p v-if="!decoded" class="text-xs text-subtle">Decode a token first.</p>
            <p v-else-if="alg === 'none'" class="text-xs text-warning">This token uses alg "none": it is not signed, so anyone could have written it.</p>
            <p v-else-if="!spec" class="text-xs text-subtle">Verification for “{{ alg }}” isn’t supported. Supported: HS, RS, PS and ES with 256/384/512.</p>
            <template v-else-if="spec.kind === 'secret'">
              <div class="flex items-center gap-2">
                <input v-model="keyText" :type="showSecret ? 'text' : 'password'" class="field flex-1 font-mono"
                       placeholder="Shared secret" aria-label="Shared secret" autocomplete="off" spellcheck="false" />
                <button class="btn-icon size-8" :aria-pressed="showSecret" :title="showSecret ? 'Hide secret' : 'Show secret'"
                        @click="showSecret = !showSecret"><Icon name="eye" :size="15" /></button>
                <div class="segmented" role="group" aria-label="Secret encoding">
                  <button :aria-pressed="secretEncoding === 'utf8'" @click="secretEncoding = 'utf8'">UTF-8</button>
                  <button :aria-pressed="secretEncoding === 'base64'" @click="secretEncoding = 'base64'">Base64</button>
                </div>
              </div>
            </template>
            <textarea v-else v-model="keyText" rows="5" spellcheck="false" aria-label="Public key"
                      placeholder="-----BEGIN PUBLIC KEY-----&#10;…&#10;-----END PUBLIC KEY-----   (or a public JWK)"
                      class="field h-auto w-full resize-none py-2 font-mono text-xs leading-5"></textarea>
          </div>
        </div>
      </section>

      <!-- Right: decoded parts -->
      <section class="min-h-0 overflow-y-auto bg-canvas p-4">
        <div v-if="!decoded" class="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Icon name="shield" :size="28" class="text-subtle" />
          <p class="max-w-sm text-[13px] text-muted">
            {{ result.error ? 'This token could not be decoded.' : 'Paste a JSON Web Token on the left to see its header, payload and claims.' }}
          </p>
          <p class="max-w-sm text-[11px] text-subtle">Decoding and verification happen in this tab. Tokens and keys are never uploaded.</p>
        </div>

        <div v-else class="space-y-4">
          <div v-if="validity" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium" :class="toneClass[validity.tone]">
            <Icon :name="validity.tone === 'success' ? 'check' : validity.tone === 'muted' ? 'clock' : 'alert'" :size="14" />
            {{ validity.text }}
          </div>

          <div class="card overflow-hidden">
            <PaneHeader label="Header">
              <span class="mr-1 size-1.5 rounded-full bg-highlight"></span>
              <button class="btn-icon" title="Copy header JSON" @click="copyText(JSON.stringify(decoded.header, null, 2))"><Icon name="copy" :size="14" /></button>
            </PaneHeader>
            <pre class="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-5 text-fg" v-html="highlightJson(decoded.header)"></pre>
          </div>

          <div class="card overflow-hidden">
            <PaneHeader label="Payload">
              <span class="mr-1 size-1.5 rounded-full bg-accent"></span>
              <button class="btn-icon" title="Copy payload JSON" @click="copyText(JSON.stringify(decoded.payload, null, 2))"><Icon name="copy" :size="14" /></button>
            </PaneHeader>
            <pre class="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-5 text-fg" v-html="highlightJson(decoded.payload)"></pre>
          </div>

          <div v-if="claims.length" class="card overflow-hidden">
            <PaneHeader label="Claims" :meta="`${claims.length}`" />
            <ValueRow v-for="c in claims" :key="c.key" :label="c.label" :hint="c.hint" :value="c.display" :mono="!isTimeClaim(c.key)" />
          </div>
        </div>
      </section>
    </div>

    <StatusBar :error="status.error" :hint="status.hint" />
  </div>
</template>
