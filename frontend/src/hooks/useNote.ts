import { useEffect, useRef, useState } from 'react'
import { DEFAULT_VERSION } from '../constants'
import { getNote } from '../api/notesApi'
import { getCachedNote, setCachedNote } from '../store/noteCache'
import type { NoteDetailResponse } from '../types'

export async function preloadNote(slug: string, version: string = DEFAULT_VERSION): Promise<void> {
  if (getCachedNote(slug, version)) {
    return
  }

  try {
    const data = await getNote(slug, version)
    setCachedNote(slug, version, data)
  } catch {
    // Silently fail on preload.
  }
}

export function useNote(slug: string | undefined) {
  const [note, setNote] = useState<NoteDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedVersion, setSelectedVersion] = useState(DEFAULT_VERSION)
  const previousSlugRef = useRef<string | undefined>(undefined)
  const visibleNoteRef = useRef<NoteDetailResponse | null>(null)

  useEffect(() => {
    visibleNoteRef.current = note
  }, [note])

  useEffect(() => {
    let cancelled = false

    async function loadNote() {
      if (!slug) {
        setNote(null)
        setLoading(false)
        setIsTransitioning(false)
        setError(null)
        return
      }

      const cached = getCachedNote(slug, selectedVersion)
      if (cached) {
        setNote(cached)
        setLoading(false)
        setIsTransitioning(false)
        setError(null)
        previousSlugRef.current = slug
        return
      }

      const hasVisibleContent = Boolean(visibleNoteRef.current)
      const isSlugChange =
        previousSlugRef.current !== undefined && previousSlugRef.current !== slug

      setLoading(!hasVisibleContent)
      setIsTransitioning(hasVisibleContent || isSlugChange)
      setError(null)

      try {
        const data = await getNote(slug, selectedVersion)
        if (cancelled) {
          return
        }

        setCachedNote(slug, selectedVersion, data)
        setNote(data)
        previousSlugRef.current = slug

        if (data.fallback && data.version && data.version !== selectedVersion) {
          setCachedNote(slug, data.version, data)
          setSelectedVersion(data.version)
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        setError(err instanceof Error ? err : new Error('Note not found'))
        if (!visibleNoteRef.current) {
          setNote(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsTransitioning(false)
        }
      }
    }

    void loadNote()

    return () => {
      cancelled = true
    }
  }, [selectedVersion, slug])

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
