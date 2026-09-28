const ATHLETE_SESSION_COOKIE = "athlete_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.ATHLETE_SESSION_SECRET;
  if (!secret) throw new Error("ATHLETE_SESSION_SECRET not set");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAthleteSessionToken(athleteId: string): Promise<string> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${athleteId}|${expires}`;
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${sigHex}`;
}

export async function verifyAthleteSessionToken(token: string): Promise<string | null> {
  try {
    const lastDot = token.lastIndexOf(".");
    if (lastDot === -1) return null;
    const payload = token.slice(0, lastDot);
    const sigHex = token.slice(lastDot + 1);
    const pipeIdx = payload.indexOf("|");
    if (pipeIdx === -1) return null;
    const athleteId = payload.slice(0, pipeIdx);
    const expires = Number(payload.slice(pipeIdx + 1));
    if (!athleteId || !Number.isFinite(expires) || Date.now() > expires) return null;
    const key = await getKey();
    const sigBytes = Uint8Array.from(sigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payload));
    return valid ? athleteId : null;
  } catch {
    return null;
  }
}

export { ATHLETE_SESSION_COOKIE };
