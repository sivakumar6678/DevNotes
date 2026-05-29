import { memo } from 'react'
import type { FieldContent, RichContent, TableBlock } from '../../types/richContent'
import { StructuredTextBlock } from '../note-blocks'
import { renderInlineMarkdown } from '../../utils/renderInlineMarkdown'

const TableRenderer = memo(function TableRenderer({ block }: { block: TableBlock }) {
  if (!block || !Array.isArray(block.rows) || block.rows.length === 0) {
    return null
  }

  const headerCount = Array.isArray(block.headers) ? block.headers.length : 0
  const maxCols = Math.max(
    headerCount,
    ...block.rows.map((row) => (Array.isArray(row) ? row.length : 0))
  )

  if (maxCols === 0) {
    return null
  }

  const hasHeaders = headerCount > 0

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white my-5 shadow-sm">
      <table className="w-full border-collapse text-left text-sm text-slate-700">
        {hasHeaders && (
          <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
            <tr className="divide-x divide-slate-200">
              {Array.from({ length: maxCols }).map((_, i) => {
                const headerText = block.headers?.[i] || ''
                return (
                  <th
                    key={i}
                    className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap align-bottom bg-slate-50/50"
                  >
                    {headerText ? renderInlineMarkdown(headerText) : ''}
                  </th>
                )
              })}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-200 bg-white">
          {block.rows.map((row, rowIndex) => {
            if (!Array.isArray(row)) return null
            return (
              <tr
                key={rowIndex}
                className="hover:bg-slate-50/30 transition-colors divide-x divide-slate-200"
              >
                {Array.from({ length: maxCols }).map((_, colIndex) => {
                  const cellContent = row[colIndex] || ''
                  return (
                    <td
                      key={colIndex}
                      className="px-4 py-3 font-normal text-slate-700 align-top break-words min-w-[120px]"
                    >
                      {cellContent ? (
                        cellContent.split('\n').map((line, idx) => (
                          <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
                            {renderInlineMarkdown(line)}
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 font-light">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export const RichContentRenderer = memo(function RichContentRenderer({
  content,
}: {
  content: FieldContent | unknown
}) {
  if (typeof content === 'string' || Array.isArray(content)) {
    // Render as before
    return <StructuredTextBlock value={content} preferList={false} />
  }

  if (content && typeof content === 'object' && 'type' in content && (content as RichContent).type === 'rich') {
    const richContent = content as RichContent
    
    return (
      <div className="space-y-4">
        {(richContent.blocks ?? []).map((block, index) => {
          switch (block.type) {
            case 'paragraph':
              return (
                <p key={index} className="text-base leading-8 text-slate-700 sm:text-[1.02rem]">
                  {renderInlineMarkdown(typeof block.content === 'string' ? block.content : '')}
                </p>
              )
            case 'diagram':
              return (
                <pre key={index} className="diagram">
                  {typeof block.content === 'string' ? block.content : ''}
                </pre>
              )
            case 'bullets': {
              const items = Array.isArray(block.items) ? block.items : []
              return (
                <ul key={index} className="space-y-2.5 pl-1">
                  {items.map((item, i) => {
                    const indent = item.depth === 0 ? '0' : item.depth === 1 ? '1.5rem' : '3rem'
                    return (
                      <li key={i} className="flex items-start gap-3" style={{ marginLeft: indent }}>
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-orange" aria-hidden="true" />
                        <span className="text-base leading-8 text-slate-700 sm:text-[1.02rem]">
                          {renderInlineMarkdown(typeof item.text === 'string' ? item.text : '')}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )
            }
            case 'numbered_list': {
              const listItems = Array.isArray(block.items) ? block.items : []
              return (
                <ol key={index} className="list-decimal space-y-2.5 pl-6 text-base leading-8 text-slate-700 sm:text-[1.02rem]">
                  {listItems.map((item, i) => (
                    <li key={i} className="pl-1">
                      {renderInlineMarkdown(typeof item === 'string' ? item : '')}
                    </li>
                  ))}
                </ol>
              )
            }
            case 'callout': {
              const icons: Record<string, string> = { tip: '💡', warning: '⚠️', info: 'ℹ️' }
              return (
                <div key={index} className={`callout callout--${block.variant}`}>
                  <span className="callout__icon" aria-hidden="true">{icons[block.variant] ?? 'ℹ️'}</span>
                  <span className="callout__text">
                    {renderInlineMarkdown(typeof block.content === 'string' ? block.content : '')}
                  </span>
                </div>
              )
            }
            case 'table':
              return <TableRenderer key={index} block={block as TableBlock} />
            default:
              return null
          }
        })}
      </div>
    )
  }

  return null
})
