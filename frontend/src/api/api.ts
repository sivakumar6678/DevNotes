import { getCache, setCache } from '../utils/cache'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export type Technology = {
  name: string
  slug: string
}

export type Topic = {
  name: string
  slug: string
}

export type NoteVersion = {
  definition?: string
  problem_it_solves?: string
  detailed_explanation?: string
  core_concepts?: Array<{ name?: string; explanation?: string }>
  how_it_works?: string
  syntax?: string
  code_example?: string
  practical_example?: string
  real_world_example?: string
  common_mistakes?: string[]
  best_practices?: string[]
  interview_notes?: string[]
}

export type Note = {
  id?: number
  slug: string
  title: string
  topic: string
  versions: Record<string, NoteVersion>
}

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

export async function getTechnologies(): Promise<Technology[]> {
  const cacheKey = 'technologies'
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const technologies = await apiFetch<Technology[]>('/api/technologies')
  setCache(cacheKey, technologies)
  return technologies
}

export async function getTopics(techSlug: string): Promise<Topic[]> {
  const cacheKey = `topics:${techSlug}`
  const cached = getCache(cacheKey)
  if (cached) {
    return cached
  }

  const topics = await apiFetch<Topic[]>(`/api/topics/${encodeURIComponent(techSlug)}`)
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
