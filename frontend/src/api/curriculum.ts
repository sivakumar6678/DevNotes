import type { CurriculumNode, TopicNoteData, TopicPayload, Technology } from '../types'
import { apiFetch } from './auth'

// ─── Technologies ─────────────────────────────────────────────────────────────

export async function fetchTechnologies(): Promise<Technology[]> {
  const response = await apiFetch<{ data: Technology[] }>('/api/technologies')
  return response.data || []
}

export async function createTechnology(payload: {
  name: string
  slug?: string
  description?: string
  icon_url?: string
  color?: string
  sort_order?: number
}): Promise<Technology> {
  const response = await apiFetch<{ technology: Technology }>('/api/technologies', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.technology
}

export async function updateTechnology(
  techId: number,
  payload: Partial<{
    name: string
    description: string
    icon_url: string
    color: string
    is_published: boolean
    sort_order: number
  }>,
): Promise<Technology> {
  const response = await apiFetch<{ technology: Technology }>(`/api/technologies/${techId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response.technology
}

export async function deleteTechnology(techId: number): Promise<void> {
  await apiFetch<void>(`/api/technologies/${techId}`, { method: 'DELETE' })
}

// ─── Curriculum Tree ──────────────────────────────────────────────────────────

function normalizeCurriculumNode(node: CurriculumNode): CurriculumNode {
  return {
    ...node,
    node_type: node.node_type ?? (node as any).type ?? 'topic',
    is_published: node.is_published ?? false,
    sort_order: node.sort_order ?? 0,
    children: (node.children ?? []).map(normalizeCurriculumNode),
  }
}

export async function fetchCurriculum(technologyId?: number): Promise<CurriculumNode[]> {
  const path = technologyId
    ? `/api/topics/technology/${technologyId}`
    : '/api/curriculum'
  const nodes = await apiFetch<CurriculumNode[]>(path)
  return (nodes ?? []).map(normalizeCurriculumNode)
}

// ─── Topics CRUD ──────────────────────────────────────────────────────────────

export async function createTopic(payload: TopicPayload): Promise<CurriculumNode> {
  const response = await apiFetch<{ topic: CurriculumNode }>('/api/topics', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return normalizeCurriculumNode(response.topic)
}

export async function updateTopic(
  topicId: number,
  payload: Partial<Pick<TopicPayload, 'name' | 'parent_id'> & { sort_order: number; is_published: boolean }>,
): Promise<CurriculumNode> {
  const response = await apiFetch<{ topic: CurriculumNode }>(`/api/topics/${topicId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return normalizeCurriculumNode(response.topic)
}

export async function deleteTopic(topicId: number): Promise<{ deleted_ids: number[] }> {
  return apiFetch<{ deleted_ids: number[] }>(`/api/topics/${topicId}`, { method: 'DELETE' })
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function fetchNoteByTopic(topicId: number): Promise<TopicNoteData> {
  return apiFetch<TopicNoteData>(`/api/topics/${topicId}/note`)
}

export async function createVersion(topicId: number, versionType: string, content: object) {
  return apiFetch<{ note_version: unknown }>('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId, version_type: versionType, content }),
  })
}
