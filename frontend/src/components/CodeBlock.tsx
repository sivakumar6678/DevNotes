import { memo, useState } from 'react'
import type { NoteCodeItem } from './noteContentSchema'
import { useInView } from '../hooks/useInView'

// Skeleton shown while a code block is outside the viewport
const CodeBlockSkeleton = memo(function CodeBlockSkeleton() {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
      </div>
      <div className="space-y-2 px-4 py-4">
        {[80, 60, 70, 50].map((w, i) => (
          <div key={i} className={`h-3 animate-pulse rounded bg-slate-800/80`} style={{ width: `${w}%` }} />
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
        <div className="my-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/50 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              {item.title ? <p className="truncate text-[13px] font-medium text-slate-300">{item.title}</p> : null}
              {language ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{language}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100"
              aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-slate-50">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  )
})
