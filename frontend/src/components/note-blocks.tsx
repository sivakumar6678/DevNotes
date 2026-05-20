import { memo } from 'react'
import type { ReactNode } from 'react'
import type { NoteCodeItem, NoteConceptItem, NoteExampleItem } from './noteContentSchema'

// ---------------------------------------------------------------------------
// Inline helpers (module-level, never re-created)
// ---------------------------------------------------------------------------

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      )
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={index} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-slate-900">
          {token.slice(1, -1)}
        </code>
      )
    }

    return token
  })
}

type MarkdownBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }

function parseMarkdownBlocks(content: string, allowOrderedLists = false): MarkdownBlock[] {
  const lines = content.split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraphBuffer: string[] = []
  let listBuffer: string[] = []
  let listType: 'unordered-list' | 'ordered-list' | null = null

  const flushParagraph = () => {
    const text = paragraphBuffer.join(' ').trim()
    if (text) blocks.push({ type: 'paragraph', content: text })
    paragraphBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length && listType) blocks.push({ type: listType, items: listBuffer })
    listBuffer = []
    listType = null
  }

  const addListItem = (type: 'unordered-list' | 'ordered-list', item: string) => {
    if (listType && listType !== type) flushList()
    listType = type
    listBuffer.push(item)
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) { flushParagraph(); flushList(); return }
    const unorderedMatch = line.match(/^[-*]\s+(.+)$/)
    if (unorderedMatch) { flushParagraph(); addListItem('unordered-list', unorderedMatch[1].trim()); return }
    const orderedMatch = allowOrderedLists ? line.match(/^\d+[.)]\s+(.+)$/) : null
    if (orderedMatch) { flushParagraph(); addListItem('ordered-list', orderedMatch[1].trim()); return }
    flushList()
    paragraphBuffer.push(line)
  })

  flushParagraph()
  flushList()

  return blocks
}

