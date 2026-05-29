import type { ReactNode } from 'react'

/**
 * Render inline markdown tokens within a text string.
 *
 * Supported patterns:
 *  - **bold**        → <strong>
 *  - `code`          → <code>
 *  - Label: content  → <strong class="label">Label:</strong> content
 *
 * Label detection fires when a line starts with an uppercase word/phrase
 * followed by `:` and content (e.g. "Scrum:", "Benefits:", "Key Points:").
 */

/** Matches patterns like "Label Name:" at the start of text */
const LABEL_PATTERN = /^([A-Z][A-Za-z0-9 /&-]{1,40}):\s+/

export function renderInlineMarkdown(text: string): ReactNode[] {
  // Phase 1: Detect leading label pattern (e.g. "Scrum: An agile framework...")
  let labelNode: ReactNode | null = null
  let remaining = text

  const labelMatch = remaining.match(LABEL_PATTERN)
  if (labelMatch) {
    const labelText = labelMatch[1]
    labelNode = (
      <strong key="__label" className="inline-label">
        {labelText}:
      </strong>
    )
    remaining = remaining.slice(labelMatch[0].length)
  }

  // Phase 2: Tokenize remaining text for **bold** and `code`
  const tokens = remaining.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

  const nodes: ReactNode[] = labelNode ? [labelNode, ' '] : []

  tokens.forEach((token, index) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={index} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code key={index} className="inline-code">
          {token.slice(1, -1)}
        </code>
      )
    } else {
      nodes.push(token)
    }
  })

  return nodes
}
