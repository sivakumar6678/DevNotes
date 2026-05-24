import type { RichContent } from '../types/richContent'

export interface NoteSection {
  key: string
  title: string
  id: string
  kind: 'text' | 'code' | 'list' | 'concept' | 'example'
}

export interface NoteCodeItem {
  title?: string
  language?: string
  code?: string
}

export interface NoteConceptItem {
  name?: string
  explanation?: string | RichContent
}

export interface NoteExampleItem {
  title?: string
  description?: string | RichContent
  code?: string
  explanation?: string | RichContent
  language?: string
  question?: string
  answer?: string | RichContent
}

export const noteSections: NoteSection[] = [
  { key: 'definition', title: 'Definition', id: 'definition', kind: 'text' },
  { key: 'problem_it_solves', title: 'Problem It Solves', id: 'problem-it-solves', kind: 'text' },
  { key: 'detailed_explanation', title: 'Detailed Explanation', id: 'detailed-explanation', kind: 'text' },
  { key: 'core_concepts', title: 'Core Concepts', id: 'core-concepts', kind: 'concept' },
  { key: 'how_it_works', title: 'How It Works', id: 'how-it-works', kind: 'text' },
  { key: 'syntax', title: 'Syntax', id: 'syntax', kind: 'code' },
  { key: 'code_example', title: 'Code Example', id: 'code-example', kind: 'code' },
  { key: 'practical_example', title: 'Practical Example', id: 'practical-example', kind: 'example' },
  { key: 'real_world_example', title: 'Real World Example', id: 'real-world-example', kind: 'example' },
  { key: 'common_mistakes', title: 'Common Mistakes', id: 'common-mistakes', kind: 'list' },
  { key: 'best_practices', title: 'Best Practices', id: 'best-practices', kind: 'list' },
  { key: 'interview_notes', title: 'Interview Notes', id: 'interview-notes', kind: 'example' },
]

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeTextValue(value: unknown): string[] {
  if (isNonEmptyString(value)) {
    return value
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
  }

  return []
}

export function hasStructuredTextContent(value: unknown): boolean {
  if (isNonEmptyString(value)) {
    return true
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.type === 'rich') return true
  }

  if (Array.isArray(value)) {
    return value.some((item) => {
      if (isNonEmptyString(item)) return true
      if (!item || typeof item !== 'object') return false

      const record = item as Record<string, unknown>
      if (record.type === 'rich') return true
      return [record.text, record.content, record.description, record.explanation, record.point].some((val) => {
        if (isNonEmptyString(val)) return true
        if (val && typeof val === 'object' && (val as any).type === 'rich') return true
        return false
      })
    })
  }

  return false
}

export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isNonEmptyString)
    .map((item) => item.trim())
}

export function normalizeConcepts(value: unknown): NoteConceptItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is NoteConceptItem => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const name = isNonEmptyString(item.name) ? item.name.trim() : undefined
      let explanation: string | RichContent | undefined
      if (item.explanation && typeof item.explanation === 'object' && (item.explanation as any).type === 'rich') {
        explanation = item.explanation
      } else if (isNonEmptyString(item.explanation)) {
        explanation = item.explanation.trim()
      }
      return { name, explanation }
    })
    .filter((item) => isNonEmptyString(item.name) || item.explanation !== undefined)
}

export function normalizeCodeItems(value: unknown): NoteCodeItem[] {
  if (isNonEmptyString(value)) {
    return [{ code: value.trim() }]
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is NoteCodeItem => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      title: isNonEmptyString(item.title) ? item.title.trim() : undefined,
      language: isNonEmptyString(item.language) ? item.language.trim() : undefined,
      code: isNonEmptyString(item.code) ? item.code : undefined,
    }))
    .filter((item) => isNonEmptyString(item.code))
}

export function normalizeExamples(value: unknown): NoteExampleItem[] {
  if (isNonEmptyString(value)) {
    return [{ description: value.trim() }]
  }

  if (value && typeof value === 'object' && (value as any).type === 'rich') {
    return [{ description: value as RichContent }]
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is NoteExampleItem => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const title = isNonEmptyString(item.title) ? item.title.trim() : undefined
      const code = isNonEmptyString(item.code) ? item.code : undefined
      const language = isNonEmptyString(item.language) ? item.language.trim() : undefined
      const question = isNonEmptyString(item.question) ? item.question.trim() : undefined

      let description: string | RichContent | undefined
      if (item.description && typeof item.description === 'object' && (item.description as any).type === 'rich') {
        description = item.description
      } else if (isNonEmptyString(item.description)) {
        description = item.description.trim()
      }

      let explanation: string | RichContent | undefined
      if (item.explanation && typeof item.explanation === 'object' && (item.explanation as any).type === 'rich') {
        explanation = item.explanation
      } else if (isNonEmptyString(item.explanation)) {
        explanation = item.explanation.trim()
      }

      let answer: string | RichContent | undefined
      if (item.answer && typeof item.answer === 'object' && (item.answer as any).type === 'rich') {
        answer = item.answer
      } else if (isNonEmptyString(item.answer)) {
        answer = item.answer.trim()
      }

      return {
        title,
        description,
        code,
        explanation,
        language,
        question,
        answer,
      }
    })
    .filter(
      (item) =>
        isNonEmptyString(item.title) ||
        item.description !== undefined ||
        isNonEmptyString(item.code) ||
        item.explanation !== undefined ||
        isNonEmptyString(item.question) ||
        item.answer !== undefined,
    )
}

export function hasRenderableContent(sectionKey: string, value: unknown): boolean {
  switch (sectionKey) {
    case 'problem_it_solves':
    case 'detailed_explanation':
    case 'how_it_works':
      return hasStructuredTextContent(value)
    case 'core_concepts':
      return normalizeConcepts(value).length > 0
    case 'syntax':
    case 'code_example':
      return normalizeCodeItems(value).length > 0
    case 'common_mistakes':
    case 'best_practices':
      // Support both legacy string-array and new rich structured format
      if (value && typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).type === 'rich') {
        return hasStructuredTextContent(value)
      }
      return normalizeStringList(value).length > 0
    case 'practical_example':
    case 'real_world_example':
    case 'interview_notes':
      return normalizeExamples(value).length > 0
    default:
      return hasStructuredTextContent(value)
  }
}
