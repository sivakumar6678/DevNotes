import { getCache, setCache } from '../utils/cache'
import type { NoteDetailResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null)

  if (!response.ok) {
    const message = (data && data.error && data.error.message) || 'Request failed'
    const error = new Error(message) as any
    error.status = response.status
    error.payload = data
    throw error
  }

  return data
}

export async function getNote(slug: string, version: string = 'industry'): Promise<NoteDetailResponse> {
  const cacheKey = `note_${slug}_${version}`
  const cached = getCache<NoteDetailResponse>(cacheKey)
  if (cached) {
    return cached
  }

  const note = await apiFetch(`/api/notes/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`)
  setCache(cacheKey, note)
  return note
}

export async function trackView(topicId: number, versionType: string): Promise<void> {
  try {
    await apiFetch('/api/track-view', {
      method: 'POST',
      body: JSON.stringify({ topic_id: topicId, version_type: versionType }),
    })
  } catch {
    // Intentionally ignore analytics failures.
  }
}

