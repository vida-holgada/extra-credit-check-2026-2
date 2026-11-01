const encoder = new TextEncoder();
const CONTEXT = 'extra-credit:2026-2:';
export const ITERATIONS = 210000;

function fromBase64(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function toBase64(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)));
}

export async function recordPath(studentId) {
  if (!/^\d{8}$/.test(studentId)) throw new Error('invalid_id');
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(CONTEXT + studentId));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') + '.json';
}

async function keyFor(studentId, salt, usage) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(CONTEXT + studentId), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:ITERATIONS, hash:'SHA-256'}, material, {name:'AES-GCM', length:256}, false, [usage]);
}

export async function encryptRecord(studentId, value) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(studentId, salt, 'encrypt');
  const encrypted = await crypto.subtle.encrypt({name:'AES-GCM', iv, additionalData:encoder.encode(CONTEXT + studentId)}, key, encoder.encode(JSON.stringify(value)));
  return {version:1, salt:toBase64(salt), iv:toBase64(iv), data:toBase64(encrypted)};
}

export async function decryptRecord(studentId, envelope) {
  if (envelope?.version !== 1) throw new Error('unsupported_record');
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('invalid_record');
  const key = await keyFor(studentId, salt, 'decrypt');
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv, additionalData:encoder.encode(CONTEXT + studentId)}, key, fromBase64(envelope.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
