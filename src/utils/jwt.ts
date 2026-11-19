import { base64ToBytes, utf8Decode, utf8Encode } from './encoding';

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: unknown;
  /** `header.payload` exactly as it appeared, which is what the signature covers. */
  signingInput: string;
  signature: Uint8Array;
  parts: [string, string, string];
}

const decodeJsonPart = (part: string, name: string) => {
  let text: string;
  try {
    text = utf8Decode(base64ToBytes(part));
  } catch {
    throw new Error(`The ${name} is not valid base64url`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The ${name} is not valid JSON`);
  }
};

export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim().replace(/^Bearer\s+/i, '');
  const parts = trimmed.split('.');
  if (parts.length === 5) throw new Error('This looks like an encrypted JWE token, which cannot be decoded without the key');
  if (parts.length !== 3) throw new Error(`A JWT has 3 parts separated by dots; this one has ${parts.length}`);

  const header = decodeJsonPart(parts[0], 'header');
  if (typeof header !== 'object' || header === null || Array.isArray(header)) throw new Error('The header must be a JSON object');

  return {
    header,
    payload: decodeJsonPart(parts[1], 'payload'),
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: parts[2] ? base64ToBytes(parts[2]) : new Uint8Array(),
    parts: parts as [string, string, string],
  };
}

// ---- Signature verification (Web Crypto) ----

export type KeyKind = 'secret' | 'publicKey';

interface AlgSpec {
  kind: KeyKind;
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
  importParams: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams;
  verifyParams: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
}

const hashFor = (bits: string) => `SHA-${bits}` as AlgSpec['hash'];

export function algorithmSpec(alg: string): AlgSpec | null {
  const match = /^(HS|RS|PS|ES)(256|384|512)$/.exec(alg);
  if (!match) return null;
  const [, family, bits] = match;
  const hash = hashFor(bits);
  switch (family) {
    case 'HS':
      return { kind: 'secret', hash, importParams: { name: 'HMAC', hash }, verifyParams: { name: 'HMAC' } };
    case 'RS':
      return { kind: 'publicKey', hash, importParams: { name: 'RSASSA-PKCS1-v1_5', hash }, verifyParams: { name: 'RSASSA-PKCS1-v1_5' } };
    case 'PS':
      return { kind: 'publicKey', hash, importParams: { name: 'RSA-PSS', hash }, verifyParams: { name: 'RSA-PSS', saltLength: Number(bits) / 8 } };
    default: {
      // ES512 uses P-521 (not P-512).
      const namedCurve = bits === '512' ? 'P-521' : `P-${bits}`;
      return { kind: 'publicKey', hash, importParams: { name: 'ECDSA', namedCurve }, verifyParams: { name: 'ECDSA', hash } };
    }
  }
}

/** Parse a PEM "PUBLIC KEY" (SPKI) block, or a public JWK in JSON form. */
async function importPublicKey(text: string, spec: AlgSpec) {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    const jwk = JSON.parse(trimmed) as JsonWebKey;
    return crypto.subtle.importKey('jwk', jwk, spec.importParams, false, ['verify']);
  }
  if (/BEGIN RSA PUBLIC KEY/.test(trimmed)) {
    throw new Error('PKCS#1 "RSA PUBLIC KEY" is not supported; use an SPKI "PUBLIC KEY" PEM or a JWK');
  }
  const body = trimmed.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '');
  const der = base64ToBytes(body);
  return crypto.subtle.importKey('spki', new Uint8Array(der).buffer, spec.importParams, false, ['verify']);
}

export async function verifyJwt(decoded: DecodedJwt, keyText: string, secretEncoding: 'utf8' | 'base64' = 'utf8') {
  const alg = String(decoded.header.alg ?? '');
  if (alg === 'none') throw new Error('Algorithm "none" means the token is unsigned');
  const spec = algorithmSpec(alg);
  if (!spec) throw new Error(`Algorithm "${alg}" is not supported for verification`);

  const key = spec.kind === 'secret'
    ? await crypto.subtle.importKey(
        'raw',
        new Uint8Array(secretEncoding === 'base64' ? base64ToBytes(keyText) : utf8Encode(keyText)).buffer,
        spec.importParams, false, ['verify'])
    : await importPublicKey(keyText, spec);

  return crypto.subtle.verify(
    spec.verifyParams,
    key,
    new Uint8Array(decoded.signature).buffer,
    new Uint8Array(utf8Encode(decoded.signingInput)).buffer,
  );
}

// ---- Claims ----

export const TIME_CLAIMS = ['exp', 'nbf', 'iat', 'auth_time'] as const;

export const CLAIM_NAMES: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT ID',
  auth_time: 'Authenticated',
  azp: 'Authorized party',
  scope: 'Scope',
};
