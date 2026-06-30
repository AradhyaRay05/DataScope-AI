const store = new Map<string, { count: number; resetAt: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

export function rateLimitResponse(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": String(
      Math.ceil((result.resetAt - Date.now()) / 1000)
    ),
  };
}

export const RATE_LIMITS = {
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  api: { maxRequests: 200, windowMs: 60 * 1000 },
  search: { maxRequests: 60, windowMs: 60 * 1000 },
  report: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
} as const;
