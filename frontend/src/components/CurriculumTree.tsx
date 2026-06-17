import { useEffect, useRef, useState, memo } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import type { CurriculumNode } from '../types'
import { SavingLoader } from './Loader'

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
  searchQuery?: string
  expandAllSignal?: number
  collapseAllSignal?: number
  initialExpanded?: Record<number, boolean>
  onExpandedChange?: (expanded: Record<number, boolean>) => void
  publishPendingState?: Record<number, 'publishing' | 'unpublishing'>
}

const NODE_TYPE_META: Record<NodeType, { label: string; childType: NodeType | null }> = {
  section: { label: 'Section', childType: 'topic' },
  topic: { label: 'Topic', childType: 'subtopic' },
  subtopic: { label: 'Subtopic', childType: null },
}

function resolveNodeType(node: CurriculumNode): NodeType {
  const nodeType = node.node_type ?? (node as unknown as { type?: NodeType }).type
  if (nodeType === 'section' || nodeType === 'topic' || nodeType === 'subtopic') return nodeType
  return node.parent_id === null ? 'section' : 'topic'
}

function collectOpenState(
  nodes: CurriculumNode[],
  current: Record<number, boolean>,
  forceOpen = false,
): Record<number, boolean> {
  const next = { ...current }

  const visit = (items: CurriculumNode[]) => {
    items.forEach((item) => {
      if (next[item.id] === undefined || forceOpen) {
        next[item.id] = true
      }
      visit(item.children)
    })
  }

  visit(nodes)
  return next
}

function collectClosedState(nodes: CurriculumNode[]): Record<number, boolean> {
  const next: Record<number, boolean> = {}

  const visit = (items: CurriculumNode[]) => {
    items.forEach((item) => {
      next[item.id] = false
      visit(item.children)
    })
  }

  visit(nodes)
  return next
}

function filterNodes(nodes: CurriculumNode[], query: string): CurriculumNode[] {
  if (!query) return nodes

  const lowerQuery = query.toLowerCase()

  return nodes
    .map((node) => {
      const isMatch = node.name.toLowerCase().includes(lowerQuery)
      const filteredChildren = filterNodes(node.children, query)

      if (isMatch) return node
      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
      return null
    })
    .filter(Boolean) as CurriculumNode[]
}

