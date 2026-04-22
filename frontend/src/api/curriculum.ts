import type { CurriculumNode, Topic, TopicNoteData, TopicPayload, Technology } from '../types'
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

function normalizeCurriculumNode(node: CurriculumNode): CurriculumNode {
  return {
    ...node,
    children: node.children.map(normalizeCurriculumNode),
  }
}

export async function fetchCurriculum(technologyId: number): Promise<CurriculumNode[]> {
  const nodes = await apiFetch<CurriculumNode[]>(`/api/topics/technology/${technologyId}`)
  return nodes.map(normalizeCurriculumNode)
}

export async function fetchTechnologies(): Promise<Technology[]> {
  const response = await apiFetch<{ data: Technology[] }>('/api/technologies')
  return response.data || []
}

export async function createTechnology(payload: { name: string, slug: string, description?: string }): Promise<Technology> {
  const response = await apiFetch<{ technology: Technology }>('/api/technologies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.technology
}

export async function fetchCurriculumByParentId(parentId: number): Promise<CurriculumNode[]> {
  const nodes = await apiFetch<CurriculumNode[]>(`/api/topics/${parentId}/children`)
  return nodes.map(normalizeCurriculumNode)
}

export async function createTopic(payload: TopicPayload): Promise<Topic> {
  console.log('DEBUG: Sending createTopic payload:', payload)
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
  return apiFetch<{ note_version: unknown }>('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId, version_type: versionType, content }),
  })
}
