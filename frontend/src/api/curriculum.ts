import type { CurriculumNode, TopicNoteData, TopicPayload, Technology } from '../types'
import { apiFetch } from './auth'
import { curriculumCache } from '../cache/curriculumCache'

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
    node_type: node.node_type ?? (node as unknown as { type?: 'section' | 'topic' | 'subtopic' }).type ?? 'topic',
    is_published: node.is_published ?? false,
    sort_order: node.sort_order ?? 0,
    children: (node.children ?? []).map(normalizeCurriculumNode),
  }
}

/**
 * Admin: fetches ALL topics (draft + published) for a technology.
 * Requires a valid admin JWT (sent automatically by apiFetch via auth token).
 */
export async function fetchCurriculumAdmin(technologyId: number): Promise<CurriculumNode[]> {
  const nodes = await apiFetch<CurriculumNode[]>(`/api/admin/topics/technology/${technologyId}`)
  return (nodes ?? []).map(normalizeCurriculumNode)
}

/**
 * Public: fetches only published topics for a technology (or the whole tree).
 */
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

export async function fetchNoteByTopic(topicId: number, forceRefetch = false): Promise<TopicNoteData> {
  if (!forceRefetch) {
    const cached = curriculumCache.getNote(topicId)
    if (cached) {
      return cached
    }
  }

  const noteData = await apiFetch<TopicNoteData>(`/api/topics/${topicId}/note`)
  
  try {
    const techId = noteData.topic.technology_id
    let nodes = curriculumCache.getTree(techId)
    if (!nodes) {
      nodes = await fetchCurriculumAdmin(techId)
      curriculumCache.setTree(techId, nodes)
    }
    
    let foundNode: CurriculumNode | undefined
    function findNode(tree: CurriculumNode[]) {
      for (const n of tree) {
        if (n.id === topicId) {
          foundNode = n
          return
        }
        if (n.children && n.children.length > 0) {
          findNode(n.children)
          if (foundNode) return
        }
      }
    }
    findNode(nodes)
    
    if (foundNode) {
      noteData.topic.is_published = foundNode.is_published
      noteData.topic.sort_order = foundNode.sort_order
    }
  } catch (err) {
    console.error('Failed to augment note data with publish status:', err)
  }
  
  curriculumCache.setNote(topicId, noteData)
  return noteData
}

export async function createVersion(topicId: number, versionType: string, content: object) {
  return apiFetch<{ note_version: unknown }>('/api/note-version', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId, version_type: versionType, content }),
  })
}
