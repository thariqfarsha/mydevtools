<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import ValueRow from '../components/ValueRow.vue';
import Icon from '../components/Icon.vue';
import { copyText } from '../composables/useToast';
import { formatLocalDate, relativeTime } from '../utils/format';

type Unit = 'auto' | 's' | 'ms' | 'us' | 'ns';

const UNITS: { value: Unit; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 's', label: 's' },
  { value: 'ms', label: 'ms' },
  { value: 'us', label: 'µs' },
  { value: 'ns', label: 'ns' },
];
const UNIT_NAMES: Record<Exclude<Unit, 'auto'>, string> = { s: 'seconds', ms: 'milliseconds', us: 'microseconds', ns: 'nanoseconds' };

// ---- Live clock ----
const now = ref(Date.now());
const paused = ref(false);
const clock = setInterval(() => {
  if (!paused.value) now.value = Date.now();
}, 1000);
onBeforeUnmount(() => clearInterval(clock));

// ---- Timestamp or date string → date ----
const input = ref(String(Math.floor(Date.now() / 1000)));
const unit = ref<Unit>('auto');

// Guess the unit from the number of integer digits (current epochs: s=10, ms=13, µs=16, ns=19).
const detectUnit = (digits: number): Exclude<Unit, 'auto'> =>
  digits <= 11 ? 's' : digits <= 14 ? 'ms' : digits <= 17 ? 'us' : 'ns';

const parsed = computed<{ ms?: number; unit?: Exclude<Unit, 'auto'>; fromText?: boolean; error?: string }>(() => {
  const value = input.value.trim();
  if (!value) return {};

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const [intPart] = value.replace('-', '').split('.');
    const u = unit.value === 'auto' ? detectUnit(intPart.length) : unit.value;
    let ms: number;
    if (value.includes('.')) {
      ms = Number(value) * { s: 1000, ms: 1, us: 1e-3, ns: 1e-6 }[u];
    } else {
      // BigInt so 19-digit nanosecond values don't lose precision before scaling down.
      const big = BigInt(value);
      ms = Number({ s: big * 1000n, ms: big, us: big / 1000n, ns: big / 1_000_000n }[u]);
    }
    if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return { error: 'That timestamp is outside the range a date can represent' };
    return { ms, unit: u };
  }

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return { error: 'Not a number or a date this browser can parse (try ISO 8601, e.g. 2026-11-19T10:30:00Z)' };
  return { ms, fromText: true };
});

const rows = computed(() => {
  const ms = parsed.value.ms;
  if (ms === undefined) return [];
  const date = new Date(ms);
  return [
    { label: 'Local', value: formatLocalDate(ms), mono: false },
    { label: 'UTC', value: date.toUTCString(), mono: false },
    { label: 'ISO 8601', value: date.toISOString(), mono: true },
    { label: 'Relative', value: relativeTime(ms, now.value), mono: false },
    { label: 'Unix seconds', value: String(Math.floor(ms / 1000)), mono: true },
    { label: 'Unix ms', value: String(Math.round(ms)), mono: true },
  ];
});

// ---- Date picker → timestamp ----
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const pickerValue = ref(toLocalInput(new Date()));
const pickerZone = ref<'local' | 'utc'>('local');

const pickerMs = computed(() => {
  if (!pickerValue.value) return null;
  // datetime-local has no zone: read it as local time, or append Z to read it as UTC.
  const withSeconds = pickerValue.value.length === 16 ? `${pickerValue.value}:00` : pickerValue.value;
  const ms = Date.parse(pickerZone.value === 'utc' ? `${withSeconds}Z` : withSeconds);
  return Number.isNaN(ms) ? null : ms;
});

const pickerRows = computed(() => pickerMs.value === null ? [] : [
  { label: 'Unix seconds', value: String(Math.floor(pickerMs.value / 1000)) },
  { label: 'Unix ms', value: String(pickerMs.value) },
  { label: 'ISO 8601', value: new Date(pickerMs.value).toISOString() },
]);

