import { useEffect, useState } from 'react'
import { NavLink, useLocation, Link } from 'react-router-dom'
import { fetchCurriculum } from '../api/curriculum'
import type { CurriculumNode } from '../types'

const indentClasses = ['pl-3', 'pl-6', 'pl-8', 'pl-10']

function getLabel(item: CurriculumNode): string {
  return item.name || ''
}

function hasActiveDescendant(item: CurriculumNode, activeSlug: string): boolean {
  if (!item.children) {
    return false
  }

  return item.children.some(
    (child) => child.slug === activeSlug || hasActiveDescendant(child, activeSlug),
  )
}

export default function Sidebar() {
  const location = useLocation()
  const activeSlug = location.pathname.split('/').pop() || ''
  
  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false

    async function loadTree() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchCurriculum()
        console.log('Curriculum fetched for Sidebar:', data)
        if (!cancelled) {
          setTree(data)
          
          // Open all root sections by default
          const initialSections = data.reduce((acc, section) => ({ ...acc, [section.name]: true }), {})
          setOpenSections(initialSections)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load curriculum.')
          console.error(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTree()

    return () => {
      cancelled = true
    }
  }, [])

  function toggleSection(sectionTitle: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle],
    }))
  }

  function toggleItem(slug: string) {
    setOpenItems((current) => ({
      ...current,
      [slug]: !current[slug],
    }))
  }

  function renderItem(item: CurriculumNode, depth = 0) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    // Topic nodes without children are leaf nodes (notes)
    const isNote = !hasChildren || item.type === 'topic'
    
    const isOpen = openItems[item.slug]
    const label = getLabel(item)
    const active = item.slug === activeSlug || hasActiveDescendant(item, activeSlug)
    const padding = indentClasses[Math.min(depth, indentClasses.length - 1)]

    return (
      <li key={item.slug || item.id}>
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition ${padding} ${
            active
              ? 'border-sky-100 bg-sky-50 text-brand-ink shadow-sm'
              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-brand-ink'
          }`}
        >
          {isNote && item.slug ? (
            <NavLink
              to={`/notes/${item.slug}`}
              className="flex-1 text-left"
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </NavLink>
          ) : (
            <span className="flex-1 text-left cursor-default">{label}</span>
          )}

          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleItem(item.slug)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-brand-muted transition hover:border-slate-200 hover:text-brand-ink"
              aria-expanded={isOpen ? 'true' : 'false'}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${label}`}
            >
              <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
            </button>
          ) : null}
        </div>

        {hasChildren && isOpen ? (
          <ul className="mt-2 space-y-1">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    )
  }

  function renderNavigation() {
    if (loading) {
      return <div className="text-center text-sm text-brand-muted py-8">Loading...</div>
    }

    if (error) {
      return <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
    }

    if (tree.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-sm font-medium text-brand-ink">No curriculum found. Please create a technology first.</p>
          <Link to="/curriculum" className="mt-3 inline-block text-xs text-brand-orange font-semibold">
            Go to Curriculum Builder
          </Link>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {tree.map((section: CurriculumNode) => {
          const isOpen = openSections[section.name]

          return (
            <section key={section.slug || section.id} className="rounded-[1.5rem] border border-brand-border bg-white p-2">
              <button
                type="button"
                onClick={() => toggleSection(section.name)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left"
              >
                <span className="text-sm font-semibold text-brand-ink">{section.name}</span>
                <span className="text-xs uppercase tracking-[0.24em] text-brand-muted">{isOpen ? 'Hide' : 'Show'}</span>
              </button>

              {isOpen && section.children && section.children.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {section.children.map((item) => renderItem(item))}
                </ul>
              ) : null}
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <details className="brand-panel mb-6 overflow-hidden lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-4">
          <div>
            <p className="brand-label">Knowledge Base</p>
            <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-brand-ink">Browse notes</h2>
          </div>
        </summary>
        <div className="border-t border-brand-border px-4 py-4">
          {renderNavigation()}
        </div>
      </details>

      <aside className="hidden min-w-[300px] w-[300px] flex-shrink-0 lg:block">
        <div className="sticky top-36 rounded-[1.75rem] border border-brand-border bg-white px-4 py-4 shadow-brand">
          <div className="mb-4">
            <p className="brand-label">Knowledge Base</p>
            <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-brand-ink">Browse notes</h2>
          </div>

          {renderNavigation()}
        </div>
      </aside>
    </>
  )
}
