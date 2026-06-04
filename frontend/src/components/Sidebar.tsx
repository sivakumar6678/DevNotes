import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Search, X } from 'lucide-react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { fetchCurriculum } from '../api/curriculum'
import { DEFAULT_VERSION } from '../constants'
import { curriculumCache } from '../utils/curriculumCache'
import { useCurriculum } from '../context/CurriculumContext'
import { preloadNote } from '../hooks/useNote'
import { InlineLoader } from './Loader'
import type { CurriculumNode } from '../types'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function hasActiveDescendant(item: CurriculumNode, activeSlug: string): boolean {
  return (
    item.children?.some(
      (child) => child.slug === activeSlug || hasActiveDescendant(child, activeSlug),
    ) ?? false
  )
}

function treeContainsSlug(nodes: CurriculumNode[], activeSlug: string): boolean {
  return nodes.some((node) => node.slug === activeSlug || hasActiveDescendant(node, activeSlug))
}

function findAncestorSlugs(
  nodes: CurriculumNode[],
  targetSlug: string,
  path: string[] = [],
): string[] {
  for (const node of nodes) {
    const nextPath = node.slug ? [...path, node.slug] : path
    if (node.slug === targetSlug) return path
    if (node.children.length > 0) {
      const found = findAncestorSlugs(node.children, targetSlug, nextPath)
      if (found.length) return found
    }
  }
  return []
}

// ─── TreeItem ─────────────────────────────────────────────────────────────────

interface TreeItemProps {
  node: CurriculumNode
  activeSlug: string
  isOpen: boolean
  isItemOpen: (slug: string) => boolean
  onToggle: (slug: string) => void
}