const useNow = () => {
  input.value = String(Math.floor(Date.now() / 1000));
  unit.value = 'auto';
};

const status = computed(() => {
  if (parsed.value.error) return { error: parsed.value.error };
  if (parsed.value.fromText) return { hint: 'Parsed as a date string' };
  if (parsed.value.unit) return { hint: `Read as ${UNIT_NAMES[parsed.value.unit]}${unit.value === 'auto' ? ' (detected from length)' : ''}` };
  return { hint: 'Enter a Unix timestamp or a date' };
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <button class="btn-secondary" @click="useNow"><Icon name="clock" :size="14" /> Use current time</button>
      </template>
    </ToolHeader>

    <div class="min-h-0 flex-1 overflow-y-auto bg-canvas">
      <div class="mx-auto grid max-w-6xl gap-4 p-5 lg:grid-cols-[1fr_1fr]">
        <!-- Now -->
        <div class="card overflow-hidden lg:col-span-2">
          <PaneHeader label="Current time" :meta="paused ? 'paused' : 'live'">
            <button class="btn-icon" :aria-pressed="paused" :title="paused ? 'Resume' : 'Pause'" @click="paused = !paused">
              <Icon :name="paused ? 'refresh' : 'clock'" :size="15" />
            </button>
          </PaneHeader>
          <div class="grid gap-px bg-line sm:grid-cols-3">
            <button v-for="item in [
                      { label: 'Unix seconds', value: String(Math.floor(now / 1000)) },
                      { label: 'Unix milliseconds', value: String(now) },
                      { label: 'ISO 8601 (UTC)', value: new Date(now).toISOString() },
                    ]" :key="item.label"
                    class="group flex flex-col items-start gap-1 bg-surface px-4 py-3 text-left transition-colors hover:bg-raised"
                    :title="`Copy ${item.label}`" @click="copyText(item.value)">
              <span class="flex w-full items-center justify-between text-[11px] text-subtle">
                {{ item.label }}
                <Icon name="copy" :size="13" class="opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span class="font-mono text-lg font-medium tabular-nums text-fg">{{ item.value }}</span>
            </button>
          </div>
        </div>

        <!-- Timestamp → date -->
        <div class="card overflow-hidden">
          <PaneHeader label="Timestamp → date" />
          <div class="space-y-2.5 border-b border-line p-4">
            <input v-model="input" class="field w-full font-mono" aria-label="Timestamp or date"
                   placeholder="1763500000, 1763500000123, or 2026-11-19T10:30:00Z" spellcheck="false" />
            <div class="flex items-center gap-2 text-xs text-subtle">
              <span>Unit</span>
              <div class="segmented" role="group" aria-label="Timestamp unit">
                <button v-for="u in UNITS" :key="u.value" :aria-pressed="unit === u.value" @click="unit = u.value">{{ u.label }}</button>
              </div>
            </div>
          </div>
          <ValueRow v-for="r in rows" :key="r.label" :label="r.label" :value="r.value" :mono="r.mono" />
          <p v-if="parsed.error" class="px-4 py-3 text-xs text-danger">{{ parsed.error }}</p>
        </div>

        <!-- Date → timestamp -->
        <div class="card overflow-hidden">
          <PaneHeader label="Date → timestamp" />
          <div class="flex flex-wrap items-center gap-2 border-b border-line p-4">
            <input v-model="pickerValue" type="datetime-local" step="1" class="field flex-1 font-mono" aria-label="Date and time" />
            <div class="segmented" role="group" aria-label="Time zone">
              <button :aria-pressed="pickerZone === 'local'" @click="pickerZone = 'local'">Local</button>
              <button :aria-pressed="pickerZone === 'utc'" @click="pickerZone = 'utc'">UTC</button>
            </div>
          </div>
          <ValueRow v-for="r in pickerRows" :key="r.label" :label="r.label" :value="r.value" />
        </div>
      </div>
    </div>

    <StatusBar :error="status.error" :hint="status.hint" />
  </div>
</template>
