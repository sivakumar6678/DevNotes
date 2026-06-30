import { useDeferredValue, useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  EyeOff,
  Globe,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Workflow,
} from 'lucide-react'
import { InlineLoader, PrimaryLoader, SavingLoader } from '../components/Loader'
import {
  createTechnology,
  createTopic,
  deleteTechnology,
  deleteTopic,
  updateTechnology,
  updateTopic,
} from '../api/curriculum'
import CurriculumTree from '../components/CurriculumTree'
import { useAuth } from '../context/AuthContext'
import { useCurriculum } from '../context/CurriculumContext'
import { curriculumCache } from '../utils/curriculumCache'
import {
  countCurriculumNodes,
  insertCurriculumNode,
  removeCurriculumNodes,
  updateCurriculumNode,
} from '../utils/curriculumTree'
import type { CurriculumNode, Technology } from '../types'

type NodeType = 'section' | 'topic' | 'subtopic'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function TechMenu({
  tech,
  onRename,
  onDelete,
  onTogglePublish,
  publishPendingState,
}: {
  tech: Technology
  onRename: () => void
  onDelete: () => void
  onTogglePublish: () => void
  publishPendingState?: 'publishing' | 'unpublishing'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const isPublishPending = publishPendingState !== undefined

  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      // Position the dropdown below the button, aligned to its right edge.
      // Dropdown width is 176px (w-44).
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right - 176 + window.scrollX,
      })
    }
  }, [])

  useEffect(() => {
    if (open) {
      updateCoords()
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open, updateCoords])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((current) => !current) }}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          className="z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <button
            type="button"
            disabled={isPublishPending}
            onClick={() => { setOpen(false); onRename() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400" />
            Rename
          </button>
          <button
            type="button"
            disabled={isPublishPending}
            onClick={() => { setOpen(false); onTogglePublish() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {publishPendingState === 'publishing' ? (
              <><SavingLoader className="w-10" /> Publishing...</>
            ) : publishPendingState === 'unpublishing' ? (
              <><SavingLoader className="w-10" /> Unpublishing...</>
            ) : tech.is_published ? (
              <><EyeOff className="h-3.5 w-3.5 text-slate-400" /> Unpublish</>
            ) : (
              <><Globe className="h-3.5 w-3.5 text-slate-400" /> Publish</>
            )}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            disabled={isPublishPending}
            onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

function countPublishedSubtopics(nodes: CurriculumNode[]): number {
  let count = 0

  const walk = (items: CurriculumNode[]) => {
    items.forEach((node) => {
      if (node.node_type === 'subtopic' && node.is_published) {
        count += 1
      }

      if (node.children.length > 0) {
        walk(node.children)
      }
    })
  }

  walk(nodes)
  return count
}

function findNodeById(nodes: CurriculumNode[], nodeId: number): CurriculumNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node
    }

    const match = findNodeById(node.children, nodeId)
    if (match) {
      return match
    }
  }

  return null
}

export default function CurriculumPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const {
    technologies,
    techsLoading,
    loadTechnologies,
    invalidateTechnologies,
    upsertTechnology,
    removeTechnology,
    tree,
    treeLoading,
    activeTechId,
    setActiveTechId,
    invalidateTree,
    mutateTree,
    invalidatePublicTree,
    techError,
    setTechError,
  } = useCurriculum()

  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null)
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [techModalOpen, setTechModalOpen] = useState(false)
  const [newTechName, setNewTechName] = useState('')
  const [techModalSaving, setTechModalSaving] = useState(false)
  const [renamingTechId, setRenamingTechId] = useState<number | null>(null)
  const [renameTechValue, setRenameTechValue] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [technologyQuery, setTechnologyQuery] = useState('')
  const [showMobileTechs, setShowMobileTechs] = useState(false)
  const [expandAllSignal, setExpandAllSignal] = useState(0)
  const [collapseAllSignal, setCollapseAllSignal] = useState(0)
  const [expandedByTech, setExpandedByTech] = useState<Record<number, Record<number, boolean>>>({})
  const [publishingNodes, setPublishingNodes] = useState<Record<number, 'publishing' | 'unpublishing'>>({})
  const [publishingTechnologies, setPublishingTechnologies] = useState<Record<number, 'publishing' | 'unpublishing'>>({})
  const scrollSnapshotRef = useRef<number | null>(null)
  const anchorNodeIdRef = useRef<number | null>(null)
  const anchorOffsetRef = useRef<number | null>(null)
  const treeRef = useRef<{ triggerAddSection: () => void }>(null)

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const deferredTechnologyQuery = useDeferredValue(technologyQuery)

  const activeTech = technologies.find((tech) => tech.id === activeTechId) ?? null
  const expandedState = activeTechId ? (expandedByTech[activeTechId] ?? {}) : {}

  useEffect(() => {
    if (techError) {
      setError(techError)
      setTechError('')
    }
  }, [techError, setTechError])

  useEffect(() => {
    void loadTechnologies()
  }, [loadTechnologies])

  useEffect(() => {
    if (technologies.length > 0 && activeTechId === null) {
      setActiveTechId(technologies[0].id)
    }
  }, [technologies, activeTechId, setActiveTechId])

  useEffect(() => {
    setSearchQuery('')
    setSelectedNode(null)
    setShowMobileTechs(false)
  }, [activeTechId])

  const flash = useCallback((message: string) => {
    setSuccessMsg(message)
    window.setTimeout(() => setSuccessMsg(''), 3000)
  }, [])

  const getTechnologyStats = useCallback((techId: number) => {
    const source = techId === activeTechId ? tree : (curriculumCache.getTree(techId) ?? [])
    const stats = countCurriculumNodes(source)

    return {
      ...stats,
      total: stats.sections + stats.topics + stats.subtopics,
    }
  }, [activeTechId, tree])

  const updateExpandedState = useCallback((nextExpanded: Record<number, boolean>) => {
    if (!activeTechId) return

    setExpandedByTech((current) => {
      const previous = current[activeTechId] ?? {}
      if (previous === nextExpanded) {
        return current
      }

      return {
        ...current,
        [activeTechId]: nextExpanded,
      }
    })
  }, [activeTechId])

  const captureTreeContext = useCallback((nodeId?: number | null) => {
    scrollSnapshotRef.current = window.scrollY
    anchorNodeIdRef.current = nodeId ?? null

    if (nodeId === null || nodeId === undefined) {
      anchorOffsetRef.current = null
      return
    }

    const anchor = document.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`)
    anchorOffsetRef.current = anchor ? anchor.getBoundingClientRect().top : null
  }, [])

  const restoreTreeContext = useCallback(() => {
    window.requestAnimationFrame(() => {
      const anchorNodeId = anchorNodeIdRef.current
      const anchorOffset = anchorOffsetRef.current

      if (anchorNodeId !== null && anchorOffset !== null) {
        const anchor = document.querySelector<HTMLElement>(`[data-node-id="${anchorNodeId}"]`)
        if (anchor) {
          const delta = anchor.getBoundingClientRect().top - anchorOffset
          if (delta !== 0) {
            window.scrollTo({ top: window.scrollY + delta })
          }
          return
        }
      }

      if (scrollSnapshotRef.current !== null) {
        window.scrollTo({ top: scrollSnapshotRef.current })
      }
    })
  }, [])

  const visibleTechnologies = technologies.filter((tech) =>
    tech.name.toLowerCase().includes(deferredTechnologyQuery.trim().toLowerCase()),
  )

  const stats = countCurriculumNodes(tree)
  const totalNodes = stats.sections + stats.topics + stats.subtopics
  const publishedSubtopics = countPublishedSubtopics(tree)
  const subtopicsHealthPct = stats.subtopics > 0 ? Math.round((publishedSubtopics / stats.subtopics) * 100) : 0

  async function handleAddTech(e: React.FormEvent) {
    e.preventDefault()
    const name = newTechName.trim()
    if (!name) return

    setTechModalSaving(true)
    try {
      const technology = await createTechnology({ name, slug: slugify(name) })
      upsertTechnology(technology)
      setTechModalOpen(false)
      setNewTechName('')
      setActiveTechId(technology.id)
      flash('Technology created.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create technology.')
    } finally {
      setTechModalSaving(false)
    }
  }

  async function handleRenameTech(techId: number) {
    const name = renameTechValue.trim()
    if (!name) return

    try {
      const technology = await updateTechnology(techId, { name })
      upsertTechnology(technology)
      setRenamingTechId(null)
      setRenameTechValue('')
      flash('Technology renamed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename technology.')
    }
  }

  async function handleDeleteTech(tech: Technology) {
    if (!window.confirm(`Delete "${tech.name}" and ALL its topics? This cannot be undone.`)) return

    const currentIndex = technologies.findIndex((item) => item.id === tech.id)
    const remaining = technologies.filter((item) => item.id !== tech.id)
    const fallbackTech = remaining[Math.min(currentIndex, remaining.length - 1)] ?? remaining[0] ?? null

    try {
      await deleteTechnology(tech.id)
      removeTechnology(tech.id)
      invalidateTree(tech.id)
      invalidatePublicTree(tech.id)
      invalidateTechnologies()

      if (selectedNode?.technology_id === tech.id) {
        setSelectedNode(null)
      }

      if (activeTechId === tech.id) {
        setActiveTechId(fallbackTech?.id ?? null)
      }

      flash('Technology deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete technology.')
    }
  }

  async function handleTogglePublishTech(tech: Technology) {
    const nextAction = tech.is_published ? 'unpublishing' : 'publishing'

    setPublishingTechnologies((current) => ({ ...current, [tech.id]: nextAction }))
    try {
      const technology = await updateTechnology(tech.id, { is_published: !tech.is_published })
      upsertTechnology(technology)
      flash(tech.is_published ? 'Technology unpublished.' : 'Technology published.')
    } catch {
      setError('Failed to update technology publish status.')
    } finally {
      setPublishingTechnologies((current) => {
        const next = { ...current }
        delete next[tech.id]
        return next
      })
    }
  }

  const handleAddChild = useCallback(async (parentId: number | null, name: string, nodeType: NodeType) => {
    if (!activeTechId) return

    captureTreeContext(parentId)
    setIsCreatingTopic(true)
    setError('')
    try {
      const node = await createTopic({
        name,
        slug: slugify(name),
        technology_id: activeTechId,
        parent_id: parentId,
        node_type: nodeType,
        sort_order: 0,
      })

      mutateTree(activeTechId, (current) => insertCurriculumNode(current, node))
      invalidatePublicTree(activeTechId)
      flash(`${nodeType === 'topic' ? 'Topic' : nodeType === 'subtopic' ? 'Subtopic' : 'Section'} added.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add node.')
    } finally {
      setIsCreatingTopic(false)
      restoreTreeContext()
    }
  }, [activeTechId, captureTreeContext, flash, invalidatePublicTree, mutateTree, restoreTreeContext])

  const handleRename = useCallback(async (nodeId: number, newName: string) => {
    if (!activeTechId) return

    captureTreeContext(nodeId)
    try {
      const updated = await updateTopic(nodeId, { name: newName })
      mutateTree(activeTechId, (current) =>
        updateCurriculumNode(current, nodeId, (node) => ({
          ...node,
          name: updated.name,
          slug: updated.slug,
        })),
      )
      invalidatePublicTree(activeTechId)
      setSelectedNode((current) => current?.id === nodeId ? { ...current, name: updated.name, slug: updated.slug } : current)
      flash('Node renamed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename node.')
    } finally {
      restoreTreeContext()
    }
  }, [activeTechId, captureTreeContext, flash, invalidatePublicTree, mutateTree, restoreTreeContext])

  const handleDelete = useCallback(async (nodeId: number) => {
    if (!activeTechId) return

    const anchorId = findNodeById(tree, nodeId)?.parent_id ?? nodeId
    captureTreeContext(anchorId)
    try {
      const result = await deleteTopic(nodeId)
      mutateTree(activeTechId, (current) => removeCurriculumNodes(current, result.deleted_ids))
      invalidatePublicTree(activeTechId)
      setSelectedNode((current) => current && result.deleted_ids.includes(current.id) ? null : current)
      flash('Node deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete node.')
    } finally {
      restoreTreeContext()
    }
  }, [activeTechId, captureTreeContext, flash, invalidatePublicTree, mutateTree, restoreTreeContext, tree])

  const handleTogglePublishNode = useCallback(async (nodeId: number, current: boolean) => {
    if (!activeTechId) return

    const nextAction = current ? 'unpublishing' : 'publishing'

    captureTreeContext(nodeId)
    setPublishingNodes((items) => ({ ...items, [nodeId]: nextAction }))
    try {
      const updated = await updateTopic(nodeId, { is_published: !current })
      mutateTree(activeTechId, (items) =>
        updateCurriculumNode(items, nodeId, (node) => ({
          ...node,
          is_published: updated.is_published,
        })),
      )
      invalidatePublicTree(activeTechId)
      setSelectedNode((node) => node?.id === nodeId ? { ...node, is_published: updated.is_published } : node)
      flash(updated.is_published ? 'Node published.' : 'Node unpublished.')
    } catch {
      setError('Failed to update publish status.')
    } finally {
      setPublishingNodes((items) => {
        const next = { ...items }
        delete next[nodeId]
        return next
      })
      restoreTreeContext()
    }
  }, [activeTechId, captureTreeContext, flash, invalidatePublicTree, mutateTree, restoreTreeContext])

  const handleNodeSelect = useCallback((node: CurriculumNode) => {
    setSelectedNode(node)
    if (node.node_type === 'subtopic') {
      navigate(`/admin/notes/${node.id}/edit`)
    }
  }, [navigate])

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1520px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-orangeSoft">
                <Workflow className="h-4.5 w-4.5 text-brand-orange" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-950">Curriculum Builder</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage technologies, sections, topics, and subtopics with minimal scrolling.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTechModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-orange-600 hover:shadow active:translate-y-0 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Technology
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="rounded-lg p-1 hover:bg-red-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileTechs((current) => !current)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Technology Workspace</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{activeTech?.name ?? 'Select a technology'}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showMobileTechs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[268px_minmax(0,1fr)]">
          <aside className={`${showMobileTechs ? 'block' : 'hidden'} lg:block lg:self-start lg:sticky lg:top-28`}>
            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100vh-7rem)] lg:min-h-0 lg:flex-col lg:overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand-orange" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Technologies</h2>
                </div>
                <div className="relative mt-3">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter technologies..."
                    value={technologyQuery}
                    onChange={(e) => setTechnologyQuery(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div className="p-2.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto sidebar-scroll">
                {techsLoading ? (
                  <div className="flex h-24 items-center px-2">
                    <InlineLoader label="Loading technologies" />
                  </div>
                ) : visibleTechnologies.length > 0 ? (
                  <div className="space-y-2">
                    {visibleTechnologies.map((tech) => {
                      const isActive = tech.id === activeTechId
                      const techStats = getTechnologyStats(tech.id)

                      return (
                        <div
                          key={tech.id}
                          className={`rounded-xl border transition ${isActive
                            ? 'border-orange-200 bg-orange-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          {renamingTechId === tech.id ? (
                            <div className="p-2.5">
                              <input
                                autoFocus
                                type="text"
                                value={renameTechValue}
                                onChange={(e) => setRenameTechValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') void handleRenameTech(tech.id)
                                  if (e.key === 'Escape') setRenamingTechId(null)
                                }}
                                onBlur={() => setRenamingTechId(null)}
                                className="h-10 w-full rounded-xl border border-orange-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                              />
                            </div>
                          ) : (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setActiveTechId(tech.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setActiveTechId(tech.id)
                                }
                              }}
                              className="flex w-full cursor-pointer items-start gap-3 p-3 text-left transition-all duration-150 hover:shadow-sm active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-orange/20 rounded-xl"
                            >
                              <div className={`mt-1 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-brand-orange' : 'bg-slate-300'}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className={`truncate text-sm ${isActive ? 'font-semibold text-slate-950' : 'font-medium text-slate-800'}`}>
                                      {tech.name}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-400">
                                      <span>{tech.is_published ? 'Published' : 'Draft'}</span>
                                      {techStats.total > 0 ? <span>{techStats.total} nodes</span> : null}
                                    </div>
                                  </div>
                                  {isAdmin ? (
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <TechMenu
                                        tech={tech}
                                        onRename={() => { setRenamingTechId(tech.id); setRenameTechValue(tech.name) }}
                                        onDelete={() => void handleDeleteTech(tech)}
                                        onTogglePublish={() => void handleTogglePublishTech(tech)}
                                        publishPendingState={publishingTechnologies[tech.id]}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                  <span><strong className="text-slate-900">{techStats.sections}</strong> Sections</span>
                                  <span><strong className="text-slate-900">{techStats.topics}</strong> Topics</span>
                                  <span><strong className="text-slate-900">{techStats.subtopics}</strong> Subtopics</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-700">No technologies found.</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {technologyQuery ? 'Try another search term.' : 'Create your first technology workspace to begin.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            {activeTech ? (
              <div className="space-y-4">
                <div className=" lg:z-10 lg:bg-slate-50 lg:pb-4">
                  <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                          Active Workspace
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="text-lg font-semibold tracking-tight text-slate-950">{activeTech.name}</h2>
                          <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${activeTech.is_published ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {activeTech.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-slate-500">
                          Add topics from section headers and subtopics from topic headers.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600 xl:justify-end">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                          <BookOpen className="h-4 w-4 text-slate-400" />
                          <span><strong className="text-slate-900">{totalNodes}</strong> Nodes</span>
                        </div>
                        <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                          <span><strong className="text-slate-900">{stats.sections}</strong> Sections</span>
                          <span><strong className="text-slate-900">{stats.topics}</strong> Topics</span>
                          <span><strong className="text-slate-900">{stats.subtopics}</strong> Subtopics</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                          <span className={subtopicsHealthPct === 100 ? 'text-emerald-600' : 'text-amber-600'}>
                            <strong>{subtopicsHealthPct}%</strong>
                          </span>
                          <span className="text-slate-500">Published</span>
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${subtopicsHealthPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-4.5">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative w-full sm:max-w-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="Filter sections, topics, and subtopics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => treeRef.current?.triggerAddSection()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-orange-600 hover:shadow active:translate-y-0 active:scale-[0.98]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Section
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setExpandAllSignal((current) => current + 1)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-slate-200 hover:text-slate-900 hover:shadow active:translate-y-0 active:scale-[0.98]"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                          Expand All
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollapseAllSignal((current) => current + 1)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-slate-200 hover:text-slate-900 hover:shadow active:translate-y-0 active:scale-[0.98]"
                        >
                          <Minimize2 className="h-3.5 w-3.5" />
                          Collapse All
                        </button>
                      </div>
                    </div>

                  </section>
                </div>

                <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-4.5">
                  {treeLoading && tree.length === 0 ? (
                    <PrimaryLoader className="min-h-[280px]" label="Loading curriculum tree" />
                  ) : (
                    <CurriculumTree
                      ref={treeRef}
                      key={activeTechId ?? 'curriculum-tree'}
                      nodes={tree}
                      selectedId={selectedNode?.id ?? null}
                      onSelect={handleNodeSelect}
                      onAddChild={isAdmin ? handleAddChild : undefined}
                      onRename={isAdmin ? handleRename : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                      onTogglePublish={isAdmin ? handleTogglePublishNode : undefined}
                      isSaving={isCreatingTopic}
                      searchQuery={deferredSearchQuery}
                      expandAllSignal={expandAllSignal}
                      collapseAllSignal={collapseAllSignal}
                      initialExpanded={expandedState}
                      onExpandedChange={updateExpandedState}
                      publishPendingState={publishingNodes}
                    />
                  )}
                </section>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Layers className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">No technology selected</h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Select a technology from the workspace panel, or create a new one to start building your curriculum.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {techModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setTechModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setTechModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold text-slate-900">Add Technology</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a workspace such as JavaScript, Python, or CSS.
            </p>
            <form onSubmit={handleAddTech} className="mt-5 space-y-4">
              <div>
                <label htmlFor="techName" className="block text-sm font-medium text-slate-700">
                  Technology Name
                </label>
                <input
                  id="techName"
                  autoFocus
                  type="text"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="e.g. JavaScript"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTechModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTechName.trim() || techModalSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {techModalSaving ? <SavingLoader className="bg-orange-200/50" label="Creating technology" /> : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
