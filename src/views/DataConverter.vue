<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import EditorToolLayout from '../components/EditorToolLayout.vue';
import Icon from '../components/Icon.vue';
import { useTabbedEditors } from '../composables/useTabbedEditors';
import { FORMAT_LANGUAGE, parseData, stringifyData, type ConvertOptions, type DataFormat } from '../utils/convert';

const FORMATS: { value: DataFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
];
const DELIMITERS = [
  { value: '', label: 'Auto' },
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: 'Tab' },
];

const from = ref<DataFormat>('json');
const to = ref<DataFormat>('yaml');
const options = reactive<ConvertOptions>({ nestedKeys: true, detectTypes: true, delimiter: '', indent: 2 });

const editors = useTabbedEditors('convert', 'json', () => { convert(); });

const labelOf = (f: DataFormat) => FORMATS.find((x) => x.value === f)!.label;
const usesCsv = computed(() => from.value === 'csv' || to.value === 'csv');

const convert = () =>
  editors.run((raw) => stringifyData(to.value, parseData(from.value, raw, options), options), `Could not read ${labelOf(from.value)}`);

const setFrom = (f: DataFormat) => {
  if (f === to.value) to.value = from.value;
  from.value = f;
};
const setTo = (f: DataFormat) => {
  if (f === from.value) from.value = to.value;
  to.value = f;
};

const swap = () => {
  const output = editors.getOutput();
  [from.value, to.value] = [to.value, from.value];
  editors.setInput(output);
  editors.setOutput('');
};

const applyLanguages = () => editors.setLanguages(FORMAT_LANGUAGE[from.value], FORMAT_LANGUAGE[to.value]);
watch([from, to], applyLanguages);
onMounted(applyLanguages);
</script>

<template>
  <EditorToolLayout tool="convert" :editors="editors" :input-label="labelOf(from)" :output-label="labelOf(to)">
    <template #actions>
      <button class="btn-secondary" title="Swap formats and use the output as input" @click="swap"><Icon name="swap" :size="14" /> Swap</button>
      <button class="btn-primary" @click="convert">Convert to {{ labelOf(to) }}</button>
    </template>
    <template #options>
      <div class="segmented" role="group" aria-label="From format">
        <button v-for="f in FORMATS" :key="f.value" :aria-pressed="from === f.value" @click="setFrom(f.value)">{{ f.label }}</button>
      </div>
      <Icon name="swap" :size="14" class="text-subtle" />
      <div class="segmented" role="group" aria-label="To format">
        <button v-for="f in FORMATS" :key="f.value" :aria-pressed="to === f.value" @click="setTo(f.value)">{{ f.label }}</button>
      </div>
      <template v-if="usesCsv">
        <span class="h-5 w-px bg-line-strong"></span>
        <button class="chip font-sans" :aria-pressed="options.nestedKeys" @click="options.nestedKeys = !options.nestedKeys"
                title="Nested objects ↔ dotted column names like address.city">a.b columns</button>
        <button v-if="from === 'csv'" class="chip font-sans" :aria-pressed="options.detectTypes" @click="options.detectTypes = !options.detectTypes"
                title="Read 42, true, false and null as values instead of text. Values with leading zeros stay text.">Detect types</button>
        <div class="segmented" role="group" aria-label="CSV delimiter" title="CSV delimiter">
          <button v-for="d in DELIMITERS" :key="d.label" :aria-pressed="options.delimiter === d.value" @click="options.delimiter = d.value">{{ d.label }}</button>
        </div>
      </template>
    </template>
  </EditorToolLayout>
</template>
