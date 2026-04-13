import { useEffect, useState } from 'react'
import { getNoteBySlug } from '../data/docsData'

const defaultVersion = 'simple'

export function useNote(slug) {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setSelectedVersion(defaultVersion)

    if (!slug) {
      setNote(null)
      setLoading(false)
      return
    }

    const data = getNoteBySlug(slug)
    if (!data) {
      setNote(null)
      setError(new Error('Note not found'))
      setLoading(false)
      return
    }

    setNote(data)
    setLoading(false)
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