const TreeItem = memo(function TreeItem({
  node,
  activeSlug,
  isOpen,
  isItemOpen,
  onToggle,
}: TreeItemProps) {
  const isLeaf = node.node_type === 'subtopic' && node.children.length === 0
  const isActive = node.slug === activeSlug
  const hasDescendant = !isActive && hasActiveDescendant(node, activeSlug)
  const hasChildren = node.children.length > 0

  // ── Section: chapter-level heading ─────────────────────────────────────────
  if (node.node_type === 'section') {
    return (
      <li className="mt-6 first:mt-2">
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">{node.name}</span>
        </div>
        {hasChildren && (
          <ul className="mt-2 space-y-0.5">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                activeSlug={activeSlug}
                isOpen={child.slug ? isItemOpen(child.slug) : false}
                isItemOpen={isItemOpen}
                onToggle={onToggle}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  // ── Topic: collapsible group with ancestor-active indicator ───────────────
  if (node.node_type === 'topic') {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.slug)}
          aria-expanded={isOpen}
          className={`sidebar-topic-btn ${hasDescendant ? 'sidebar-topic-btn--active' : ''}`}
        >
          <ChevronRight
            className={`sidebar-topic-chevron ${isOpen ? 'rotate-90' : ''} ${
              hasDescendant ? 'text-brand-orange/70' : ''
            }`}
          />
          <span className={`sidebar-topic-name ${hasDescendant ? 'text-slate-900 font-semibold' : ''}`}>
            {node.name}
          </span>
        </button>
        {isOpen && hasChildren && (
          <ul className="sidebar-topic-children">
            {node.children.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                activeSlug={activeSlug}
                isOpen={child.slug ? isItemOpen(child.slug) : false}
                isItemOpen={isItemOpen}
                onToggle={onToggle}
              />
            ))}
          </ul>
        )}
      </li>
    )
  }

  // ── Subtopic: navigable leaf ───────────────────────────────────────────────
  return (
    <li>
      {isLeaf ? (
        <NavLink
          to={`/notes/${node.slug}`}
          onMouseEnter={() => preloadNote(node.slug, DEFAULT_VERSION)}
          aria-current={isActive ? 'page' : undefined}
          className={({ isActive: navActive }) =>
            `sidebar-leaf ${navActive ? 'sidebar-leaf--active' : 'sidebar-leaf--idle'}`
          }
        >
          <span className="truncate">{node.name}</span>
        </NavLink>
      ) : (
        /* Subtopic-typed node that still has children — treat as topic */
        <button
          type="button"
          onClick={() => onToggle(node.slug)}
          className={`sidebar-topic-btn ${hasDescendant ? 'sidebar-topic-btn--active' : ''}`}
        >
          <ChevronRight className={`sidebar-topic-chevron ${isOpen ? 'rotate-90' : ''}`} />
          <span className="sidebar-topic-name">{node.name}</span>
        </button>
      )}
    </li>
  )
})

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = memo(function Sidebar() {
  const { slug } = useParams()
  const activeSlug = slug || ''

  const {
    technologies,
    loadTechnologies,
    publicTree,
    publicTreeLoading,
    loadPublicTree,
    techError,
    findTechIdBySlug,
  } = useCurriculum()

  const [sidebarTechId, setSidebarTechId] = useState<number | null>(null)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [filterQuery, setFilterQuery] = useState('')
  const filterRef = useRef<HTMLInputElement>(null)

  const publishedTechs = useMemo(
    () => technologies.filter((tech) => tech.is_published),
    [technologies],
  )

  // ── Data loading (logic preserved from original) ───────────────────────────

  useEffect(() => {
    loadTechnologies()
  }, [loadTechnologies])

  useEffect(() => {
    let cancelled = false

    async function syncSidebarTech() {
      if (publishedTechs.length === 0) return
      if (!activeSlug) {
        if (sidebarTechId === null) setSidebarTechId(publishedTechs[0].id)
        return
      }
      const knownTechId = findTechIdBySlug(activeSlug)
      if (knownTechId) {
        if (!cancelled) setSidebarTechId((c) => (c === knownTechId ? c : knownTechId))
        return
      }
      for (const tech of publishedTechs) {
        const cached = curriculumCache.getPublicTree(tech.id)
        if (cached && treeContainsSlug(cached, activeSlug)) {
          if (!cancelled) setSidebarTechId((c) => (c === tech.id ? c : tech.id))
          return
        }
      }
      for (const tech of publishedTechs) {
        const nodes = await fetchCurriculum(tech.id)
        curriculumCache.setPublicTree(tech.id, nodes)
        if (cancelled) return
        if (treeContainsSlug(nodes, activeSlug)) {
          setSidebarTechId((c) => (c === tech.id ? c : tech.id))
          return
        }
      }
      if (!cancelled && sidebarTechId === null) setSidebarTechId(publishedTechs[0].id)
    }

    void syncSidebarTech()
    return () => { cancelled = true }
  }, [activeSlug, findTechIdBySlug, publishedTechs, sidebarTechId])

  useEffect(() => {
    if (sidebarTechId) loadPublicTree(sidebarTechId)
  }, [sidebarTechId, loadPublicTree])

  useEffect(() => {
    if (publicTree.length === 0) return
    let first: string | null = null
    const findFirst = (list: CurriculumNode[]) => {
      for (const n of list) {
        if (first) return
        if (n.node_type === 'subtopic' && n.children.length === 0) { first = n.slug; return }
        if (n.children.length > 0) findFirst(n.children)
      }
    }
    findFirst(publicTree)
    if (first) preloadNote(first, DEFAULT_VERSION)
  }, [publicTree])

  useEffect(() => {
    if (!activeSlug || publicTree.length === 0) return
    const ancestors = findAncestorSlugs(publicTree, activeSlug)
    if (!ancestors.length) return
    setOpenItems((current) => {
      const next = new Set(current)
      let changed = false
      ancestors.forEach((a) => { if (!next.has(a)) { next.add(a); changed = true } })
      return changed ? next : current
    })
  }, [activeSlug, publicTree])

  const isItemOpen = useCallback((s: string) => openItems.has(s), [openItems])

  const handleToggle = useCallback((s: string) => {
    setOpenItems((current) => {
      const next = new Set(current)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }, [])

  function filterTree(nodes: CurriculumNode[], query: string): CurriculumNode[] {
    if (!query.trim()) return nodes
    const lower = query.toLowerCase()
    return nodes.reduce<CurriculumNode[]>((acc, node) => {
      const nameMatches = node.name.toLowerCase().includes(lower)
      const filteredChildren = filterTree(node.children, query)
      if (nameMatches || filteredChildren.length > 0) {
        acc.push({ ...node, children: nameMatches ? node.children : filteredChildren })
      }
      return acc
    }, [])
  }

  const displayTree = useMemo(() => filterTree(publicTree, filterQuery), [publicTree, filterQuery])

  // ── Current tech name (for mobile summary) ─────────────────────────────────
  const currentTechName = useMemo(
    () => publishedTechs.find((t) => t.id === sidebarTechId)?.name ?? '',
    [publishedTechs, sidebarTechId],
  )

  // ── Context Card ───────────────────────────────────────────────────────────
  const contextCard = useMemo(() => {
    if (!activeSlug || publicTree.length === 0) return null
    let sectionNode: CurriculumNode | null = null
    let topicNode: CurriculumNode | null = null
    let subtopicNode: CurriculumNode | null = null

    for (const s of publicTree) {
      if (s.slug === activeSlug || treeContainsSlug([s], activeSlug)) {
        sectionNode = s
        for (const t of s.children) {
          if (t.slug === activeSlug || treeContainsSlug([t], activeSlug)) {
            topicNode = t
            for (const st of t.children) {
              if (st.slug === activeSlug) {
                subtopicNode = st
                break
              }
            }
            break
          }
        }
        break
      }
    }
    if (!sectionNode && !topicNode && !subtopicNode) return null

    return (
      <div className="sidebar-context-card">
        <p className="sidebar-context-card-title">You are here</p>
        <div className="sidebar-context-card-path">
          <span className="sidebar-context-tech">{currentTechName}</span>
          {sectionNode && (
            <>
              <span className="sidebar-context-sep">/</span>
              <span className="sidebar-context-node">{sectionNode.name}</span>
            </>
          )}
          {topicNode && (
            <>
              <span className="sidebar-context-sep">/</span>
              <span className="sidebar-context-node">{topicNode.name}</span>
            </>
          )}
          {subtopicNode && (
            <>
              <span className="sidebar-context-sep">/</span>
              <span className="sidebar-context-active">{subtopicNode.name}</span>
            </>
          )}
        </div>
      </div>
    )
  }, [activeSlug, publicTree, currentTechName])

  // ── Shared nav content ─────────────────────────────────────────────────────
  const nav = (
    <div className="flex flex-1 min-h-0 flex-col gap-0">

      {/* Technology tabs */}
      {publishedTechs.length > 0 && (
        <div className="sidebar-tech-row">
          {publishedTechs.map((tech) => (
            <button
              key={tech.id}
              type="button"
              title={tech.name}
              onClick={() => setSidebarTechId(tech.id)}
              className={`sidebar-tech-tab ${
                tech.id === sidebarTechId
                  ? 'sidebar-tech-tab--active'
                  : 'sidebar-tech-tab--idle'
              }`}
            >
              {tech.name}
            </button>
          ))}
        </div>
      )}

      {/* Filter input */}
      <div className="sidebar-search">
        <Search className="sidebar-search-icon" aria-hidden="true" />
        <input
          ref={filterRef}
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={currentTechName ? `Search in ${currentTechName}…` : 'Filter topics…'}
          className="sidebar-search-input"
          aria-label="Filter curriculum topics"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => { setFilterQuery(''); filterRef.current?.focus() }}
            className="sidebar-search-clear"
            aria-label="Clear filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {contextCard}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto sidebar-scroll min-h-0">
        {publicTreeLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <InlineLoader label="Loading curriculum navigation" />
          </div>
        ) : techError ? (
          <p className="px-2 text-xs text-red-500">{techError}</p>
        ) : publicTree.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">No topics published yet.</p>
            <Link
              to="/curriculum"
              className="mt-2 block text-xs font-semibold text-brand-orange hover:underline"
            >
              Go to Curriculum Builder →
            </Link>
          </div>
        ) : (
          <ul className="space-y-0 pb-2">
            {displayTree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                activeSlug={activeSlug}
                isOpen={node.slug ? isItemOpen(node.slug) : false}
                isItemOpen={isItemOpen}
                onToggle={handleToggle}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile — collapsible panel */}
      <details className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <summary className="sidebar-mobile-summary">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {currentTechName || 'Curriculum'}
            </span>
            <span className="block text-sm font-semibold text-slate-800 truncate">
              Browse Topics
            </span>
          </div>
          <ChevronRight className="sidebar-mobile-chevron shrink-0" />
        </summary>
        <div className="border-t border-slate-100 px-4 py-3">{nav}</div>
      </details>

      {/* Desktop — sticky panel */}
      <aside className="hidden w-[272px] shrink-0 lg:block">
        <div className="sidebar-panel">
          <p className="sidebar-panel-header">Curriculum</p>
          {nav}
        </div>
      </aside>
    </>
  )
})

export default Sidebar
