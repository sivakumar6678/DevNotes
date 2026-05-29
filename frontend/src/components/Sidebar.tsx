import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { fetchCurriculum } from '../api/curriculum'
import { DEFAULT_VERSION } from '../constants'
import { curriculumCache } from '../utils/curriculumCache'
import { useCurriculum } from '../context/CurriculumContext'
import { preloadNote } from '../hooks/useNote'
import { InlineLoader } from './Loader'
import type { CurriculumNode } from '../types'

function hasActiveDescendant(item: CurriculumNode, activeSlug: string): boolean {
  return item.children?.some(
    (child) => child.slug === activeSlug || hasActiveDescendant(child, activeSlug),
  ) ?? false
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

    if (node.slug === targetSlug) {
      return path
    }

    if (node.children.length > 0) {
      const found = findAncestorSlugs(node.children, targetSlug, nextPath)
      if (found.length) {
        return found
      }
    }
  }

  return []
}

interface TreeItemProps {
  node: CurriculumNode
  depth: number
  activeSlug: string
  isOpen: boolean
  isItemOpen: (slug: string) => boolean
  onToggle: (slug: string) => void
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  activeSlug,
  isOpen,
  isItemOpen,
  onToggle,
}: TreeItemProps) {
  const isLeaf = node.node_type === 'subtopic' && node.children.length === 0
  const isActive = node.slug === activeSlug
  const hasDescendant = !isActive && hasActiveDescendant(node, activeSlug)
  const hasChildren = node.children.length > 0

  const pl = ['pl-3', 'pl-6', 'pl-9'][Math.min(depth, 2)]
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
        onClick={!isLeaf && node.slug ? () => onToggle(node.slug) : undefined}
      >
        {isLeaf ? (
          <NavLink
            to={`/notes/${node.slug}`}
            onMouseEnter={() => preloadNote(node.slug, DEFAULT_VERSION)}
            className={`flex-1 truncate block w-full outline-none ${textSize}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {node.name}
          </NavLink>
        ) : (
          <div className="flex flex-1 items-center gap-1.5 truncate text-left w-full outline-none">
            {isOpen || hasDescendant ? (
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

      {hasChildren && (isOpen || hasDescendant) && (
        <ul className="ml-1 mt-1 space-y-1 border-l-2 border-slate-100/80 pl-1">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
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
})

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

  const publishedTechs = useMemo(
    () => technologies.filter((tech) => tech.is_published),
    [technologies],
  )

  useEffect(() => {
    loadTechnologies()
  }, [loadTechnologies])

  useEffect(() => {
    let cancelled = false

    async function syncSidebarTech() {
      if (publishedTechs.length === 0) {
        return
      }

      if (!activeSlug) {
        if (sidebarTechId === null) {
          setSidebarTechId(publishedTechs[0].id)
        }
        return
      }

      const knownTechId = findTechIdBySlug(activeSlug)
      if (knownTechId) {
        if (!cancelled) {
          setSidebarTechId((current) => (current === knownTechId ? current : knownTechId))
        }
        return
      }

      for (const tech of publishedTechs) {
        const cachedTree = curriculumCache.getPublicTree(tech.id)
        if (cachedTree && treeContainsSlug(cachedTree, activeSlug)) {
          if (!cancelled) {
            setSidebarTechId((current) => (current === tech.id ? current : tech.id))
          }
          return
        }
      }

      for (const tech of publishedTechs) {
        const nodes = await fetchCurriculum(tech.id)
        curriculumCache.setPublicTree(tech.id, nodes)

        if (cancelled) {
          return
        }

        if (treeContainsSlug(nodes, activeSlug)) {
          setSidebarTechId((current) => (current === tech.id ? current : tech.id))
          return
        }
      }

      if (!cancelled && sidebarTechId === null) {
        setSidebarTechId(publishedTechs[0].id)
      }
    }

    void syncSidebarTech()

    return () => {
      cancelled = true
    }
  }, [activeSlug, findTechIdBySlug, publishedTechs, sidebarTechId])

  useEffect(() => {
    if (sidebarTechId) {
      loadPublicTree(sidebarTechId)
    }
  }, [sidebarTechId, loadPublicTree])

  useEffect(() => {
    if (publicTree.length === 0) {
      return
    }

    let firstLeafSlug: string | null = null

    const findFirstLeaf = (list: CurriculumNode[]) => {
      for (const node of list) {
        if (firstLeafSlug) {
          return
        }

        if (node.node_type === 'subtopic' && node.children.length === 0) {
          firstLeafSlug = node.slug
          return
        }

        if (node.children.length > 0) {
          findFirstLeaf(node.children)
        }
      }
    }

    findFirstLeaf(publicTree)

    if (firstLeafSlug) {
      preloadNote(firstLeafSlug, DEFAULT_VERSION)
    }
  }, [publicTree])

  useEffect(() => {
    if (!activeSlug || publicTree.length === 0) {
      return
    }

    const ancestors = findAncestorSlugs(publicTree, activeSlug)
    if (!ancestors.length) {
      return
    }

    setOpenItems((current) => {
      const next = new Set(current)
      let changed = false

      ancestors.forEach((ancestor) => {
        if (!next.has(ancestor)) {
          next.add(ancestor)
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [activeSlug, publicTree])

  const isItemOpen = useCallback((itemSlug: string) => openItems.has(itemSlug), [openItems])

  const handleToggle = useCallback((itemSlug: string) => {
    setOpenItems((current) => {
      const next = new Set(current)

      if (next.has(itemSlug)) {
        next.delete(itemSlug)
      } else {
        next.add(itemSlug)
      }

      return next
    })
  }, [])

  /** Recursively filter the tree so only nodes whose name matches (or have matching descendants) remain. */
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

  const nav = (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
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

      {/* Search / filter input */}
      <div className="mb-3 relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter topics…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:outline-none transition"
        />
      </div>

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
            {displayTree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
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

  return (
    <>
      <details className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">Browse Topics</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </summary>
        <div className="border-t border-slate-100 px-4 py-3">{nav}</div>
      </details>

      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="sticky top-36 flex flex-col max-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="mb-3 shrink-0 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Curriculum
          </p>
          {nav}
        </div>
      </aside>
    </>
  )
})

export default Sidebar
