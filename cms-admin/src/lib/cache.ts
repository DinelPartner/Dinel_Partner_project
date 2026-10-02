/**
 * Best-effort in-memory cache for public read endpoints.
 *
 * IMPORTANT caveat (documented here and in the report): Vercel serverless
 * functions are not guaranteed to stay warm between invocations. A cold
 * start gets a fresh module scope, so this Map can reset at any time — this
 * is a free, secondary optimization for the (common) case where the
 * function instance happens to still be warm, NOT a reliability guarantee.
 * The actual reliable caching mechanism is the `Cache-Control: s-maxage=...`
 * response header (see src/pages/api/posts.ts and posts/[slug].ts), which
 * Vercel's edge network honors independently of function warmth.
 */

const TTL_MS = 60_000;

const store = new Map<string, { value: unknown; expiresAt: number }>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

/**
 * Called after any admin write (create/update/delete/publish). There is no
 * way to push an invalidation to Vercel's edge cache from inside a
 * serverless function on this account tier, so this only clears the
 * in-memory Map (the secondary cache) for *this* warm instance. The edge
 * cache (the primary, reliable one) is left to expire naturally via its
 * `s-maxage=60` TTL — meaning content can be up to ~60s stale after an edit.
 * This is a deliberate, stated trade-off (see report §14), not an oversight.
 */
export function cacheInvalidateAll(): void {
  store.clear();
}
