import { useEffect, useState } from 'react'
import { getNote } from '../api/api'

const defaultVersion = 'simple'

export function useNote(slug) {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion)

  useEffect(() => {
    let cancelled = false

    async function loadNote() {
      setLoading(true)
      setError(null)
      setSelectedVersion(defaultVersion)

      if (!slug) {
        setNote(null)
        setLoading(false)
        return
      }

      try {
        const data = await getNote(slug)
        if (!cancelled) {
          setNote(data)
        }
      } catch (err) {
        if (!cancelled) {
          setNote(null)
          setError(err instanceof Error ? err : new Error('Note not found'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadNote()

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!note?.versions) {
      return
    }
    if (!note.versions[selectedVersion]) {
      const first = Object.keys(note.versions)[0] || defaultVersion
      setSelectedVersion(first)
    }
  }, [note, selectedVersion])

  const resolvedVersion = (() => {
    if (!note?.versions) return defaultVersion
    if (note.versions[selectedVersion]) return selectedVersion
    return Object.keys(note.versions)[0] || defaultVersion
  })()

  return {
    note,
    loading,
    error,
    version: resolvedVersion,
    setVersion: setSelectedVersion,
  }
}
