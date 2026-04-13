import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { docsNavigation } from '../data/docsData'

export default function Sidebar() {
  const [openSections, setOpenSections] = useState(() =>
    docsNavigation.reduce((acc, section) => ({ ...acc, [section.title]: true }), {}),
  )

  function toggleSection(sectionTitle) {
    setOpenSections((current) => ({
      ...current,
      [sectionTitle]: !current[sectionTitle],
    }))
  }

  function renderNavigation() {
    return (
      <div className="space-y-3">
        {docsNavigation.map((section) => {
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
                  {section.items.map((item) => (
                    <li key={item.slug}>
                      <NavLink
                        to={`/notes/${item.slug}`}
                        className={({ isActive }) =>
                          `block rounded-xl border px-3 py-3 text-sm transition ${
                            isActive
                              ? 'border-sky-100 bg-sky-50 text-brand-ink shadow-sm'
                              : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-brand-ink'
                          }`
                        }
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  ))}
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
