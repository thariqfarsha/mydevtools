// Byte/text encoding helpers shared by the encoder, JWT and hash tools.

export const utf8Encode = (text: string) => new TextEncoder().encode(text);

/** Decode UTF-8, throwing on invalid byte sequences instead of inserting U+FFFD. */
export const utf8Decode = (bytes: Uint8Array) => new TextDecoder('utf-8', { fatal: true }).decode(bytes);

export function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  // Chunked so large inputs don't overflow the argument limit of String.fromCharCode.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Accepts standard or URL-safe base64, with or without padding and whitespace. */
export function base64ToBytes(input: string) {
  let b64 = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) throw new Error('Invalid base64 characters');
  b64 = b64.replace(/=+$/, '');
  if (b64.length % 4 === 1) throw new Error('Invalid base64 length');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export const toBase64Url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
