/**
 * Simple in-memory rate limiter for API routes.
 * Replace with Redis-based limiter (e.g. @upstash/ratelimit) in production
 * if running multiple server instances.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

/**
 * Check if a request from the given key should be rate-limited.
 * @returns `{ limited: true }` if over the limit, otherwise `{ limited: false, remaining }`.
 */
export function rateLimit(
  key: string,
  opts?: { windowMs?: number; max?: number },
): { limited: boolean; remaining: number } {
  const windowMs = opts?.windowMs ?? WINDOW_MS
  const max = opts?.max ?? MAX_REQUESTS
  const now = Date.now()

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: max - 1 }
  }

  entry.count++
  if (entry.count > max) {
    return { limited: true, remaining: 0 }
  }
  return { limited: false, remaining: max - entry.count }
}

/** Periodically clean up expired entries (call on a setInterval). */
export function purgeExpired() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}
