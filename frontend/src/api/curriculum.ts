import type { CurriculumNode, Topic, TopicNoteData, TopicPayload } from '../types'
import { getToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function fetchCurriculum(): Promise<CurriculumNode[]> {
  return apiFetch<CurriculumNode[]>('/api/topics/tree')
}

export async function createTopic(payload: TopicPayload): Promise<Topic> {
  const response = await apiFetch<{ topic: Topic }>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.topic
}

export async function updateTopic(topicId: number, payload: Partial<Pick<TopicPayload, 'name' | 'parent_id'>>): Promise<Topic> {
  const response = await apiFetch<{ topic: Topic }>(`/api/topics/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response.topic
}

export async function deleteTopic(topicId: number): Promise<{ deleted_ids: number[] }> {
  return apiFetch<{ deleted_ids: number[] }>(`/api/topics/${topicId}`, {
    method: 'DELETE',
  })
}

export async function fetchNoteByTopic(topicId: number): Promise<TopicNoteData> {
  return apiFetch<TopicNoteData>(`/api/topics/${topicId}/note`)
}

export async function createVersion(topicId: number, versionType: string, content: object) {
  return apiFetch<{ note_version: unknown }>(`/api/topics/${topicId}/note-version`, {
    method: 'POST',
    body: JSON.stringify({ version_type: versionType, content }),
  })
}
