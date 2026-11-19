// Cron parser and schedule calculator (standard 5-field, or 6 fields with seconds first).

export type FieldKey = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

interface FieldSpec {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  names?: string[];
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const SPECS: Record<FieldKey, FieldSpec> = {
  second: { key: 'second', label: 'Second', min: 0, max: 59 },
  minute: { key: 'minute', label: 'Minute', min: 0, max: 59 },
  hour: { key: 'hour', label: 'Hour', min: 0, max: 23 },
  dayOfMonth: { key: 'dayOfMonth', label: 'Day of month', min: 1, max: 31 },
  month: { key: 'month', label: 'Month', min: 1, max: 12, names: MONTHS },
  // 7 is also Sunday.
  dayOfWeek: { key: 'dayOfWeek', label: 'Day of week', min: 0, max: 7, names: DAYS },
};

export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

export interface ParsedField {
  key: FieldKey;
  label: string;
  raw: string;
  values: Set<number>;
  /** True for "*" or "?": the field doesn't restrict anything. */
  any: boolean;
  /** Short human summary of the allowed values. */
  summary: string;
}

export interface ParsedCron {
  expression: string;
  hasSeconds: boolean;
  fields: ParsedField[];
}

function parseValue(token: string, spec: FieldSpec): number {
  const upper = token.toUpperCase();
  const named = spec.names?.indexOf(upper) ?? -1;
  if (named >= 0) return named + spec.min;
  if (!/^\d+$/.test(token)) {
    if (/^(L|W|#|\d+[LW#])/i.test(token) || token.includes('#')) {
      throw new Error(`${spec.label}: "${token}" is Quartz-only syntax (L, W, #), which standard cron doesn't support`);
    }
    throw new Error(`${spec.label}: "${token}" is not a number${spec.names ? ` or a name like ${spec.names[0]}` : ''}`);
  }
  const n = Number(token);
  if (n < spec.min || n > spec.max) throw new Error(`${spec.label}: ${n} is out of range ${spec.min}–${spec.max}`);
  return n;
}

const nameOf = (spec: FieldSpec, n: number) => {
  if (spec.key === 'dayOfWeek') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][n];
  if (spec.key === 'month') return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][n - 1];
  return String(n);
};

function parseField(raw: string, spec: FieldSpec): ParsedField {
  const values = new Set<number>();
  const any = raw === '*' || raw === '?';
  for (const part of raw.split(',')) {
    if (!part) throw new Error(`${spec.label}: empty list item in "${raw}"`);
    const [range, stepText, extra] = part.split('/');
    if (extra !== undefined) throw new Error(`${spec.label}: "${part}" has more than one "/"`);
    let step = 1;
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) === 0) throw new Error(`${spec.label}: step "${stepText}" must be a positive number`);
      step = Number(stepText);
    }
    let lo: number;
    let hi: number;
    if (range === '*' || range === '?') {
      lo = spec.min;
      hi = spec.key === 'dayOfWeek' ? 6 : spec.max;
    } else if (range.includes('-')) {
      const [a, b] = range.split('-');
      lo = parseValue(a, spec);
      hi = parseValue(b, spec);
      if (lo > hi) throw new Error(`${spec.label}: range "${range}" goes backwards`);
    } else {
      lo = parseValue(range, spec);
      // "5/15" means "from 5, every 15".
      hi = stepText !== undefined ? (spec.key === 'dayOfWeek' ? 6 : spec.max) : lo;
    }
    for (let v = lo; v <= hi; v += step) values.add(spec.key === 'dayOfWeek' && v === 7 ? 0 : v);
  }

  const sorted = [...values].sort((a, b) => a - b);
  let summary: string;
  if (any) summary = 'every';
  else if (sorted.length > 12) summary = `${sorted.length} values`;
  else summary = sorted.map((v) => nameOf(spec, v)).join(', ');
  return { key: spec.key, label: spec.label, raw, values, any, summary };
}

export function parseCron(input: string): ParsedCron {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Enter a cron expression');
  if (trimmed.toLowerCase() === '@reboot') throw new Error('@reboot runs once when the cron daemon starts, so it has no schedule');
  const expression = MACROS[trimmed.toLowerCase()] ?? trimmed;
  const parts = expression.split(' ');
  if (parts.length !== 5 && parts.length !== 6) {
    throw new Error(`Expected 5 fields (minute hour day month weekday) or 6 with seconds, got ${parts.length}`);
  }
  const hasSeconds = parts.length === 6;
  const keys: FieldKey[] = hasSeconds
    ? ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
    : ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'];
  return { expression, hasSeconds, fields: keys.map((k, i) => parseField(parts[i], SPECS[k])) };
}

/** The next `count` run times after `from`, in local time or UTC. Gives up after ~5 years of searching. */
export function nextRuns(cron: ParsedCron, from: Date, count: number, utc: boolean): Date[] {
  const f = Object.fromEntries(cron.fields.map((x) => [x.key, x])) as Record<FieldKey, ParsedField>;
  const d = new Date(from.getTime());
  const U = utc;
  const get = {
    month: () => (U ? d.getUTCMonth() : d.getMonth()) + 1,
    date: () => (U ? d.getUTCDate() : d.getDate()),
    day: () => (U ? d.getUTCDay() : d.getDay()),
    hour: () => (U ? d.getUTCHours() : d.getHours()),
    minute: () => (U ? d.getUTCMinutes() : d.getMinutes()),
    second: () => (U ? d.getUTCSeconds() : d.getSeconds()),
  };
  const nextMonth = () => (U ? (d.setUTCMonth(d.getUTCMonth() + 1, 1), d.setUTCHours(0, 0, 0, 0)) : (d.setMonth(d.getMonth() + 1, 1), d.setHours(0, 0, 0, 0)));
  const nextDay = () => (U ? (d.setUTCDate(d.getUTCDate() + 1), d.setUTCHours(0, 0, 0, 0)) : (d.setDate(d.getDate() + 1), d.setHours(0, 0, 0, 0)));
  const nextHour = () => (U ? d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0) : d.setHours(d.getHours() + 1, 0, 0, 0));
  const nextMinute = () => (U ? d.setUTCMinutes(d.getUTCMinutes() + 1, 0, 0) : d.setMinutes(d.getMinutes() + 1, 0, 0));
  const nextSecond = () => d.setTime(d.getTime() + 1000);

  // Standard (Vixie) cron: when both day fields are restricted, a day matches if EITHER matches.
  const dayMatches = () => {
    const dom = f.dayOfMonth.values.has(get.date());
    const dow = f.dayOfWeek.values.has(get.day());
    if (f.dayOfMonth.any) return dow;
    if (f.dayOfWeek.any) return dom;
    return dom || dow;
  };

  // Start just after `from`, on a whole second/minute.
  d.setMilliseconds(0);
  if (cron.hasSeconds) nextSecond();
  else nextMinute();

  const limit = from.getTime() + 5 * 366 * 86_400_000;
  const runs: Date[] = [];
  while (runs.length < count && d.getTime() < limit) {
    if (!f.month.values.has(get.month())) nextMonth();
    else if (!dayMatches()) nextDay();
    else if (!f.hour.values.has(get.hour())) nextHour();
    else if (!f.minute.values.has(get.minute())) nextMinute();
    else if (cron.hasSeconds && !f.second.values.has(get.second())) nextSecond();
    else {
      runs.push(new Date(d.getTime()));
      if (cron.hasSeconds) nextSecond();
      else nextMinute();
    }
  }
  return runs;
}
