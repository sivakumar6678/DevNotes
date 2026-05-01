import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CurriculumNode } from '../types'
import { SavingLoader } from './Loader'

// ─── Types ───────────────────────────────────────────────────────────────────
type NodeType = 'section' | 'topic' | 'subtopic'

interface CurriculumTreeProps {
  nodes: CurriculumNode[]
  selectedId: number | null
  onSelect: (node: CurriculumNode) => void
  onAddChild?: (parentId: number | null, name: string, nodeType: NodeType) => Promise<void> | void
  onRename?: (nodeId: number, newName: string) => Promise<void> | void
  onDelete?: (nodeId: number) => Promise<void> | void
  onTogglePublish?: (nodeId: number, current: boolean) => Promise<void> | void
  isSaving?: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────
const INDENT = ['pl-2', 'pl-7', 'pl-12', 'pl-16']

const NODE_TYPE_META: Record<NodeType, { label: string; pill: string; childType: NodeType | null }> = {
  section: {
    label: 'Section',
    pill: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
    childType: 'topic',
  },
  topic: {
    label: 'Topic',
    pill: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
    childType: 'subtopic',
  },
  subtopic: {
    label: 'Subtopic',
    pill: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    childType: null, // leaf — no children
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveNodeType(node: CurriculumNode): NodeType {
  const nt = node.node_type ?? (node as any).type
  if (nt === 'section' || nt === 'topic' || nt === 'subtopic') return nt
  // Fallback: infer from depth
  return node.parent_id === null ? 'section' : 'topic'
}

function collectOpenState(
  nodes: CurriculumNode[],
  current: Record<number, boolean>,
): Record<number, boolean> {
  const next = { ...current }
  const visit = (items: CurriculumNode[]) => {
    items.forEach((item) => {
      if (next[item.id] === undefined) next[item.id] = true
      visit(item.children)
    })
  }
  visit(nodes)
  return next
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CurriculumTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onTogglePublish,
  isSaving = false,
}: CurriculumTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [addingToNodeId, setAddingToNodeId] = useState<number | 'root' | null>(null)
  const [addingNodeType, setAddingNodeType] = useState<NodeType>('section')
  const [renamingNodeId, setRenamingNodeId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setExpanded((cur) => collectOpenState(nodes, cur))
  }, [nodes])

  useEffect(() => {
    if ((addingToNodeId !== null || renamingNodeId !== null) && inputRef.current) {
      inputRef.current.focus()
    }
  }, [addingToNodeId, renamingNodeId])

  const toggle = (id: number) =>
    setExpanded((cur) => ({ ...cur, [id]: !cur[id] }))

  const stopProp = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  function triggerAddChild(parentId: number | 'root', childType: NodeType) {
    setAddingToNodeId(parentId)
    setAddingNodeType(childType)
    setRenamingNodeId(null)
    setInputValue('')
    if (parentId !== 'root') setExpanded((cur) => ({ ...cur, [parentId]: true }))
  }

  function triggerRename(node: CurriculumNode) {
    setRenamingNodeId(node.id)
    setAddingToNodeId(null)
    setInputValue(node.name)
  }

  function triggerDelete(node: CurriculumNode) {
    if (window.confirm(`Delete "${node.name}" and all its children?`)) {
      onDelete?.(node.id)
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    action: 'add' | 'rename',
    node?: CurriculumNode,
  ) {
    if (e.key === 'Escape') {
      setAddingToNodeId(null)
      setRenamingNodeId(null)
      setInputValue('')
      return
    }
    if (e.key === 'Enter') {
      const val = inputValue.trim()
      if (!val) { setAddingToNodeId(null); setRenamingNodeId(null); return }

      if (action === 'add' && onAddChild) {
        // Use addingToNodeId as the canonical parent — it was explicitly set
        // by triggerAddChild(node.id, ...) so it is always correct.
        // Using node?.id was unreliable: if the closure captured an undefined
        // node the fallback was null, silently breaking the hierarchy.
        const parentId = addingToNodeId === 'root' ? null : (addingToNodeId as number)
        console.debug('[CurriculumTree] Creating topic:', { parent_id: parentId, name: val, node_type: addingNodeType })
        onAddChild(parentId, val, addingNodeType)
      } else if (action === 'rename' && onRename && node) {
        onRename(node.id, val)
      }

      setAddingToNodeId(null)
      setRenamingNodeId(null)
      setInputValue('')
    }
  }

  function renderInlineInput(action: 'add' | 'rename', node?: CurriculumNode) {
    const meta = NODE_TYPE_META[action === 'add' ? addingNodeType : resolveNodeType(node!)]
    return (
      <div className="flex flex-1 items-center gap-2 py-1">
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.pill}`}>
          {meta.label}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, action, node)}
          onBlur={() => { if (!isSaving) { setAddingToNodeId(null); setRenamingNodeId(null); setInputValue('') } }}
          placeholder={action === 'add' ? `New ${meta.label} name…` : `Rename "${node?.name}"…`}
          disabled={isSaving}
          className={`h-7 flex-1 rounded-lg border border-orange-300 bg-white px-3 text-sm text-slate-900 shadow-sm ring-2 ring-orange-100 placeholder:text-slate-400 focus:outline-none ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <span className="shrink-0 text-[11px] text-slate-400">
          {isSaving ? (
            <SavingLoader className="w-12" label="Saving curriculum changes" />
          ) : (
            '↵ save · esc cancel'
          )}
        </span>
      </div>
    )
  }

  function renderNode(node: CurriculumNode, depth = 0) {
    const nodeType = resolveNodeType(node)
    const meta = NODE_TYPE_META[nodeType]
    const hasChildren = node.children.length > 0
    const isOpen = expanded[node.id] ?? true
    const isSelected = selectedId === node.id
    const isRenaming = renamingNodeId === node.id
    const isAddingChild = addingToNodeId === node.id
    const pad = INDENT[Math.min(depth, INDENT.length - 1)]

    return (
      <li key={node.id}>
        {/* Row */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => { if (!isRenaming) onSelect(node) }}
          onKeyDown={(e) => {
            if (!isRenaming && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onSelect(node)
            }
          }}
          className={`group relative flex min-h-10 items-center gap-1.5 rounded-xl border pr-2 text-left transition-all duration-150 ${pad} ${
            isSelected && !isRenaming
              ? 'border-orange-200 bg-orange-50 shadow-sm'
              : isRenaming
                ? 'border-orange-300 bg-white shadow-sm'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
          }`}
        >
          {/* Expand/collapse chevron */}
          <button
            type="button"
            onClick={(e) => stopProp(e, () => (hasChildren || isAddingChild) && toggle(node.id))}
            disabled={!hasChildren && !isAddingChild}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors ${
              hasChildren || isAddingChild
                ? 'hover:bg-slate-200 hover:text-slate-700'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                (hasChildren || isAddingChild) && isOpen ? 'rotate-90' : ''
              }`}
            />
          </button>

          {/* Content */}
          <div className="min-w-0 flex-1 py-2">
            {isRenaming ? (
              renderInlineInput('rename', node)
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`truncate text-sm font-medium ${
                    nodeType === 'section'
                      ? 'text-slate-900'
                      : nodeType === 'topic'
                        ? 'text-slate-800'
                        : 'text-slate-600'
                  }`}
                >
                  {node.name}
                </span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.pill}`}>
                  {meta.label}
                </span>
                {!node.is_published && (
                  <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
                    Draft
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons — appear on hover */}
          {!isRenaming && (
            <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {/* Add child — only if this node type CAN have children */}
              {meta.childType && onAddChild && (
                <button
                  type="button"
                  title={`Add ${NODE_TYPE_META[meta.childType].label}`}
                  onClick={(e) => stopProp(e, () => triggerAddChild(node.id, meta.childType!))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Publish toggle */}
              {onTogglePublish && (
                <button
                  type="button"
                  title={node.is_published ? 'Unpublish' : 'Publish'}
                  onClick={(e) => stopProp(e, () => onTogglePublish(node.id, node.is_published))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  {node.is_published ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              )}
              {/* Rename */}
              {onRename && (
                <button
                  type="button"
                  title="Rename"
                  onClick={(e) => stopProp(e, () => triggerRename(node))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              {/* Delete */}
              {onDelete && (
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => stopProp(e, () => triggerDelete(node))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            (hasChildren || isAddingChild) && isOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            {(hasChildren || isAddingChild) && (
              <ul className="mt-0.5 space-y-0.5">
                {node.children.map((child) => renderNode(child, depth + 1))}
                {isAddingChild && (
                  <li
                    className={`flex min-h-10 items-center gap-1.5 pr-2 ${
                      INDENT[Math.min(depth + 1, INDENT.length - 1)]
                    }`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-300">
                      <div className="h-4 w-px bg-slate-200" />
                    </div>
                    {renderInlineInput('add', node)}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </li>
    )
  }

  const hasNodes = nodes.length > 0 || addingToNodeId === 'root'

  return (
    <div className="space-y-2">
      {!hasNodes ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No sections yet.</p>
          <p className="mt-1 text-xs text-slate-500">
            Create a Section to start organizing topics and subtopics.
          </p>
          {onAddChild && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => triggerAddChild('root', 'section')}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
            >
              {isSaving ? <SavingLoader className="bg-orange-200/50" label="Saving new section" /> : <Plus className="h-4 w-4" />}
              Add Section
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-0.5">
            {nodes.map((node) => renderNode(node))}
            {addingToNodeId === 'root' && (
              <li className={`flex min-h-10 items-center gap-1.5 rounded-xl border border-transparent pr-2 ${INDENT[0]}`}>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center" />
                {renderInlineInput('add', undefined)}
              </li>
            )}
          </ul>
          {onAddChild && addingToNodeId !== 'root' && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => triggerAddChild('root', 'section')}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              {isSaving ? <SavingLoader className="bg-slate-200" label="Saving new section" /> : <Plus className="h-3.5 w-3.5" />}
              Add Section
            </button>
          )}
        </>
      )}
    </div>
  )
}
