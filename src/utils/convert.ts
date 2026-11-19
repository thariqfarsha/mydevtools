import YAML from 'yaml';
import Papa from 'papaparse';

export type DataFormat = 'json' | 'yaml' | 'csv';

export interface ConvertOptions {
  /** JSON → CSV: nested objects become "a.b" columns. CSV → JSON: "a.b" columns become nested objects. */
  nestedKeys: boolean;
  /** CSV → data: turn "42", "true", "false", "null" into numbers/booleans/null (leading-zero values stay strings). */
  detectTypes: boolean;
  /** CSV delimiter; empty string means auto-detect when reading and comma when writing. */
  delimiter: string;
  indent: number;
}

type Row = Record<string, unknown>;

const isPlainObject = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);

// "007" and "1e5" stay strings: converting them would silently change IDs, phone numbers or codes.
const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;

const typed = (value: string): unknown => {
  if (NUMBER.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) || value.includes('.') ? n : value;
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  return value;
};

function flatten(value: Row, prefix = '', out: Row = {}): Row {
  for (const [key, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(v) && Object.keys(v).length) flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}

function unflatten(row: Row): Row {
  const out: Row = {};
  for (const [path, value] of Object.entries(row)) {
    const keys = path.split('.');
    let target = out;
    keys.slice(0, -1).forEach((k) => {
      if (!isPlainObject(target[k])) target[k] = {};
      target = target[k] as Row;
    });
    target[keys[keys.length - 1]] = value;
  }
  return out;
}

const cell = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

export function parseData(format: DataFormat, text: string, opts: ConvertOptions): unknown {
  if (!text.trim()) throw new Error('Input is empty');
  switch (format) {
    case 'json':
      return JSON.parse(text);
    case 'yaml': {
      const docs = YAML.parseAllDocuments(text);
      const failed = docs.find((d) => d.errors.length);
      if (failed) throw new Error(failed.errors[0].message);
      // Several "---" documents become an array.
      return docs.length === 1 ? docs[0].toJS() : docs.map((d) => d.toJS());
    }
    case 'csv': {
      const result = Papa.parse<Record<string, string>>(text.trim(), {
        header: true,
        skipEmptyLines: true,
        delimiter: opts.delimiter,
      });
      const fatal = result.errors.find((e) => e.type !== 'Delimiter');
      if (fatal) throw new Error(`Row ${(fatal.row ?? 0) + 2}: ${fatal.message}`);
      return result.data.map((row) => {
        const values: Row = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, opts.detectTypes && typeof v === 'string' ? typed(v) : v]),
        );
        return opts.nestedKeys ? unflatten(values) : values;
      });
    }
  }
}

export function stringifyData(format: DataFormat, value: unknown, opts: ConvertOptions): string {
  switch (format) {
    case 'json':
      return JSON.stringify(value, null, opts.indent);
    case 'yaml':
      return YAML.stringify(value, { indent: opts.indent, lineWidth: 0 });
    case 'csv': {
      const items = Array.isArray(value) ? value : [value];
      const rows: Row[] = items.map((item) => {
        if (!isPlainObject(item)) return { value: item };
        return opts.nestedKeys ? flatten(item) : item;
      });
      // Columns are the union of all keys, in first-seen order, so ragged objects still line up.
      const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      return Papa.unparse(
        { fields, data: rows.map((r) => fields.map((f) => cell(r[f]))) },
        { delimiter: opts.delimiter || ',', newline: '\n' },
      );
    }
  }
}

export const FORMAT_LANGUAGE: Record<DataFormat, string> = { json: 'json', yaml: 'yaml', csv: 'plaintext' };
