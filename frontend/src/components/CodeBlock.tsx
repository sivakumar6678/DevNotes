import { memo, useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import type { NoteCodeItem } from './noteContentSchema'
import { useInView } from '../hooks/useInView'
import { tokenize } from '../utils/syntaxHighlighter'

// Skeleton shown while a code block is outside the viewport
const CodeBlockSkeleton = memo(function CodeBlockSkeleton() {
  return (
    <div className="code-block">
      <div className="code-block__header">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-700/60" />
      </div>
      <div className="space-y-2 px-4 py-4">
        {[80, 60, 70, 50].map((w, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-slate-700/40" style={{ width: `${w}%` }} />
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

  // Tokenize and split into lines for line numbering
  const lines = useMemo(() => {
    const tokens = tokenize(code, language)
    const result: { text: string; type: string }[][] = [[]]

    for (const token of tokens) {
      // Split token text by newlines to distribute across lines
      const parts = token.text.split('\n')
      parts.forEach((part, i) => {
        if (i > 0) result.push([]) // new line
        if (part) result[result.length - 1].push({ text: part, type: token.type })
      })
    }

    return result
  }, [code, language])

  const showLineNumbers = lines.length > 3

  return (
    <div ref={ref}>
      {!inView ? (
        <CodeBlockSkeleton />
      ) : (
        <div className="code-block">
          <div className="code-block__header">
            <div className="flex min-w-0 items-center gap-3">
              {item.title ? <p className="code-block__title">{item.title}</p> : null}
              {language ? (
                <span className="code-block__lang">{language}</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="code-block__copy"
              aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="code-block__body">
            <pre className="code-block__pre">
              <code className="code-block__code">
                {lines.map((lineTokens, lineIndex) => (
                  <span key={lineIndex} className="code-block__line">
                    {showLineNumbers && (
                      <span className="code-block__line-num" aria-hidden="true">
                        {lineIndex + 1}
                      </span>
                    )}
                    <span className="code-block__line-content">
                      {lineTokens.length === 0 ? '\n' : lineTokens.map((tok, ti) => (
                        <span key={ti} className={`tok-${tok.type}`}>{tok.text}</span>
                      ))}
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
})