function InlineActions({
  node,
  onRename,
  onTogglePublish,
  onDelete,
  compact = false,
  publishPendingState,
}: {
  node: CurriculumNode
  onRename?: () => void
  onTogglePublish?: () => void
  onDelete?: () => void
  compact?: boolean
  publishPendingState?: 'publishing' | 'unpublishing'
}) {
  const isPublishPending = publishPendingState !== undefined
  const [feedbackState, setFeedbackState] = useState<'idle' | 'published' | 'draft'>('idle')
  const wasPendingRef = useRef(false)

  useEffect(() => {
    if (isPublishPending) {
      wasPendingRef.current = true
      return
    }

    if (wasPendingRef.current) {
      const nextFeedback = node.is_published ? 'published' : 'draft'
      setFeedbackState(nextFeedback)
      wasPendingRef.current = false

      const timeout = window.setTimeout(() => setFeedbackState('idle'), 1400)
      return () => window.clearTimeout(timeout)
    }
  }, [isPublishPending, node.is_published])

  const editClassName = compact
    ? 'inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:shadow active:translate-y-0 active:scale-[0.98]'
    : 'inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:shadow active:translate-y-0 active:scale-[0.98]'
  const publishClassName = node.is_published
    ? 'inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-amber-300 hover:bg-amber-100 hover:text-amber-800 hover:shadow active:translate-y-0 active:scale-[0.98]'
    : 'inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 hover:shadow active:translate-y-0 active:scale-[0.98]'
  const deleteClassName = compact
    ? 'inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-red-100 hover:shadow active:translate-y-0 active:scale-[0.98]'
    : 'inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-red-100 hover:shadow active:translate-y-0 active:scale-[0.98]'

  return (
    <div className="flex items-center gap-1.5">
      {onRename ? (
        <button
          type="button"
          disabled={isPublishPending}
          onClick={(e) => { e.stopPropagation(); onRename() }}
          className={`${editClassName} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Edit
        </button>
      ) : null}
      {onTogglePublish ? (
        <button
          type="button"
          disabled={isPublishPending}
          onClick={(e) => { e.stopPropagation(); onTogglePublish() }}
          className={`${publishClassName} disabled:cursor-not-allowed disabled:opacity-70`}
          aria-busy={isPublishPending}
        >
          {isPublishPending ? <SavingLoader className="w-10" /> : null}
          {isPublishPending
            ? (node.is_published ? 'Unpublishing...' : 'Publishing...')
            : feedbackState === 'published'
              ? 'Published ✓'
              : feedbackState === 'draft'
                ? 'Draft ✓'
                : node.is_published
                  ? 'Unpublish'
                  : 'Publish'}
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          disabled={isPublishPending}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className={`${deleteClassName} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {compact ? <Trash2 className="h-3.5 w-3.5" /> : 'Delete'}
        </button>
      ) : null}
    </div>
  )
}

const CurriculumTree = memo(function CurriculumTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
  onTogglePublish,
  isSaving = false,
  searchQuery = '',
  expandAllSignal = 0,
  collapseAllSignal = 0,
  initialExpanded = {},
  onExpandedChange,
  publishPendingState = {},
}: CurriculumTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(initialExpanded)
  const [addingToNodeId, setAddingToNodeId] = useState<number | 'root' | null>(null)
  const [addingNodeType, setAddingNodeType] = useState<NodeType>('section')
  const [renamingNodeId, setRenamingNodeId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lastExpandAllSignalRef = useRef(expandAllSignal)
  const lastCollapseAllSignalRef = useRef(collapseAllSignal)

  const filteredNodes = filterNodes(nodes, searchQuery)

  useEffect(() => {
    setExpanded((current) => collectOpenState(nodes, current))
  }, [nodes])

  useEffect(() => {
    if (expandAllSignal > lastExpandAllSignalRef.current) {
      lastExpandAllSignalRef.current = expandAllSignal
      setExpanded((current) => collectOpenState(nodes, current, true))
    }
  }, [expandAllSignal, nodes])

  useEffect(() => {
    if (collapseAllSignal > lastCollapseAllSignalRef.current) {
      lastCollapseAllSignalRef.current = collapseAllSignal
      setExpanded(collectClosedState(nodes))
    }
  }, [collapseAllSignal, nodes])

  useEffect(() => {
    if (searchQuery.length > 1) {
      setExpanded((current) => collectOpenState(nodes, current, true))
    }
  }, [searchQuery, nodes])

  useEffect(() => {
    if ((addingToNodeId !== null || renamingNodeId !== null) && inputRef.current) {
      inputRef.current.focus()
    }
  }, [addingToNodeId, renamingNodeId])

  useEffect(() => {
    onExpandedChange?.(expanded)
  }, [expanded, onExpandedChange])

  const toggle = (id: number) => setExpanded((current) => ({ ...current, [id]: !current[id] }))

  const stopProp = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  function resetDraftState() {
    setAddingToNodeId(null)
    setRenamingNodeId(null)
    setInputValue('')
  }

  function triggerAddChild(parentId: number | 'root', childType: NodeType) {
    setAddingToNodeId(parentId)
    setAddingNodeType(childType)
    setRenamingNodeId(null)
    setInputValue('')

    if (parentId !== 'root') {
      setExpanded((current) => ({ ...current, [parentId]: true }))
    }
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
      resetDraftState()
      return
    }

    if (e.key !== 'Enter') return

    const value = inputValue.trim()
    if (!value) {
      resetDraftState()
      return
    }

    if (action === 'add' && onAddChild) {
      const parentId = addingToNodeId === 'root' ? null : (addingToNodeId as number)
      onAddChild(parentId, value, addingNodeType)
    }

    if (action === 'rename' && onRename && node) {
      onRename(node.id, value)
    }

    resetDraftState()
  }

  function renderInlineInput(action: 'add' | 'rename', node?: CurriculumNode) {
    const meta = NODE_TYPE_META[action === 'add' ? addingNodeType : resolveNodeType(node!)]
    const helperText =
      action === 'add'
        ? `Create ${meta.label.toLowerCase()} here`
        : `Rename ${meta.label.toLowerCase()}`

    return (
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-orange-200 bg-orange-50/70 p-3 shadow-sm transition-all duration-150">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange">
          <span className="rounded-full bg-white px-2 py-1 text-[10px]">{meta.label}</span>
          <span>{helperText}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, action, node)}
            onBlur={() => { if (!isSaving) resetDraftState() }}
            placeholder={action === 'add' ? `New ${meta.label.toLowerCase()} name...` : `Rename "${node?.name}"...`}
            disabled={isSaving}
            className={`h-10 flex-1 rounded-xl border border-orange-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 ${isSaving ? 'cursor-not-allowed opacity-50' : ''}`}
          />
          <span className="shrink-0 text-xs text-slate-500">
            {isSaving ? <SavingLoader className="w-6" /> : 'Enter to save'}
          </span>
        </div>
      </div>
    )
  }

  function renderSection(node: CurriculumNode) {
    const isOpen = expanded[node.id] ?? true
    const isRenaming = renamingNodeId === node.id
    const isAddingChild = addingToNodeId === node.id

    return (
      <section key={node.id} className="overflow-hidden rounded-[22px] border border-slate-300 bg-white shadow-sm ring-1 ring-slate-100">
        <div
          data-node-id={node.id}
          role="button"
          tabIndex={0}
          onClick={() => toggle(node.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle(node.id)
            }
          }}
          className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-100/80 px-4 py-3.5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={(e) => stopProp(e, () => toggle(node.id))}
              className="mt-0.5 rounded-lg p-1 text-slate-400 transition-all duration-150 hover:bg-white hover:text-slate-700 active:scale-95"
            >
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Section
                </span>
                {!node.is_published ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Draft
                  </span>
                ) : null}
              </div>

              <div className="mt-2 min-w-0">
                {isRenaming ? (
                  renderInlineInput('rename', node)
                ) : (
                  <>
                    <h3 className="truncate text-[17px] font-semibold tracking-tight text-slate-950">{node.name}</h3>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => stopProp(e, () => triggerAddChild(node.id, 'topic'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-orange-400 hover:bg-orange-100 hover:text-orange-800 hover:shadow active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Topic
            </button>
            <div className="hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 sm:block">
              {node.children.length} topics
            </div>
            {(onRename || onDelete || onTogglePublish) ? (
              <InlineActions
                node={node}
                onRename={onRename ? () => triggerRename(node) : undefined}
                onDelete={onDelete ? () => triggerDelete(node) : undefined}
                onTogglePublish={onTogglePublish ? () => onTogglePublish(node.id, node.is_published) : undefined}
                publishPendingState={publishPendingState[node.id]}
              />
            ) : null}
          </div>
        </div>

        {isOpen ? (
          <div className="space-y-3 px-4 py-4">
            {node.children.length > 0 ? (
              <ul className="space-y-2.5">
                {node.children.map((child) => renderNode(child))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No topics yet. Add the first topic to start this section.
              </div>
            )}

            {isAddingChild ? (
              renderInlineInput('add', node)
            ) : null}
          </div>
        ) : null}
      </section>
    )
  }

  function renderTopic(node: CurriculumNode) {
    const isOpen = expanded[node.id] ?? true
    const isRenaming = renamingNodeId === node.id
    const isAddingChild = addingToNodeId === node.id

    return (
      <li key={node.id} className="rounded-2xl border border-slate-200 bg-slate-50/70">
        <div
          data-node-id={node.id}
          role="button"
          tabIndex={0}
          onClick={() => toggle(node.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle(node.id)
            }
          }}
          className="flex items-start justify-between gap-4 px-4 py-3"
        >
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={(e) => stopProp(e, () => toggle(node.id))}
              className="mt-0.5 rounded-lg p-1 text-slate-400 transition-all duration-150 hover:bg-white hover:text-slate-700 active:scale-95"
            >
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200">Topic</span>
                {!node.is_published ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Draft
                  </span>
                ) : null}
              </div>

              <div className="mt-2 min-w-0">
                {isRenaming ? (
                  renderInlineInput('rename', node)
                ) : (
                  <>
                    <div className="truncate text-[15px] font-semibold text-slate-900">{node.name}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => stopProp(e, () => triggerAddChild(node.id, 'subtopic'))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-slate-300 hover:bg-white hover:text-slate-800 hover:shadow active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Subtopic
            </button>
            {(onRename || onDelete || onTogglePublish) ? (
              <InlineActions
                compact
                node={node}
                onRename={onRename ? () => triggerRename(node) : undefined}
                onDelete={onDelete ? () => triggerDelete(node) : undefined}
                onTogglePublish={onTogglePublish ? () => onTogglePublish(node.id, node.is_published) : undefined}
                publishPendingState={publishPendingState[node.id]}
              />
            ) : null}
          </div>
        </div>

        {isOpen ? (
          <div className="space-y-2 border-t border-slate-200 bg-white px-4 py-3">
            <div className="ml-4 border-l-2 border-slate-200 pl-4">
              {node.children.length > 0 ? (
                <ul className="space-y-1.5">
                  {node.children.map((child) => renderNode(child))}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No subtopics yet. Add the first subtopic under this topic.
                </div>
              )}

              {isAddingChild ? (
                <div className="mt-2.5">
                  {renderInlineInput('add', node)}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </li>
    )
  }

  function renderSubtopic(node: CurriculumNode) {
    const isSelected = selectedId === node.id
    const isRenaming = renamingNodeId === node.id
    const dotClassName = node.is_published
      ? 'bg-emerald-500 ring-emerald-100'
      : 'bg-amber-400 ring-amber-100'

    return (
      <li key={node.id} className="relative">
        <div
          data-node-id={node.id}
          role="button"
          tabIndex={0}
          onClick={() => { if (!isRenaming) onSelect(node) }}
          onKeyDown={(e) => {
            if (!isRenaming && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onSelect(node)
            }
          }}
          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
            isSelected && !isRenaming
              ? 'border-orange-200 bg-orange-50 text-brand-orange'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
          }`}
        >
          {isRenaming ? (
            renderInlineInput('rename', node)
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <div className={`h-2 w-2 rounded-full ring-4 ${dotClassName}`} />
              <div className="min-w-0">
                <div className="truncate text-sm font-normal text-slate-800">{node.name}</div>
                {!node.is_published ? (
                  <div className="mt-0.5 text-[11px] font-medium text-amber-700">Draft</div>
                ) : null}
              </div>
            </div>
          )}

          {!isRenaming && (onRename || onDelete || onTogglePublish) ? (
            <InlineActions
              compact
              node={node}
              onRename={onRename ? () => triggerRename(node) : undefined}
              onDelete={onDelete ? () => triggerDelete(node) : undefined}
              onTogglePublish={onTogglePublish ? () => onTogglePublish(node.id, node.is_published) : undefined}
              publishPendingState={publishPendingState[node.id]}
            />
          ) : null}
        </div>
      </li>
    )
  }

  function renderNode(node: CurriculumNode) {
    const nodeType = resolveNodeType(node)

    if (nodeType === 'section') return renderSection(node)
    if (nodeType === 'topic') return renderTopic(node)
    return renderSubtopic(node)
  }

  const hasNodes = filteredNodes.length > 0 || addingToNodeId === 'root'

  return (
    <div className="space-y-3">
      {!hasNodes ? (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-4 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">No content found.</p>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery ? 'Try a different search term.' : 'Create a section to start organizing the curriculum.'}
          </p>
          {onAddChild && !searchQuery ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => triggerAddChild('root', 'section')}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-orange-600 hover:shadow active:translate-y-0 active:scale-[0.98] disabled:opacity-50"
            >
              {isSaving ? <SavingLoader className="bg-orange-200/50" /> : <Plus className="h-4 w-4" />}
              Add First Section
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {filteredNodes.map((node) => renderNode(node))}

          {addingToNodeId === 'root' ? (
            <div className="rounded-[24px] border border-orange-200 bg-orange-50/70 p-4">
              {renderInlineInput('add')}
            </div>
          ) : null}

          {onAddChild && addingToNodeId !== 'root' && !searchQuery ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => triggerAddChild('root', 'section')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 transition-all duration-150 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 hover:shadow-sm active:translate-y-0 active:scale-[0.99] disabled:opacity-50"
            >
              {isSaving ? <SavingLoader /> : <Plus className="h-4 w-4" />}
              Add New Section
            </button>
          ) : null}
        </>
      )}
    </div>
  )
})

export default CurriculumTree
