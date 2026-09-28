const SESSION_COOKIE = "coach_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.COACH_SESSION_SECRET;
  if (!secret) throw new Error("COACH_SESSION_SECRET not set");
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = String(expires);
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${sigHex}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.indexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigHex = token.slice(dot + 1);
    const expires = Number(payload);
    if (!Number.isFinite(expires) || Date.now() > expires) return false;
    const key = await getKey();
    const sigBytes = Uint8Array.from(
      sigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
    );
    return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
