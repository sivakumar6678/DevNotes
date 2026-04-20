import { useState } from 'react'
import type { CurriculumNode } from '../types'

interface CurriculumTreeProps {
  nodes: CurriculumNode[]
  selectedId: number | null
  onSelect: (node: CurriculumNode) => void
  onAddChild: (node: CurriculumNode) => void
  onRename: (node: CurriculumNode) => void
  onDelete: (node: CurriculumNode) => void
}

const indent = ['pl-4', 'pl-6', 'pl-8', 'pl-10']

export default function CurriculumTree({ nodes, selectedId, onSelect, onAddChild, onRename, onDelete }: CurriculumTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {}

    function openAll(items: CurriculumNode[]) {
      items.forEach((item) => {
        map[item.id] = true
        openAll(item.children)
      })
    }

    openAll(nodes)
    return map
  })

  function toggle(nodeId: number) {
    setExpanded((current) => ({
      ...current,
      [nodeId]: !current[nodeId],
    }))
  }

  function renderNode(node: CurriculumNode, depth = 0) {
    const hasChildren = node.children.length > 0
    const isOpen = expanded[node.id] ?? true
    const isSelected = selectedId === node.id
    const padding = indent[Math.min(depth, indent.length - 1)]

    return (
      <li key={node.id} className="space-y-2">
        <div
          className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
            isSelected
              ? 'border-orange-200 bg-brand-orangeSoft shadow-sm'
              : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
          } ${padding}`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 transition hover:border-orange-200 hover:text-brand-orange"
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}`}
            >
              <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
            </button>
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
              +
            </span>
          )}

          <button type="button" onClick={() => onSelect(node)} className="min-w-0 flex-1 text-left">
            <p className="text-sm font-semibold text-brand-ink">{node.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-brand-muted">{node.level}</p>
          </button>

          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            {node.level !== 'topic' ? (
              <button
                type="button"
                onClick={() => onAddChild(node)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-600 transition hover:border-orange-200 hover:text-brand-orange"
                aria-label={`Add child to ${node.name}`}
              >
                +
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRename(node)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 transition hover:border-orange-200 hover:text-brand-orange"
              aria-label={`Rename ${node.name}`}
            >
              R
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-600 transition hover:border-red-200 hover:text-red-600"
              aria-label={`Delete ${node.name}`}
            >
              D
            </button>
          </div>
        </div>

        {hasChildren && isOpen ? (
          <ul className="space-y-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-brand-muted">
        No curriculum nodes yet. Start by adding a technology.
      </div>
    )
  }

  return <ul className="space-y-3">{nodes.map((node) => renderNode(node))}</ul>
}
