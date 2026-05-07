import { useEffect, useRef, useState } from 'react'
import { getNote } from '../api/notesApi'
import type { NoteDetailResponse } from '../types'

const defaultVersion = 'simple'
const CACHE_EXPIRATION_MS = 1000 * 60 * 60 // 1 hour cache expiration

// In-memory cache object
const memoryCache: Record<string, { data: NoteDetailResponse, timestamp: number }> = {}

export async function preloadNote(slug: string, version: string = defaultVersion): Promise<void> {
  const cacheKey = `${slug}_${version}`
  const now = Date.now()

  // 1. Check memory cache
  const memCached = memoryCache[cacheKey]
  if (memCached && now - memCached.timestamp < CACHE_EXPIRATION_MS) {
    return
  }

  // 2. Check localStorage persistence
  try {
    const localCachedStr = localStorage.getItem(cacheKey)
    if (localCachedStr) {
      const localCached = JSON.parse(localCachedStr)
      if (now - localCached.timestamp < CACHE_EXPIRATION_MS) {
        memoryCache[cacheKey] = localCached
        return
      } else {
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (e) {
    console.error('Failed to parse cache from localStorage', e)
  }

  // 3. Fetch and cache
  try {
    const data = await getNote(slug, version)
    const cachePayload = { data, timestamp: Date.now() }
    memoryCache[cacheKey] = cachePayload
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cachePayload))
    } catch (e) {
      console.error('Failed to save cache to localStorage', e)
    }
  } catch (err) {
    // Silently fail on preload
  }
}

/**
 * Try to read a cached note (memory or localStorage).
 * Returns null if nothing is cached or cache is expired.
 */
function readCachedNote(slug: string, version: string): NoteDetailResponse | null {
  const cacheKey = `${slug}_${version}`
  const now = Date.now()

  // 1. Memory cache
  const memCached = memoryCache[cacheKey]
  if (memCached && now - memCached.timestamp < CACHE_EXPIRATION_MS) {
    return memCached.data
  }

  // 2. localStorage
  try {
    const localCachedStr = localStorage.getItem(cacheKey)
    if (localCachedStr) {
      const localCached = JSON.parse(localCachedStr)
      if (now - localCached.timestamp < CACHE_EXPIRATION_MS) {
        memoryCache[cacheKey] = localCached
        return localCached.data
      } else {
        localStorage.removeItem(cacheKey)
      }
    }
  } catch (e) {
    console.error('Failed to parse cache from localStorage', e)
  }

  return null
}

/**
 * Write a note response into both memory and localStorage cache.
 */
function writeCachedNote(slug: string, version: string, data: NoteDetailResponse): void {
  const cacheKey = `${slug}_${version}`
  const cachePayload = { data, timestamp: Date.now() }
  memoryCache[cacheKey] = cachePayload
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cachePayload))
  } catch (e) {
    console.error('Failed to save cache to localStorage', e)
  }
}

export function useNote(slug: string | undefined) {
  const [note, setNote] = useState<NoteDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // True only during the very first load (no cached data available).
  // Subsequent slug changes that hit cache won't show a full-page loader.
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion)

  // Keep a ref to the previous note so we can show stale content during transitions
  const prevNoteRef = useRef<NoteDetailResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadNote() {
      if (!slug) {
        setNote(null)
        setLoading(false)
        setIsTransitioning(false)
        return
      }

      // 1. Try cache — show instantly if available
      const cached = readCachedNote(slug, selectedVersion)
      if (cached) {
        setNote(cached)
        prevNoteRef.current = cached
        setLoading(false)
        setIsTransitioning(false)
        return
      }

      // 2. No cache — keep previous note visible (stale-while-revalidate)
      // Only show full loading state if there's no previous note at all
      if (prevNoteRef.current) {
        // Keep showing previous content, just signal a transition
        setIsTransitioning(true)
        setLoading(false)
      } else {
        setLoading(true)
        setIsTransitioning(false)
      }
      setError(null)

      // 3. Fetch from network
      try {
        const data = await getNote(slug, selectedVersion)
        if (!cancelled) {
          writeCachedNote(slug, selectedVersion, data)
          setNote(data)
          prevNoteRef.current = data

          if (data.fallback && data.version && data.version !== selectedVersion) {
            writeCachedNote(slug, data.version, data)
            setSelectedVersion(data.version)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setNote(null)
          prevNoteRef.current = null
          setError(err instanceof Error ? err : new Error('Note not found'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsTransitioning(false)
        }
      }
    }

    loadNote()

    return () => {
      cancelled = true
    }
  }, [slug, selectedVersion])

  const resolvedVersion = note?.version || selectedVersion

  return {
    note,
    loading,
    isTransitioning,
    error,
    version: resolvedVersion,
    setVersion: setSelectedVersion,
  }
}
