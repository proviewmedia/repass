import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto";

// Per-tenant OAuth tokens (Square access/refresh tokens, webhook signature keys)
// need to sit in the DB as ciphertext, not plaintext. AES-256-GCM gives us
// tamper-detection (the auth tag) alongside confidentiality with one call.
function getEncryptionKey(): Buffer {
  const key = process.env.POS_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("POS_TOKEN_ENCRYPTION_KEY is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("POS_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return buf;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decrypt(payload: string): string {
  const [ivB64, authTagB64, ciphertextB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error("Malformed encrypted payload");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

// Signed, expiring OAuth `state` param — proves the callback belongs to the
// business that initiated the connect flow, and can't be replayed after expiry.
const STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret(): string {
  const secret = process.env.SQUARE_OAUTH_STATE_SECRET;
  if (!secret) throw new Error("SQUARE_OAUTH_STATE_SECRET is not set");
  return secret;
}

export function signState(businessId: string): string {
  const nonce = randomBytes(9).toString("base64url");
  const expiresAt = Date.now() + STATE_TTL_MS;
  const payload = `${businessId}:${nonce}:${expiresAt}`;
  const signature = createHmac("sha256", getStateSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyState(state: string): { businessId: string } | null {
  const [payloadB64, signature] = state.split(".");
  if (!payloadB64 || !signature) return null;

  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSignature = createHmac("sha256", getStateSecret()).update(payload).digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [businessId, , expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!businessId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return { businessId };
}
