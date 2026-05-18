import { memo, useMemo } from 'react'
import {
  CodeBlock,
  ConceptBlock,
  ExampleBlock,
  ListBlock,
  SectionBlock,
  TextBlock,
} from './note-blocks'
import {
  hasRenderableContent,
  noteSections,
  normalizeCodeItems,
  normalizeConcepts,
  normalizeExamples,
  normalizeStringList,
  normalizeTextValue,
} from './noteContentSchema'
import type { NoteSection } from './noteContentSchema'

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
      const paragraphs = normalizeTextValue(value)
      if (!paragraphs.length) return null
      return (
        <SectionBlock id={section.id} title={section.title}>
          <TextBlock paragraphs={paragraphs} />
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
  const allSections = useMemo(
    () => noteSections.filter((s) => hasRenderableContent(s.key, version[s.key])),
    [JSON.stringify(version)],
  )

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
        <NoteSection key={section.key} section={section} version={version} />
      ))}
    </article>
  )
})
