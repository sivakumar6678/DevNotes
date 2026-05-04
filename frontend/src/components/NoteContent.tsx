import { memo, useEffect, useMemo, useState } from 'react'
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

// Number of sections painted synchronously on the first render.
// The remaining ones are scheduled via requestIdleCallback / setTimeout so
// the initial paint stays fast even for long notes.
const EAGER_COUNT = 3

// ---------------------------------------------------------------------------
// Single-section renderer — memoised so a version-tab switch only re-renders
// sections whose data actually changed.
// ---------------------------------------------------------------------------

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
  // Pre-filter sections that have renderable content so the split between
  // eager / deferred is done on meaningful sections only.
  const allSections = useMemo(
    () => noteSections.filter((s) => hasRenderableContent(s.key, version[s.key])),
    // Stringify to avoid identity-inequality on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(version)],
  )

  const eagerSections = allSections.slice(0, EAGER_COUNT)
  const deferredSections = allSections.slice(EAGER_COUNT)

  // Start with only eager sections rendered; append the rest after the browser
  // has a free moment (or after a short fallback timeout).
  const [showDeferred, setShowDeferred] = useState(false)

  useEffect(() => {
    setShowDeferred(false) // reset whenever the note/version changes

    if (!deferredSections.length) {
      return
    }

    let id: ReturnType<typeof setTimeout>

    if (typeof requestIdleCallback !== 'undefined') {
      const handle = requestIdleCallback(() => setShowDeferred(true), { timeout: 400 })
      return () => cancelIdleCallback(handle)
    } else {
      id = setTimeout(() => setShowDeferred(true), 60)
      return () => clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSections])

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
      {/* Always render the first few sections immediately */}
      {eagerSections.map((section) => (
        <NoteSection key={section.key} section={section} version={version} />
      ))}

      {/* Deferred sections — rendered after the browser is idle */}
      {showDeferred &&
        deferredSections.map((section) => (
          <NoteSection key={section.key} section={section} version={version} />
        ))}
    </article>
  )
})
