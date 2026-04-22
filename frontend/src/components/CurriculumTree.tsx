import { useEffect, useState, useRef } from 'react'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import type { CurriculumNode, TopicLevel } from '../types'

interface CurriculumTreeProps {
  nodes: CurriculumNode[]
  techId: number
  selectedId: number | null
  onSelect: (node: CurriculumNode) => void
  onAddChild?: (parentId: number | null, name: string, level: TopicLevel) => Promise<void> | void
  onRename?: (nodeId: number, newName: string) => Promise<void> | void
  onDelete?: (nodeId: number) => Promise<void> | void
}

const indent = ['pl-2', 'pl-6', 'pl-10', 'pl-14']

function getNodeType(node: CurriculumNode): TopicLevel {
  return node.type ?? node.level
}

function collectOpenState(nodes: CurriculumNode[], current: Record<number, boolean>) {
  const next = { ...current }

  function visit(items: CurriculumNode[]) {
    items.forEach((item) => {
      if (next[item.id] === undefined) {
        next[item.id] = true
      }
      visit(item.children)
    })
  }

  visit(nodes)
  return next
}

export default function CurriculumTree({
  nodes,
  techId,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onDelete,
}: CurriculumTreeProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [addingToNodeId, setAddingToNodeId] = useState<number | 'root' | null>(null)
  const [renamingNodeId, setRenamingNodeId] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setExpanded((current) => collectOpenState(nodes, current))
  }, [nodes])

  useEffect(() => {
    if ((addingToNodeId !== null || renamingNodeId !== null) && inputRef.current) {
      inputRef.current.focus()
    }
  }, [addingToNodeId, renamingNodeId])

  function toggle(nodeId: number) {
    setExpanded((current) => ({
      ...current,
      [nodeId]: !current[nodeId],
    }))
  }

  function handleAction(event: React.MouseEvent, action: () => void) {
    event.stopPropagation()
    action()
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>, action: 'add' | 'rename', node?: CurriculumNode) {
    if (event.key === 'Escape') {
      setAddingToNodeId(null)
      setRenamingNodeId(null)
      setInputValue('')
      return
    }

    if (event.key === 'Enter') {
      const val = inputValue.trim()
      if (!val) {
        setAddingToNodeId(null)
        setRenamingNodeId(null)
        return
      }

      if (action === 'add' && onAddChild) {
        if (addingToNodeId === 'root') {
          // Adding a Module directly to the Technology
          onAddChild(techId, val, 'module')
        } else if (node) {
          // Topics can't have children based on current level logic, but if backend allowed nested topics:
          const childLevel = getNodeType(node) === 'technology' ? 'module' : 'topic'
          onAddChild(node.id, val, childLevel)
          setExpanded((current) => ({ ...current, [node.id]: true }))
        }
      } else if (action === 'rename' && onRename && node) {
        onRename(node.id, val)
      }

      setAddingToNodeId(null)
      setRenamingNodeId(null)
      setInputValue('')
    }
  }

  function triggerAddChild(nodeId: number | 'root') {
    setAddingToNodeId(nodeId)
    setRenamingNodeId(null)
    setInputValue('')
    if (nodeId !== 'root') {
      setExpanded((current) => ({ ...current, [nodeId]: true }))
    }
  }

  function triggerRename(node: CurriculumNode) {
    setRenamingNodeId(node.id)
    setAddingToNodeId(null)
    setInputValue(node.name)
  }

  function triggerDelete(node: CurriculumNode) {
    if (window.confirm(`Are you sure you want to delete "${node.name}" and all its contents?`)) {
      onDelete?.(node.id)
    }
  }

  function renderInlineInput(action: 'add' | 'rename', node?: CurriculumNode) {
    return (
      <div className="flex flex-1 items-center gap-2 py-1.5 pr-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => handleInputKeyDown(e, action, node)}
          onBlur={() => {
            setAddingToNodeId(null)
            setRenamingNodeId(null)
            setInputValue('')
          }}
          placeholder={action === 'add' ? 'Type name and press Enter...' : 'Rename node...'}
          className="h-8 w-full max-w-sm flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-900 shadow-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
        />
        <span className="shrink-0 text-xs text-slate-400">↵ to save, esc to cancel</span>
      </div>
    )
  }

  function renderNode(node: CurriculumNode, depth = 0) {
    const nodeType = getNodeType(node)
    const hasChildren = node.children.length > 0
    const isOpen = expanded[node.id] ?? true
    const isSelected = selectedId === node.id
    const padding = indent[Math.min(depth, indent.length - 1)]
    const hasActions = Boolean(onAddChild || onRename || onDelete)
    const isRenaming = renamingNodeId === node.id
    const isAddingChild = addingToNodeId === node.id

    return (
      <li key={node.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => { if (!isRenaming) onSelect(node) }}
          onKeyDown={(event) => {
            if (!isRenaming && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              onSelect(node)
            }
          }}
          className={`group relative flex min-h-10 items-center gap-1.5 rounded-lg border text-left transition-colors ${padding} pr-2 ${
            isSelected && !isRenaming
              ? 'border-orange-200 bg-brand-orangeSoft shadow-sm'
              : isRenaming
                ? 'border-brand-orange bg-white shadow-sm'
                : 'border-transparent hover:bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={(event) => handleAction(event, () => (hasChildren || isAddingChild) && toggle(node.id))}
            disabled={!hasChildren && !isAddingChild}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 transition-colors ${
              hasChildren || isAddingChild ? 'hover:bg-slate-200 hover:text-slate-900' : 'opacity-0'
            }`}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}`}
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${(hasChildren || isAddingChild) && isOpen ? 'rotate-90' : ''}`} />
          </button>

          <div className="min-w-0 flex-1 py-2">
            {isRenaming ? (
              renderInlineInput('rename', node)
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <span className={`truncate text-sm font-medium ${nodeType === 'module' ? 'text-slate-900' : 'text-slate-700'}`}>
                  {node.name}
                </span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    nodeType === 'topic'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {nodeType}
                </span>
              </div>
            )}
          </div>

          {!isRenaming && hasActions ? (
            <div className="ml-1 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {nodeType !== 'topic' && onAddChild && (
                <button
                  type="button"
                  onClick={(event) => handleAction(event, () => triggerAddChild(node.id))}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Add child to ${node.name}`}
                  title="Add child"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              {onRename && (
                <button
                  type="button"
                  onClick={(event) => handleAction(event, () => triggerRename(node))}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={`Rename ${node.name}`}
                  title="Rename"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(event) => handleAction(event, () => triggerDelete(node))}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${node.name}`}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
            (hasChildren || isAddingChild) && isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            {(hasChildren || isAddingChild) ? (
              <ul className="mt-1 space-y-1">
                {node.children.map((child) => renderNode(child, depth + 1))}
                {isAddingChild && (
                  <li className={`flex min-h-10 items-center gap-1.5 pr-2 ${indent[Math.min(depth + 1, indent.length - 1)]}`}>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-300">
                      <div className="h-4 w-[2px] bg-slate-200 -mt-2 rounded-full" />
                    </div>
                    {renderInlineInput('add', node)}
                  </li>
                )}
              </ul>
            ) : null}
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-4">
      {nodes.length === 0 && addingToNodeId !== 'root' ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">No curriculum modules yet.</p>
          <p className="mt-1 text-sm text-slate-500">Add a module to begin organizing topics.</p>
          {onAddChild && (
            <button
              type="button"
              onClick={() => triggerAddChild('root')}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-orange/90"
            >
              <Plus className="h-4 w-4" />
              Add Module
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {nodes.map((node) => renderNode(node))}
            {addingToNodeId === 'root' && (
              <li className={`flex min-h-10 items-center gap-1.5 rounded-lg border border-transparent pr-2 ${indent[0]}`}>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center" />
                {renderInlineInput('add', undefined)}
              </li>
            )}
          </ul>
          {onAddChild && addingToNodeId !== 'root' && nodes.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => triggerAddChild('root')}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Plus className="h-4 w-4" />
                Add Module
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
