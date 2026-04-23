import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchCurriculum, fetchTechnologies } from '../api/curriculum'
import type { CurriculumNode, Technology } from '../types'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hasActiveDescendant(item: CurriculumNode, activeSlug: string): boolean {
  return item.children?.some(
    (child) => child.slug === activeSlug || hasActiveDescendant(child, activeSlug),
  ) ?? false
}

// ─── Tree Item ────────────────────────────────────────────────────────────────
function TreeItem({
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

  const pl = ['pl-0', 'pl-4', 'pl-7'][Math.min(depth, 2)]

  return (
    <li>
      <div
        className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${pl} ${
          isActive
            ? 'bg-brand-orangeSoft font-semibold text-brand-orange'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {/* Leaf: link. Branch: expand toggle + name */}
        {isLeaf ? (
          <NavLink
            to={`/notes/${node.slug}`}
            className="flex-1 truncate"
            aria-current={isActive ? 'page' : undefined}
          >
            {node.name}
          </NavLink>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex flex-1 items-center gap-1.5 truncate text-left"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              )}
              <span className={`truncate ${depth === 0 ? 'font-semibold text-slate-800' : ''}`}>
                {node.name}
              </span>
            </button>
          </>
        )}
      </div>

      {hasChildren && open && (
        <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} activeSlug={activeSlug} />
          ))}
        </ul>
      )}
    </li>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const location = useLocation()
  const activeSlug = location.pathname.split('/').pop() || ''

  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [activeTechId, setActiveTechId] = useState<number | null>(null)
  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load technology list once
  useEffect(() => {
    fetchTechnologies()
      .then((techs) => {
        const published = techs.filter((t) => t.is_published)
        setTechnologies(published)
        if (published.length > 0) setActiveTechId(published[0].id)
      })
      .catch(() => setError('Could not load topics.'))
  }, [])

  // Load tree when active tech changes
  useEffect(() => {
    if (!activeTechId) return
    setLoading(true)
    setError('')
    fetchCurriculum(activeTechId)
      .then((nodes) => {
        setTree(nodes)
      })
      .catch(() => setError('Could not load curriculum.'))
      .finally(() => setLoading(false))
  }, [activeTechId])

  const nav = (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Technology selector */}
      {technologies.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {technologies.map((tech) => (
            <button
              key={tech.id}
              type="button"
              onClick={() => setActiveTechId(tech.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tech.id === activeTechId
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
        {loading ? (
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-7 animate-pulse rounded-lg bg-slate-100"
                style={{ width: i % 2 === 0 ? '75%' : '90%' }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : tree.length === 0 ? (
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
            {tree.map((node) => (
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
}
