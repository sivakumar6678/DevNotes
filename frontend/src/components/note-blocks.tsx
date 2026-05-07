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

function renderMarkdownBlocks(content: string, paragraphClassName: string) {
  const lines = content.split('\n')
  const blocks: Array<{ type: 'paragraph'; content: string } | { type: 'list'; items: string[] }> = []
  let paragraphBuffer: string[] = []
  let listBuffer: string[] = []

  const flushParagraph = () => {
    const text = paragraphBuffer.join(' ').trim()
    if (text) blocks.push({ type: 'paragraph', content: text })
    paragraphBuffer = []
  }

  const flushList = () => {
    if (listBuffer.length) blocks.push({ type: 'list', items: listBuffer })
    listBuffer = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()
    if (!line) { flushParagraph(); flushList(); return }
    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) { flushParagraph(); listBuffer.push(listMatch[1].trim()); return }
    flushList()
    paragraphBuffer.push(line)
  })

  flushParagraph()
  flushList()

  return blocks.map((block, index) => {
    if (block.type === 'list') {
      return (
        <ul key={index} className="space-y-2.5 pl-1">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
              <span className="text-base leading-8 text-slate-700 sm:text-[1.02rem]">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
    }
    return (
      <p key={index} className={paragraphClassName}>
        {renderInlineMarkdown(block.content)}
      </p>
    )
  })
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
