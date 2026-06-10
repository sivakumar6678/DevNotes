import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  EyeOff,
  Globe,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
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
import type { CurriculumNode, Technology } from '../types'

type NodeType = 'section' | 'topic' | 'subtopic'

// ─── Small helpers ────────────────────────────────────────────────────────────
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── Tech Menu (three-dot) ────────────────────────────────────────────────────
function TechMenu({
  tech,
  onRename,
  onDelete,
  onTogglePublish,
}: {
  tech: Technology
  onRename: () => void
  onDelete: () => void
  onTogglePublish: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); onRename() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onTogglePublish() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            {tech.is_published ? (
              <><EyeOff className="h-3.5 w-3.5 text-slate-400" /> Unpublish</>
            ) : (
              <><Globe className="h-3.5 w-3.5 text-slate-400" /> Publish</>
            )}
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CurriculumPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  // ── Pull shared state from the global curriculum context ───────────────────
  const {
    technologies,
    techsLoading,
    loadTechnologies,
    invalidateTechnologies,
    tree,
    treeLoading,
    activeTechId,
    setActiveTechId,
    loadTree,
    invalidateTree,
    techError,
    setTechError,
  } = useCurriculum()

  // ── Local UI state (not worth persisting globally) ─────────────────────────
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null)
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Add-tech modal
  const [techModalOpen, setTechModalOpen] = useState(false)
  const [newTechName, setNewTechName] = useState('')
  const [techModalSaving, setTechModalSaving] = useState(false)
  const [renamingTechId, setRenamingTechId] = useState<number | null>(null)
  const [renameTechValue, setRenameTechValue] = useState('')

  const activeTech = technologies.find((t) => t.id === activeTechId) ?? null

  // ── Merge context-level errors into local error banner ─────────────────────
  useEffect(() => {
    if (techError) {
      setError(techError)
      setTechError('')
    }
  }, [techError, setTechError])

  // ── Bootstrap: load technologies once (cache-aware) ────────────────────────
  // loadTechnologies reads from the in-memory cache first; only hits the
  // network when the cache is empty or expired (TTL: 5 min).
  useEffect(() => {
    loadTechnologies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select the first technology when the list first arrives (or returns
  // from cache) and no technology is already active.
  useEffect(() => {
    if (technologies.length > 0 && activeTechId === null) {
      setActiveTechId(technologies[0].id)
    }
  }, [technologies, activeTechId, setActiveTechId])

  // ─── Tech CRUD ─────────────────────────────────────────────────────────────
  async function handleAddTech(e: React.FormEvent) {
    e.preventDefault()
    const name = newTechName.trim()
    if (!name) return
    setTechModalSaving(true)
    try {
      const tech = await createTechnology({ name, slug: slugify(name) })
      setTechModalOpen(false)
      setNewTechName('')
      invalidateTechnologies()
      await loadTechnologies(true)
      setActiveTechId(tech.id)
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
      await updateTechnology(techId, { name })
      setRenamingTechId(null)
      setRenameTechValue('')
      invalidateTechnologies()
      await loadTechnologies(true)
      flash('Technology renamed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename.')
    }
  }

  async function handleDeleteTech(tech: Technology) {
    if (!window.confirm(`Delete "${tech.name}" and ALL its topics? This cannot be undone.`)) return
    try {
      await deleteTechnology(tech.id)
      if (activeTechId === tech.id) setActiveTechId(null)
      invalidateTechnologies()
      invalidateTree(tech.id)
      await loadTechnologies(true)
      flash('Technology deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }

  async function handleTogglePublishTech(tech: Technology) {
    try {
      await updateTechnology(tech.id, { is_published: !tech.is_published })
      invalidateTechnologies()
      await loadTechnologies(true)
      flash(tech.is_published ? 'Technology unpublished.' : 'Technology published.')
    } catch {
      setError('Failed to update publish status.')
    }
  }

  // ─── Node CRUD ─────────────────────────────────────────────────────────────
  const handleAddChild = useCallback(async (parentId: number | null, name: string, nodeType: NodeType) => {
    if (!activeTechId) return
    setIsCreatingTopic(true)
    setError('')
    try {
      await createTopic({
        name,
        slug: slugify(name),
        technology_id: activeTechId,
        parent_id: parentId,
        node_type: nodeType,
        sort_order: 0,
      })
      invalidateTree(activeTechId)
      await loadTree(activeTechId, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add node.')
    } finally {
      setIsCreatingTopic(false)
    }
  }, [activeTechId, invalidateTree, loadTree])

  const handleRename = useCallback(async (nodeId: number, newName: string) => {
    try {
      await updateTopic(nodeId, { name: newName })
      if (activeTechId) {
        invalidateTree(activeTechId)
        await loadTree(activeTechId, true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename.')
    }
  }, [activeTechId, invalidateTree, loadTree])

  const handleDelete = useCallback(async (nodeId: number) => {
    try {
      await deleteTopic(nodeId)
      if (selectedNode?.id === nodeId) setSelectedNode(null)
      if (activeTechId) {
        invalidateTree(activeTechId)
        await loadTree(activeTechId, true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete.')
    }
  }, [activeTechId, selectedNode, invalidateTree, loadTree])

  const handleTogglePublishNode = useCallback(async (nodeId: number, current: boolean) => {
    try {
      await updateTopic(nodeId, { is_published: !current })
      if (activeTechId) {
        invalidateTree(activeTechId)
        await loadTree(activeTechId, true)
      }
    } catch {
      setError('Failed to update publish status.')
    }
  }, [activeTechId, invalidateTree, loadTree])

  // ─── Node selection → navigate to editor page ─────────────────────────────
  const handleNodeSelect = useCallback((node: CurriculumNode) => {
    setSelectedNode(node)
    if (node.node_type === 'subtopic') {
      navigate(`/admin/notes/${node.id}/edit`)
    }
  }, [navigate])

  // ─── Flash helper ──────────────────────────────────────────────────────────
  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  function countAll(nodes: CurriculumNode[]): { sections: number; topics: number; subtopics: number } {
    let sections = 0, topics = 0, subtopics = 0
    const walk = (items: CurriculumNode[]) => {
      items.forEach((n) => {
        if (n.node_type === 'section') sections++
        else if (n.node_type === 'topic') topics++
        else subtopics++
        walk(n.children)
      })
    }
    walk(nodes)
    return { sections, topics, subtopics }
  }
  const stats = countAll(tree)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-slate-50">
      {/* ── Header ── */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orangeSoft">
              <BookOpen className="h-4.5 w-4.5 text-brand-orange" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-slate-900">Curriculum Builder</h1>
              <p className="text-xs text-slate-500">Manage sections, topics, and note content</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTechModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-orange-600 active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Add Technology
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0 overflow-hidden px-4 py-5 sm:px-6">
        {/* ── Left panel: Technology tabs ── */}
        <aside className="w-56 shrink-0 pr-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Technologies
          </p>

          {techsLoading ? (
            <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70">
              <InlineLoader label="Loading technologies" />
            </div>
          ) : technologies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center">
              <p className="text-xs text-slate-500">No technologies.</p>
              <button
                type="button"
                onClick={() => setTechModalOpen(true)}
                className="mt-3 text-xs font-semibold text-brand-orange hover:underline"
              >
                + Add one
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {technologies.map((tech) => {
                const isActive = tech.id === activeTechId
                return (
                  <li key={tech.id}>
                    {renamingTechId === tech.id ? (
                      <div className="flex items-center gap-1 px-2">
                        <input
                          autoFocus
                          type="text"
                          value={renameTechValue}
                          onChange={(e) => setRenameTechValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameTech(tech.id)
                            if (e.key === 'Escape') setRenamingTechId(null)
                          }}
                          onBlur={() => setRenamingTechId(null)}
                          className="h-7 flex-1 rounded-lg border border-orange-300 bg-white px-2 text-sm focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveTechId(tech.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setActiveTechId(tech.id)}
                        className={`group flex items-center justify-between gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-orangeSoft text-brand-ink shadow-sm ring-1 ring-orange-200'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                        }`}
                      >
                        <span className="truncate">{tech.name}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          {!tech.is_published && (
                            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-600">
                              Draft
                            </span>
                          )}
                          {isAdmin && (
                            <TechMenu
                              tech={tech}
                              onRename={() => { setRenamingTechId(tech.id); setRenameTechValue(tech.name) }}
                              onDelete={() => handleDeleteTech(tech)}
                              onTogglePublish={() => handleTogglePublishTech(tech)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        {/* ── Right panel: Tree + stats ── */}
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Alerts */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {activeTech ? (
            <>
              {/* Tech header row */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orangeSoft font-bold text-brand-orange">
                    {activeTech.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">{activeTech.name}</h2>
                    <p className="text-xs text-slate-500">
                      {stats.sections} sections · {stats.topics} topics · {stats.subtopics} subtopics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeTech.is_published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <Globe className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <EyeOff className="h-3 w-3" /> Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Tree panel */}
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {treeLoading && tree.length === 0 ? (
                  <PrimaryLoader className="min-h-[280px]" label="Loading curriculum tree" />
                ) : (
                  <CurriculumTree
                    nodes={tree}
                    selectedId={selectedNode?.id ?? null}
                    onSelect={handleNodeSelect}
                    onAddChild={isAdmin ? handleAddChild : undefined}
                    onRename={isAdmin ? handleRename : undefined}
                    onDelete={isAdmin ? handleDelete : undefined}
                    onTogglePublish={isAdmin ? handleTogglePublishNode : undefined}
                    isSaving={isCreatingTopic}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <div className="text-center">
                <Layers className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">Select a technology</p>
                <p className="mt-1 text-sm text-slate-500">Or create one to get started.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Add Technology Modal ── */}
      {techModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setTechModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setTechModalOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold text-slate-900">Add Technology</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a root technology tab (e.g. JavaScript, Python, CSS).
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
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none"
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
