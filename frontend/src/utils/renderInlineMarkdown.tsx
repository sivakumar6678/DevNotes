import type { ReactNode } from 'react'

/**
 * Render inline markdown tokens (**bold** and `code`) within a text string.
 * Used across note-blocks, RichContentRenderer, and any component that
 * needs lightweight inline formatting.
 */
export function renderInlineMarkdown(text: string): ReactNode[] {
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
