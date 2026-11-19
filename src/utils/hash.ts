// Hashing for the Hash Generator. SHA-* use Web Crypto; MD5 is implemented here because
// Web Crypto deliberately omits it (it is broken for security, but still common for checksums).

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

// Per-round shift amounts and sine-derived constants from RFC 1321.
const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(message: Uint8Array): Uint8Array {
  // Pad: 0x80, zeros to 56 mod 64, then the bit length as a 64-bit little-endian integer.
  const paddedLength = (((message.length + 8) >> 6) + 1) << 6;
  const data = new Uint8Array(paddedLength);
  data.set(message);
  data[message.length] = 0x80;
  const view = new DataView(data.buffer);
  const bitLength = message.length * 8;
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Uint32Array(16);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true);
    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }

      const sum = (a + f + K[i] + M[g]) >>> 0;
      const shift = S[(i >> 4) * 4 + (i % 4)];
      a = d; d = c; c = b;
      b = (b + ((sum << shift) | (sum >>> (32 - shift)))) >>> 0;
    }

    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((word, i) => outView.setUint32(i * 4, word, true));
  return out;
}

/** HMAC-MD5 per RFC 2104 (block size 64 bytes). */
function hmacMd5(key: Uint8Array, message: Uint8Array): Uint8Array {
  let k = key.length > 64 ? md5(key) : key;
  const block = new Uint8Array(64);
  block.set(k);
  k = block;
  const inner = new Uint8Array(64 + message.length);
  const outer = new Uint8Array(64 + 16);
  for (let i = 0; i < 64; i++) {
    inner[i] = k[i] ^ 0x36;
    outer[i] = k[i] ^ 0x5c;
  }
  inner.set(message, 64);
  outer.set(md5(inner), 64);
  return md5(outer);
}

/** Copy into a fresh ArrayBuffer-backed view, which is what Web Crypto's typings require. */
const asBuffer = (bytes: Uint8Array) => new Uint8Array(bytes).buffer;

export async function digest(algorithm: HashAlgorithm, data: Uint8Array, hmacKey?: Uint8Array): Promise<Uint8Array> {
  if (algorithm === 'MD5') return hmacKey ? hmacMd5(hmacKey, data) : md5(data);

  if (hmacKey) {
    const key = await crypto.subtle.importKey('raw', asBuffer(hmacKey), { name: 'HMAC', hash: algorithm }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, asBuffer(data)));
  }
  return new Uint8Array(await crypto.subtle.digest(algorithm, asBuffer(data)));
}
