import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || "csrf-fallback-secret";

function hmac(data: string): string {
  return crypto.createHmac("sha256", CSRF_SECRET).update(data).digest("hex");
}

export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString(36);
  const signature = hmac(`${sessionId}:${timestamp}`);
  return `${timestamp}.${signature}`;
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;
  const expectedSig = hmac(`${sessionId}:${timestamp}`);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false;
  }

  const tokenTime = parseInt(timestamp, 36);
  const maxAge = 60 * 60 * 1000;
  return Date.now() - tokenTime < maxAge;
}
