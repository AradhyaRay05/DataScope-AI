interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;
  private maxSize: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.misses++;
      return null;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    entry.hits++;
    this.hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) {
      this.evict();
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  stats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hitRate: total > 0 ? Math.round((this.hits / total) * 1000) / 10 : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
    };
  }

  startCleanup(intervalMs = 60_000): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this.cleanup(), intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(key);
    }
  }

  private evict(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    let leastHits = Infinity;

    for (const [key, entry] of this.store) {
      const score = entry.hits * 1000 + (Date.now() - entry.createdAt);
      if (score < leastHits * 1000 + oldestTime) {
        oldestKey = key;
        oldestTime = entry.createdAt;
        leastHits = entry.hits;
      }
    }

    if (oldestKey) this.store.delete(oldestKey);
  }
}

export const cache = new MemoryCache(500);
cache.startCleanup();

export const CACHE_TTL = {
  DATASET_LIST: 30_000,
  DATASET_DETAIL: 60_000,
  DASHBOARD_STATS: 30_000,
  SEARCH_RESULTS: 15_000,
  USER_SETTINGS: 300_000,
  PROFILE_DATA: 120_000,
  CORRELATION: 120_000,
} as const;

export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter((p) => p !== undefined).join(":");
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== null) return hit;

  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

export function invalidateDatasetCaches(userId: string): void {
  cache.deletePattern(`datasets:${userId}`);
  cache.deletePattern(`dashboard:${userId}`);
  cache.deletePattern(`search:${userId}`);
}
