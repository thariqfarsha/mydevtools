<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import cronstrue from 'cronstrue';
import ToolHeader from '../components/ToolHeader.vue';
import PaneHeader from '../components/PaneHeader.vue';
import StatusBar from '../components/StatusBar.vue';
import Icon from '../components/Icon.vue';
import { copyText } from '../composables/useToast';
import { nextRuns, parseCron, type ParsedCron } from '../utils/cron';
import { relativeTime } from '../utils/format';

const PRESETS: { label: string; value: string }[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 09:00', value: '0 9 * * 1-5' },
  { label: 'Every Monday 08:30', value: '30 8 * * 1' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: '1st of the month', value: '0 0 1 * *' },
  { label: 'Every 30 seconds', value: '*/30 * * * * *' },
];

const SYNTAX: { token: string; meaning: string }[] = [
  { token: '*', meaning: 'any value' },
  { token: ',', meaning: 'list: 1,15' },
  { token: '-', meaning: 'range: 1-5' },
  { token: '/', meaning: 'step: */10 or 5/15' },
  { token: 'JAN–DEC', meaning: 'month names' },
  { token: 'SUN–SAT', meaning: 'weekday names (0 or 7 = Sun)' },
  { token: '@daily', meaning: 'also @hourly, @weekly, @monthly, @yearly' },
];

const RUN_COUNT = 10;

const expression = ref('0 9 * * 1-5');
const zone = ref<'local' | 'utc'>('local');
const now = ref(Date.now());
const clock = setInterval(() => (now.value = Date.now()), 30_000);
onBeforeUnmount(() => clearInterval(clock));

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const parsed = computed<{ cron?: ParsedCron; error?: string }>(() => {
  try {
    return { cron: parseCron(expression.value) };
  } catch (e) {
    return { error: (e as Error).message };
  }
});

const description = computed(() => {
  const cron = parsed.value.cron;
  if (!cron) return '';
  try {
    return cronstrue.toString(cron.expression, { use24HourTimeFormat: true });
  } catch {
    return '';
  }
});

const runs = computed(() => {
  const cron = parsed.value.cron;
  if (!cron) return [];
  return nextRuns(cron, new Date(now.value), RUN_COUNT, zone.value === 'utc');
});

const formatRun = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: parsed.value.cron?.hasSeconds ? '2-digit' : undefined,
    hourCycle: 'h23', timeZone: zone.value === 'utc' ? 'UTC' : undefined,
  });

const status = computed(() => {
  if (parsed.value.error) return { error: parsed.value.error };
  const tz = zone.value === 'utc' ? 'UTC' : localZone;
  if (!runs.value.length) return { hint: 'This schedule never runs in the next 5 years (e.g. 31 Feb)' };
  return { hint: `${parsed.value.cron!.hasSeconds ? '6-field (with seconds)' : 'Standard 5-field'} cron · times in ${tz}` };
});
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <ToolHeader>
      <template #actions>
        <button class="btn-secondary" :disabled="!expression.trim()" @click="copyText(expression.trim())"><Icon name="copy" :size="14" /> Copy expression</button>
      </template>
    </ToolHeader>

    <div class="min-h-0 flex-1 overflow-y-auto bg-canvas">
      <div class="mx-auto max-w-5xl space-y-4 p-5">
        <!-- Expression -->
        <div class="card p-5">
          <input v-model="expression" spellcheck="false" autocomplete="off" aria-label="Cron expression"
                 class="field h-12 w-full text-center font-mono text-xl tracking-wide"
                 :class="parsed.error ? 'border-danger focus:border-danger' : ''"
                 placeholder="*/5 * * * *" />

          <!-- Field breakdown -->
          <div v-if="parsed.cron" class="mt-3 grid gap-2" :style="{ gridTemplateColumns: `repeat(${parsed.cron.fields.length}, minmax(0, 1fr))` }">
            <div v-for="f in parsed.cron.fields" :key="f.key"
                 class="rounded-md border px-2 py-1.5 text-center"
                 :class="f.any ? 'border-line bg-surface' : 'border-highlight/40 bg-highlight-soft'">
              <div class="truncate font-mono text-sm" :class="f.any ? 'text-subtle' : 'text-highlight'">{{ f.raw }}</div>
              <div class="text-[11px] font-medium text-muted">{{ f.label }}</div>
              <div v-if="f.summary !== f.raw" class="truncate text-[11px] text-subtle" :title="f.summary">{{ f.summary }}</div>
            </div>
          </div>

          <p v-if="parsed.error" class="mt-3 flex items-center justify-center gap-1.5 text-sm text-danger">
            <Icon name="alert" :size="15" /> {{ parsed.error }}
          </p>
          <p v-else-if="description" class="mt-4 text-center text-lg font-medium text-fg">“{{ description }}”</p>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
          <!-- Next runs -->
          <div class="card overflow-hidden">
            <PaneHeader label="Next runs" :meta="zone === 'utc' ? 'UTC' : localZone">
              <div class="segmented h-7" role="group" aria-label="Time zone">
                <button :aria-pressed="zone === 'local'" @click="zone = 'local'">Local</button>
                <button :aria-pressed="zone === 'utc'" @click="zone = 'utc'">UTC</button>
              </div>
            </PaneHeader>
            <ol v-if="runs.length">
              <li v-for="(run, i) in runs" :key="run.getTime()"
                  class="flex items-center gap-4 border-b border-line px-4 py-2 text-[13px] last:border-b-0">
                <span class="w-5 text-right text-[11px] tabular-nums text-subtle">{{ i + 1 }}</span>
                <span class="flex-1 font-mono tabular-nums text-fg">{{ formatRun(run) }}</span>
                <span class="text-xs text-subtle">{{ relativeTime(run.getTime(), now) }}</span>
              </li>
            </ol>
            <p v-else class="px-4 py-6 text-center text-[13px] text-subtle">
              {{ parsed.error ? 'Fix the expression to see when it runs.' : 'No runs found in the next 5 years.' }}
            </p>
          </div>

          <div class="space-y-4">
            <!-- Presets -->
            <div class="card overflow-hidden">
              <PaneHeader label="Presets" />
              <div class="flex flex-wrap gap-1.5 p-3">
                <button v-for="p in PRESETS" :key="p.value" class="chip font-sans"
                        :aria-pressed="expression.trim() === p.value" :title="p.value" @click="expression = p.value">{{ p.label }}</button>
              </div>
            </div>

            <!-- Syntax -->
            <div class="card overflow-hidden">
              <PaneHeader label="Syntax" />
              <div class="grid grid-cols-5 gap-1 px-4 py-3 text-center">
                <div v-for="f in [['min', '0–59'], ['hour', '0–23'], ['day', '1–31'], ['month', '1–12'], ['weekday', '0–6']]" :key="f[0]">
                  <div class="font-mono text-base text-highlight">*</div>
                  <div class="text-[11px] text-muted">{{ f[0] }}</div>
                  <div class="text-[10px] text-subtle">{{ f[1] }}</div>
                </div>
              </div>
              <dl class="border-t border-line px-4 py-2">
                <div v-for="s in SYNTAX" :key="s.token" class="flex gap-3 py-0.5 text-xs">
                  <dt class="w-16 shrink-0 font-mono text-accent">{{ s.token }}</dt>
                  <dd class="text-muted">{{ s.meaning }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <StatusBar :error="status.error" :hint="status.hint" />
  </div>
</template>
