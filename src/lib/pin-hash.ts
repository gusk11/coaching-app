// PBKDF2-based PIN hashing via Web Crypto API — no external deps, runs in all Next.js runtimes.

const ITERATIONS = 100_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;
const PREFIX = "pbkdf2v1";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
}

async function deriveKey(pin: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    keyMaterial,
    KEY_BITS
  );
  return toHex(new Uint8Array(bits));
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await deriveKey(pin, salt);
  return `${PREFIX}:${toHex(salt)}:${hash}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  if (!stored.startsWith(`${PREFIX}:`)) {
    // Plaintext fallback for existing unhashed PINs — constant-time compare
    if (pin.length !== stored.length) return false;
    let diff = 0;
    for (let i = 0; i < pin.length; i++) diff |= pin.charCodeAt(i) ^ stored.charCodeAt(i);
    return diff === 0;
  }
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const salt = fromHex(parts[1]);
  const expected = parts[2];
  const actual = await deriveKey(pin, salt);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function isPinHashed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}:`);
}
