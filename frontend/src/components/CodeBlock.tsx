import { memo, useState } from 'react'
import type { NoteCodeItem } from './noteContentSchema'
import { useInView } from '../hooks/useInView'

// Skeleton shown while a code block is outside the viewport
const CodeBlockSkeleton = memo(function CodeBlockSkeleton() {
  return (
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
  )
})

export default memo(function CodeBlock({
  item,
  fallbackLanguage,
}: {
  item: NoteCodeItem
  fallbackLanguage?: string
}) {
  const { ref, inView } = useInView('300px')
  const [copied, setCopied] = useState(false)
  const language = item.language || fallbackLanguage
  const code = item.code ?? ''

  const handleCopy = async () => {
    if (!code || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    // The outer div holds the ref so IntersectionObserver can track it even
    // while the skeleton is showing.
    <div ref={ref}>
      {!inView ? (
        <CodeBlockSkeleton />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[rgba(15,23,42,0.92)] shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 bg-[rgba(30,41,59,0.72)] px-4 py-3">
            <div className="min-w-0">
              {item.title ? <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p> : null}
              {language ? (
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{language}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
              aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-slate-100">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  )
})
