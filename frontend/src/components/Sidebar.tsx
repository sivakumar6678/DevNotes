import { memo, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCurriculum } from '../context/CurriculumContext'
import { preloadNote } from '../hooks/useNote'
import { InlineLoader } from './Loader'
import type { CurriculumNode } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hasActiveDescendant(item: CurriculumNode, activeSlug: string): boolean {
  return item.children?.some(
    (child) => child.slug === activeSlug || hasActiveDescendant(child, activeSlug),
  ) ?? false
}

// ─── Tree Item (memoised — only rerenders if its specific node data or
//      active state changes) ─────────────────────────────────────────────────
const TreeItem = memo(function TreeItem({
  node,
  depth,
  activeSlug,
}: {
  node: CurriculumNode
  depth: number
  activeSlug: string
}) {
  const isLeaf = node.node_type === 'subtopic' && node.children.length === 0
  const isActive = node.slug === activeSlug
  const hasDescendantActive = !isActive && hasActiveDescendant(node, activeSlug)
  const [open, setOpen] = useState(isActive || hasDescendantActive)
  const hasChildren = node.children.length > 0

  // Auto-expand when a descendant becomes active (e.g. direct URL navigation)
  useEffect(() => {
    if (hasDescendantActive && !open) setOpen(true)
  }, [hasDescendantActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // Padding left scaled for hierarchy, ensures click area is consistent
  const pl = ['pl-3', 'pl-6', 'pl-9'][Math.min(depth, 2)]
  
  // Font sizes for hierarchy: Module titles > Topic titles
  const textSize = depth === 0 ? 'text-[0.95rem]' : 'text-[0.90rem]'
  const textWeight = depth === 0 ? 'font-semibold' : 'font-medium'

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-lg py-2 pr-3 transition-all duration-200 ease-in-out cursor-pointer ${pl} ${
          isActive
            ? 'bg-brand-orangeSoft text-brand-orange font-bold shadow-sm ring-1 ring-brand-orange/20'
            : `text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm ${textWeight}`
        }`}
        onClick={!isLeaf ? () => setOpen((o) => !o) : undefined}
      >
        {/* Leaf: link. Branch: expand toggle + name */}
        {isLeaf ? (
          <NavLink
            to={`/notes/${node.slug}`}
            onMouseEnter={() => preloadNote(node.slug, 'industry')}
            className={`flex-1 truncate block w-full outline-none ${textSize}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {node.name}
          </NavLink>
        ) : (
          <div className="flex flex-1 items-center gap-1.5 truncate text-left w-full outline-none">
            {open ? (
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-brand-orange' : 'text-slate-400 group-hover:text-slate-600'}`} />
            ) : (
              <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'text-brand-orange' : 'text-slate-400 group-hover:text-slate-600'}`} />
            )}
            <span className={`truncate ${textSize} ${isActive ? 'text-brand-orange' : 'text-slate-800'}`}>
              {node.name}
            </span>
          </div>
        )}
      </div>

      {hasChildren && open && (
        <ul className="ml-1 mt-1 space-y-1 border-l-2 border-slate-100/80 pl-1">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} activeSlug={activeSlug} />
          ))}
        </ul>
      )}
    </li>
  )
})

// ─── Main Sidebar (memoised — will not rerender unless context data changes) ──
const Sidebar = memo(function Sidebar() {
  const location = useLocation()
  const activeSlug = location.pathname.split('/').pop() || ''

  const {
    technologies,
    loadTechnologies,
    publicTree,
    publicTreeLoading,
    loadPublicTree,
    techError,
  } = useCurriculum()

  // Local state: which tech is selected in the sidebar
  const [sidebarTechId, setSidebarTechId] = useState<number | null>(null)

  // Load technologies once on mount
  useEffect(() => {
    loadTechnologies()
  }, [loadTechnologies])

  // Auto-select the first published technology when technologies load
  useEffect(() => {
    if (technologies.length > 0 && sidebarTechId === null) {
      const published = technologies.filter((t) => t.is_published)
      if (published.length > 0) {
        setSidebarTechId(published[0].id)
      }
    }
  }, [technologies, sidebarTechId])

  // Load public tree when sidebar tech changes
  useEffect(() => {
    if (sidebarTechId) {
      loadPublicTree(sidebarTechId)
    }
  }, [sidebarTechId, loadPublicTree])

  // Preload the first leaf topic
  useEffect(() => {
    if (publicTree.length === 0) return
    let firstLeaf: CurriculumNode | null = null
    const findFirst = (list: CurriculumNode[]) => {
      for (const n of list) {
        if (firstLeaf) return
        if (n.node_type === 'subtopic' && n.children.length === 0) {
          firstLeaf = n
          return
        }
        if (n.children.length > 0) findFirst(n.children)
      }
    }
    findFirst(publicTree)
    if (firstLeaf) preloadNote((firstLeaf as CurriculumNode).slug, 'industry')
  }, [publicTree])

  const publishedTechs = technologies.filter((t) => t.is_published)

  const nav = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Technology selector */}
      {publishedTechs.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {publishedTechs.map((tech) => (
            <button
              key={tech.id}
              type="button"
              onClick={() => setSidebarTechId(tech.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tech.id === sidebarTechId
                  ? 'bg-brand-orange text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tech.name}
            </button>
          ))}
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {publicTreeLoading ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <InlineLoader label="Loading curriculum navigation" />
          </div>
        ) : techError ? (
          <p className="text-xs text-red-500">{techError}</p>
        ) : publicTree.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500">No topics published yet.</p>
            <Link
              to="/curriculum"
              className="mt-2 block text-xs font-semibold text-brand-orange hover:underline"
            >
              Go to Curriculum Builder →
            </Link>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {publicTree.map((node) => (
              <TreeItem key={node.id} node={node} depth={0} activeSlug={activeSlug} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile collapsible */}
      <details className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">Browse Topics</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </summary>
        <div className="border-t border-slate-100 px-4 py-3">{nav}</div>
      </details>

      {/* Desktop sticky sidebar */}
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Knowledge Base
          </p>
          {nav}
        </div>
      </aside>
    </>
  )
})

export default Sidebar
