import type { NoteVersion } from '../types'

const SCHEMA_ORDER = [
  'definition',
  'problem_it_solves',
  'detailed_explanation',
  'core_concepts',
  'how_it_works',
  'syntax',
  'code_example',
  'practical_example',
  'real_world_example',
  'common_mistakes',
  'best_practices',
  'interview_notes'
] as const

export function normalizeNoteVersion(version: any): NoteVersion {
  if (!version || typeof version !== 'object') {
    return {
      definition: '',
      problem_it_solves: '',
      detailed_explanation: '',
      core_concepts: [],
      how_it_works: '',
      syntax: '',
      code_example: '',
      practical_example: '',
      real_world_example: '',
      common_mistakes: [],
      best_practices: [],
      interview_notes: []
    }
  }

  const normalized: any = {}

  for (const key of SCHEMA_ORDER) {
    const value = version[key]

    switch (key) {
      case 'definition':
      case 'problem_it_solves':
      case 'detailed_explanation':
      case 'how_it_works': {
        if (value && typeof value === 'object' && value.type === 'rich') {
          normalized[key] = {
            type: 'rich',
            blocks: Array.isArray(value.blocks) ? value.blocks.map(normalizeRichBlock) : []
          }
        } else if (typeof value === 'string') {
          normalized[key] = value
        } else {
          normalized[key] = ''
        }
        break
      }
      case 'core_concepts': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => {
            if (!item || typeof item !== 'object') return { name: '', explanation: '' }
            const explanation = item.explanation
            let normalizedExpl: any = ''
            if (explanation && typeof explanation === 'object' && explanation.type === 'rich') {
              normalizedExpl = {
                type: 'rich',
                blocks: Array.isArray(explanation.blocks) ? explanation.blocks.map(normalizeRichBlock) : []
              }
            } else if (typeof explanation === 'string') {
              normalizedExpl = explanation
            } else {
              normalizedExpl = ''
            }
            return {
              name: typeof item.name === 'string' ? item.name : '',
              explanation: normalizedExpl
            }
          })
        } else {
          normalized[key] = []
        }
        break
      }
      case 'syntax':
      case 'code_example': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => {
            if (!item || typeof item !== 'object') return { title: '', language: '', code: '' }
            return {
              title: typeof item.title === 'string' ? item.title : '',
              language: typeof item.language === 'string' ? item.language : '',
              code: typeof item.code === 'string' ? item.code : ''
            }
          })
        } else if (typeof value === 'string') {
          normalized[key] = value
        } else {
          normalized[key] = ''
        }
        break
      }
      case 'practical_example': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => {
            if (!item || typeof item !== 'object') return { title: '', description: '', code: '', explanation: '', language: '' }
            
            const explanation = item.explanation
            let normalizedExpl: any = ''
            if (explanation && typeof explanation === 'object' && explanation.type === 'rich') {
              normalizedExpl = {
                type: 'rich',
                blocks: Array.isArray(explanation.blocks) ? explanation.blocks.map(normalizeRichBlock) : []
              }
            } else if (typeof explanation === 'string') {
              normalizedExpl = explanation
            } else {
              normalizedExpl = ''
            }

            return {
              title: typeof item.title === 'string' ? item.title : '',
              description: typeof item.description === 'string' ? item.description : '',
              code: typeof item.code === 'string' ? item.code : '',
              explanation: normalizedExpl,
              language: typeof item.language === 'string' ? item.language : ''
            }
          })
        } else if (typeof value === 'string') {
          normalized[key] = value
        } else {
          normalized[key] = ''
        }
        break
      }
      case 'real_world_example': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => {
            if (!item || typeof item !== 'object') return { title: '', description: '' }
            return {
              title: typeof item.title === 'string' ? item.title : '',
              description: typeof item.description === 'string' ? item.description : ''
            }
          })
        } else if (typeof value === 'string') {
          normalized[key] = value
        } else {
          normalized[key] = ''
        }
        break
      }
      case 'common_mistakes':
      case 'best_practices': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => typeof item === 'string' ? item : '')
        } else {
          normalized[key] = []
        }
        break
      }
      case 'interview_notes': {
        if (Array.isArray(value)) {
          normalized[key] = value.map((item: any) => {
            if (typeof item === 'string') {
              return item
            }
            if (item && typeof item === 'object') {
              const answer = item.answer
              let normalizedAnswer: any = ''
              if (answer && typeof answer === 'object' && answer.type === 'rich') {
                normalizedAnswer = {
                  type: 'rich',
                  blocks: Array.isArray(answer.blocks) ? answer.blocks.map(normalizeRichBlock) : []
                }
              } else if (typeof answer === 'string') {
                normalizedAnswer = answer
              } else {
                normalizedAnswer = ''
              }
              return {
                question: typeof item.question === 'string' ? item.question : '',
                answer: normalizedAnswer
              }
            }
            return { question: '', answer: '' }
          })
        } else {
          normalized[key] = []
        }
        break
      }
      default:
        break
    }
  }

  // Preserve custom/dynamic fields
  for (const key of Object.keys(version)) {
    if (!SCHEMA_ORDER.includes(key as any)) {
      normalized[key] = version[key]
    }
  }

  return normalized
}

function normalizeRichBlock(block: any): any {
  if (!block || typeof block !== 'object') {
    return { type: 'paragraph', content: '' }
  }

  switch (block.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        content: typeof block.content === 'string' ? block.content : ''
      }
    case 'diagram':
      return {
        type: 'diagram',
        content: typeof block.content === 'string' ? block.content : ''
      }
    case 'bullets':
      return {
        type: 'bullets',
        items: Array.isArray(block.items)
          ? block.items.map((item: any) => {
              if (typeof item === 'string') return { text: item, depth: 0 }
              if (item && typeof item === 'object') {
                return {
                  text: typeof item.text === 'string' ? item.text : '',
                  depth: typeof item.depth === 'number' ? (item.depth === 1 || item.depth === 2 ? item.depth : 0) : 0
                }
              }
              return { text: '', depth: 0 }
            })
          : []
      }
    case 'numbered_list':
      return {
        type: 'numbered_list',
        items: Array.isArray(block.items)
          ? block.items.map((item: any) => typeof item === 'string' ? item : '')
          : []
      }
    case 'callout':
      return {
        type: 'callout',
        variant: typeof block.variant === 'string' && ['tip', 'warning', 'info'].includes(block.variant)
          ? block.variant
          : 'info',
        content: typeof block.content === 'string' ? block.content : ''
      }
    default:
      return block
  }
}
