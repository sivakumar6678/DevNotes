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
  explanation?: string
}

export interface NoteExampleItem {
  title?: string
  description?: string
  code?: string
  explanation?: string
  language?: string
  question?: string
  answer?: string
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
    .map((item) => ({
      name: isNonEmptyString(item.name) ? item.name.trim() : undefined,
      explanation: isNonEmptyString(item.explanation) ? item.explanation.trim() : undefined,
    }))
    .filter((item) => isNonEmptyString(item.name) || isNonEmptyString(item.explanation))
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

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is NoteExampleItem => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      title: isNonEmptyString(item.title) ? item.title.trim() : undefined,
      description: isNonEmptyString(item.description) ? item.description.trim() : undefined,
      code: isNonEmptyString(item.code) ? item.code : undefined,
      explanation: isNonEmptyString(item.explanation) ? item.explanation.trim() : undefined,
      language: isNonEmptyString(item.language) ? item.language.trim() : undefined,
      question: isNonEmptyString(item.question) ? item.question.trim() : undefined,
      answer: isNonEmptyString(item.answer) ? item.answer.trim() : undefined,
    }))
    .filter(
      (item) =>
        isNonEmptyString(item.title) ||
        isNonEmptyString(item.description) ||
        isNonEmptyString(item.code) ||
        isNonEmptyString(item.explanation) ||
        isNonEmptyString(item.question) ||
        isNonEmptyString(item.answer),
    )
}

export function hasRenderableContent(sectionKey: string, value: unknown): boolean {
  switch (sectionKey) {
    case 'core_concepts':
      return normalizeConcepts(value).length > 0
    case 'syntax':
    case 'code_example':
      return normalizeCodeItems(value).length > 0
    case 'common_mistakes':
    case 'best_practices':
      return normalizeStringList(value).length > 0
    case 'practical_example':
    case 'real_world_example':
    case 'interview_notes':
      return normalizeExamples(value).length > 0
    default:
      return normalizeTextValue(value).length > 0
  }
}
