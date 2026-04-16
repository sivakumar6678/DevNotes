import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { docsNavigation } from '../data/docsData'

interface NavItem {
  slug: string;
  title?: string;
  name?: string;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const indentClasses = ['pl-3', 'pl-6', 'pl-8', 'pl-10']

function getLabel(item: NavItem): string {
  return item.title || item.name || ''
}

function hasActiveDescendant(item: NavItem, activeSlug: string): boolean {
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    docsNavigation.reduce((acc, section: NavSection) => ({ ...acc, [section.title]: true }), {}),
  )
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

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

  function renderItem(item: NavItem, depth = 0) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const isOpen = openItems[item.slug]
    const label = getLabel(item)
    const active = item.slug === activeSlug || hasActiveDescendant(item, activeSlug)
    const padding = indentClasses[Math.min(depth, indentClasses.length - 1)]

    return (
      <li key={item.slug}>
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition ${padding} ${
            active
              ? 'border-sky-100 bg-sky-50 text-brand-ink shadow-sm'
              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-brand-ink'
          }`}
        >
          <NavLink
            to={`/notes/${item.slug}`}
            className="flex-1 text-left"
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </NavLink>

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
    return (
      <div className="space-y-3">
        {docsNavigation.map((section: NavSection) => {
          const isOpen = openSections[section.title]

          return (
            <section key={section.title} className="rounded-[1.5rem] border border-brand-border bg-white p-2">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left"
              >
                <span className="text-sm font-semibold text-brand-ink">{section.title}</span>
                <span className="text-xs uppercase tracking-[0.24em] text-brand-muted">{isOpen ? 'Hide' : 'Show'}</span>
              </button>

              {isOpen ? (
                <ul className="mt-2 space-y-2">
                  {section.items.map((item) => renderItem(item))}
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