function renderPointList(items: string[], ordered = false) {
  if (ordered) {
    return (
      <ol className="list-decimal space-y-2.5 pl-6 text-base leading-8 text-slate-700 sm:text-[1.02rem]">
        {items.map((item, index) => (
          <li key={index} className="pl-1">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ul className="space-y-2.5 pl-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
          <span className="text-base leading-8 text-slate-700 sm:text-[1.02rem]">{renderInlineMarkdown(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function renderMarkdownBlocks(content: string, paragraphClassName: string, allowOrderedLists = false) {
  const blocks = parseMarkdownBlocks(content, allowOrderedLists)

  return blocks.map((block, index) => {
    if (block.type === 'unordered-list') {
      return <div key={index}>{renderPointList(block.items)}</div>
    }
    if (block.type === 'ordered-list') {
      return <div key={index}>{renderPointList(block.items, true)}</div>
    }
    return (
      <p key={index} className={paragraphClassName}>
        {renderInlineMarkdown(block.content)}
      </p>
    )
  })
}

function getPlainTextValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() || null
  }

  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>
    const text = item.text ?? item.content ?? item.description ?? item.explanation ?? item.point
    if (typeof text === 'string') return text.trim() || null
  }

  return null
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

import { lazy, Suspense } from 'react'

const LazyCodeBlock = lazy(() => import('./CodeBlock'))

export const CodeBlock = memo(function CodeBlockWrapper(props: {
  item: NoteCodeItem
  fallbackLanguage?: string
}) {
  return (
    <Suspense fallback={
      <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[rgba(15,23,42,0.92)] shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
        <div className="flex items-center justify-between border-b border-slate-700/70 bg-[rgba(30,41,59,0.72)] px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-600/60" />
        </div>
        <div className="space-y-2 px-4 py-4">
          {[80, 60, 70, 50].map((w, i) => (
            <div key={i} className={`h-3 animate-pulse rounded bg-slate-700/60`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    }>
      <LazyCodeBlock {...props} />
    </Suspense>
  )
})

export const ListBlock = memo(function ListBlock({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
          <span className="text-base leading-7 text-slate-700">{renderInlineMarkdown(item)}</span>
        </li>
      ))}
    </ul>
  )
})

export const ConceptBlock = memo(function ConceptBlock({ items }: { items: NoteConceptItem[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <div key={`${item.name || 'concept'}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
          {item.name ? <h3 className="text-base font-semibold text-slate-950">{renderInlineMarkdown(item.name)}</h3> : null}
          {item.explanation ? <p className="mt-2 text-base leading-7 text-slate-700">{renderInlineMarkdown(item.explanation)}</p> : null}
        </div>
      ))}
    </div>
  )
})

export const ExampleBlock = memo(function ExampleBlock({ items }: { items: NoteExampleItem[] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div
          key={`${item.title || item.question || 'example'}-${index}`}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-5"
        >
          {item.title ? <h3 className="text-lg font-semibold text-slate-950">{renderInlineMarkdown(item.title)}</h3> : null}
          {item.question ? <h3 className="text-lg font-semibold text-slate-950">{renderInlineMarkdown(item.question)}</h3> : null}
          {item.description ? (
            <div className="mt-3 space-y-4">
              {renderMarkdownBlocks(item.description, 'text-base leading-7 text-slate-700')}
            </div>
          ) : null}
          {item.answer ? (
            <div className="mt-3 space-y-4">
              {renderMarkdownBlocks(item.answer, 'text-base leading-7 text-slate-700')}
            </div>
          ) : null}
          {item.code ? (
            <div className="mt-4">
              <CodeBlock item={{ title: item.title, language: item.language, code: item.code }} />
            </div>
          ) : null}
          {item.explanation ? (
            <div className="mt-4 space-y-3">
              {renderMarkdownBlocks(item.explanation, 'text-sm leading-7 text-slate-600')}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
})

const SectionShell = memo(function SectionShell({ children }: { children: ReactNode }) {
  return <div className="group/section">{children}</div>
})

const HeadingBlock = memo(function HeadingBlock({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 font-display text-2xl font-semibold tracking-tight text-slate-900 group-hover/section:text-brand-orange transition-colors"
    >
      <a href={`#${id}`} className="hover:underline">
        {title}
      </a>
    </h2>
  )
})

export const TextBlock = memo(function TextBlock({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((p, index) => (
        <p key={index} className="text-base leading-7 text-slate-700">
          {renderInlineMarkdown(p)}
        </p>
      ))}
    </div>
  )
})

export const StructuredTextBlock = memo(function StructuredTextBlock({
  value,
  preferList = false,
}: {
  value: unknown
  preferList?: boolean
}) {
  if (Array.isArray(value)) {
    const items = value.map(getPlainTextValue).filter((item): item is string => Boolean(item))
    return items.length ? <div className="space-y-4">{renderPointList(items)}</div> : null
  }

  const text = getPlainTextValue(value)
  if (!text) return null

  const blocks = parseMarkdownBlocks(text, true)
  const hasExplicitStructure = blocks.some((block) => block.type !== 'paragraph')

  if (hasExplicitStructure) {
    return (
      <div className="space-y-4">
        {renderMarkdownBlocks(text, 'text-base leading-8 text-slate-700 sm:text-[1.02rem]', true)}
      </div>
    )
  }

  if (preferList) {
    const sentences = splitSentences(text)
    if (sentences.length > 1) {
      return <div className="space-y-4">{renderPointList(sentences)}</div>
    }
  }

  return (
    <div className="space-y-4">
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="text-base leading-8 text-slate-700 sm:text-[1.02rem]">
          {renderInlineMarkdown(paragraph.trim())}
        </p>
      ))}
    </div>
  )
})

export const SectionBlock = memo(function SectionBlock({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <SectionShell>
        <HeadingBlock id={id} title={title} />
        <div className="mt-5">{children}</div>
      </SectionShell>
    </section>
  )
})
