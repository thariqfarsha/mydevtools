// Identifier generators. All randomness comes from crypto.getRandomValues.

const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const formatUuid = (bytes: Uint8Array) => {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

/** RFC 9562 version 4: 122 random bits. */
export function uuidV4() {
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return formatUuid(b);
}

/** RFC 9562 version 7: 48-bit Unix ms timestamp followed by random bits, so IDs sort by creation time. */
export function uuidV7(timestampMs = Date.now()) {
  const b = randomBytes(16);
  let ts = timestampMs;
  for (let i = 5; i >= 0; i--) {
    b[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return formatUuid(b);
}

// Crockford base32 (no I, L, O, U).
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const encodeBase32 = (value: bigint, length: number) => {
  let out = '';
  for (let i = 0; i < length; i++) {
    out = CROCKFORD[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
};

const MAX_RANDOM_80 = (1n << 80n) - 1n;

/**
 * Monotonic ULID factory: IDs made within the same millisecond increment the random part,
 * so a batch stays strictly sortable (per the ULID spec).
 */
export function createUlidFactory() {
  let lastTime = -1;
  let lastRandom = 0n;
  return (timestampMs = Date.now()) => {
    if (timestampMs === lastTime && lastRandom < MAX_RANDOM_80) {
      lastRandom += 1n;
    } else {
      lastTime = timestampMs;
      lastRandom = BigInt(`0x${hex(randomBytes(10))}`);
    }
    return encodeBase32(BigInt(timestampMs), 10) + encodeBase32(lastRandom, 16);
  };
}

/** Extract the embedded creation time (ms) from a UUIDv7 or ULID, or null for other IDs. */
export function idTimestamp(id: string): number | null {
  const uuid = id.replace(/[{}-]/g, '').toLowerCase();
  if (/^[0-9a-f]{32}$/.test(uuid) && uuid[12] === '7') return parseInt(uuid.slice(0, 12), 16);
  const ulid = id.toUpperCase();
  if (/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(ulid)) {
    let ms = 0;
    for (const ch of ulid.slice(0, 10)) ms = ms * 32 + CROCKFORD.indexOf(ch);
    return ms;
  }
  return null;
}
