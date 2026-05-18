import type { NoteDetailResponse } from '../types'

const CACHE_EXPIRATION_MS = 1000 * 60 * 60

interface NoteCacheEntry {
  data: NoteDetailResponse
  timestamp: number
}

const memoryStore = new Map<string, NoteCacheEntry>()

export function getNoteCacheKey(slug: string, version: string): string {
  return `note_${slug}_${version}`
}

function isFresh(entry: NoteCacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_EXPIRATION_MS
}

export function getCachedNote(slug: string, version: string): NoteDetailResponse | null {
  const cacheKey = getNoteCacheKey(slug, version)
  const memoryEntry = memoryStore.get(cacheKey)

  if (memoryEntry) {
    if (isFresh(memoryEntry)) {
      return memoryEntry.data
    }
    memoryStore.delete(cacheKey)
  }

  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) {
      return null
    }

    const localEntry = JSON.parse(raw) as NoteCacheEntry
    if (!isFresh(localEntry)) {
      localStorage.removeItem(cacheKey)
      return null
    }

    memoryStore.set(cacheKey, localEntry)
    return localEntry.data
  } catch {
    localStorage.removeItem(cacheKey)
    return null
  }
}

export function setCachedNote(slug: string, version: string, data: NoteDetailResponse): void {
  const cacheKey = getNoteCacheKey(slug, version)
  const entry: NoteCacheEntry = {
    data,
    timestamp: Date.now(),
  }

  memoryStore.set(cacheKey, entry)

  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch {
    // Keep the in-memory cache even if persistence fails.
  }
}
