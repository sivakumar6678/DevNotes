/**
 * Lightweight in-memory cache with per-entry TTL.
 *
 * Key design decisions:
 * - In-memory (Map) → zero serialisation overhead, survives the page session.
 * - TTL enforced on read, not on a timer, keeping the code simple.
 * - Typed with generics so callers get full type inference.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number // Date.now() + ttl
}

const store = new Map<string, CacheEntry<unknown>>()

/** Default TTL: 5 minutes (matches backend cache). */
const DEFAULT_TTL_MS = 5 * 60 * 1000

/**
 * Read a cached value. Returns `undefined` if the key is missing or expired.
 */
export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * Store a value in the cache.
 *
 * @param key    Cache key
 * @param value  Value to store
 * @param ttlMs  Time-to-live in milliseconds (default: 5 min)
 */
export function setCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

/**
 * Explicitly remove a key (useful after a write/mutation).
 */
export function deleteCache(key: string): void {
  store.delete(key)
}

/**
 * Remove all entries whose key starts with a given prefix.
 * Handy for invalidating a whole resource group, e.g. `invalidatePrefix('note_')`.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
