import { getCache, setCache } from '../utils/cache'
import type { Technology, Topic, Note } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
    const error = new Error(message) as Error & { status?: number; payload?: unknown }
    error.status = response.status
    error.payload = data
    throw error
  }

  return data as T
}

type ApiListResponse<T> = {
  status?: string
  data?: T
  topics?: T
  technologies?: T
}

export async function getTechnologies(): Promise<Technology[]> {
  const cacheKey = 'technologies'
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const response = await apiFetch<ApiListResponse<Technology[]>>('/api/technologies')
  const technologies = response.data ?? response.technologies ?? (Array.isArray(response) ? response : [])

  if (!Array.isArray(technologies)) {
    throw new Error('Unexpected technologies response format')
  }

  setCache(cacheKey, technologies)
  return technologies
}

export async function getTopics(techSlug: string): Promise<Topic[]> {
  const cacheKey = `topics:${techSlug}`
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const response = await apiFetch<ApiListResponse<Topic[]>>(
    `/api/topics/${encodeURIComponent(techSlug)}`
  )
  const topics = response.topics ?? response.data ?? (Array.isArray(response) ? response : [])

  if (!Array.isArray(topics)) {
    throw new Error('Unexpected topics response format')
  }

  setCache(cacheKey, topics)
  return topics
}

export async function getNote(slug: string): Promise<Note> {
  const cacheKey = `note:${slug}`
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const note = await apiFetch<Note>(`/api/notes/${encodeURIComponent(slug)}`)
  setCache(cacheKey, note)
  return note
}
