import { memo, useMemo } from 'react'
import {
  CodeBlock,
  ConceptBlock,
  ExampleBlock,
  ListBlock,
  SectionBlock,
  StructuredTextBlock,
} from './note-blocks'
import { RichContentRenderer } from './renderers/RichContentRenderer'
import {
  hasRenderableContent,
  noteSections,
  normalizeCodeItems,
  normalizeConcepts,
  normalizeExamples,
  normalizeStringList,
} from './noteContentSchema'
import type { NoteSection } from './noteContentSchema'
import { normalizeNoteVersion } from '../utils/contentNormalizer'
import type { RichContent, FieldContent } from '../types/richContent'

const NoteSection = memo(function NoteSection({
  section,
  version,
}: {
  section: NoteSection
  version: Record<string, unknown>
}) {
  const value = version[section.key]

  switch (section.kind) {
    case 'text': {
      if (value && typeof value === 'object' && (value as Record<string, unknown>).type === 'rich') {
        return (
          <SectionBlock id={section.id} title={section.title}>
            <RichContentRenderer content={value as RichContent} />
          </SectionBlock>
        )
      }

      if (
        section.key === 'problem_it_solves' ||
        section.key === 'detailed_explanation' ||
        section.key === 'definition'
      ) {
        return (
          <SectionBlock id={section.id} title={section.title}>
            <RichContentRenderer content={value as FieldContent} />
          </SectionBlock>
        )
      }

      return (
        <SectionBlock id={section.id} title={section.title}>
          <StructuredTextBlock value={value} preferList={true} />
        </SectionBlock>
      )
    }
    case 'code': {
      const codeItems = normalizeCodeItems(value)
      if (!codeItems.length) return null
      return (
        <SectionBlock id={section.id} title={section.title}>
          <div className="space-y-4">
            {codeItems.map((item, index) => (
              <CodeBlock key={`${section.key}-${index}`} item={item} />
            ))}
          </div>
        </SectionBlock>
      )
    }
    case 'concept': {
      const concepts = normalizeConcepts(value)
      if (!concepts.length) return null
      return (
        <SectionBlock id={section.id} title={section.title}>
          <ConceptBlock items={concepts} />
        </SectionBlock>
      )
    }
    case 'list': {
      // New rich structured format (tables, bullets, diagrams, etc.)
      if (value && typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).type === 'rich') {
        return (
          <SectionBlock id={section.id} title={section.title}>
            <RichContentRenderer content={value as RichContent} />
          </SectionBlock>
        )
      }
      // Legacy string-array format — unchanged
      const items = normalizeStringList(value)
      if (!items.length) return null
      return (
        <SectionBlock id={section.id} title={section.title}>
          <ListBlock items={items} />
        </SectionBlock>
      )
    }
    case 'example': {
      const examples = normalizeExamples(value)
      if (!examples.length) return null
      return (
        <SectionBlock id={section.id} title={section.title}>
          <ExampleBlock items={examples} />
        </SectionBlock>
      )
    }
    default:
      return null
  }
})

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default memo(function NoteContent({ version = {} }: { version?: Record<string, any> }) {
  const normalizedVersion = useMemo(() => normalizeNoteVersion(version), [JSON.stringify(version)])

  const allSections = useMemo(() => {
    // 1. Filter known sections
    const knownSections = noteSections.filter((s) => hasRenderableContent(s.key, (normalizedVersion as Record<string, unknown>)[s.key]))

    // 2. Identify unknown/dynamic sections
    const systemKeys = new Set(['id', '_id', 'topic_id', 'created_at', 'updated_at', 'version', 'title', 'metadata', 'status', 'type', 'fallback', 'available_versions'])
    const dynamicSections = Object.keys(normalizedVersion)
      .filter((key) => !noteSections.some((s) => s.key === key) && !systemKeys.has(key))
      .filter((key) => hasRenderableContent(key, (normalizedVersion as Record<string, unknown>)[key]))
      .map((key) => ({
        key,
        title: key.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        id: key.replace(/_/g, '-'),
        kind: 'text' as const,
      }))

    return [...knownSections, ...dynamicSections]
  }, [normalizedVersion])

  if (!allSections.length) {
    return (
      <article className="mx-auto w-full max-w-4xl min-w-0">
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-500">
            No structured content is available for this version yet.
          </p>
        </div>
      </article>
    )
  }

  return (
    <article className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6">
      {allSections.map((section) => (
        <NoteSection key={section.key} section={section} version={normalizedVersion as Record<string, unknown>} />
      ))}
    </article>
  )
})
