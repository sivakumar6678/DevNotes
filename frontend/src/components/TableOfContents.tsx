import { memo, useEffect, useState } from 'react'
import { hasRenderableContent, noteSections } from './noteContentSchema'

function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -40% 0px' }
    )

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [sectionIds])

  // Fallback: If scrolled to the absolute top, highlight the first section
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100 && sectionIds.length > 0) {
        setActiveId(sectionIds[0])
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Initialize
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds])

  return activeId
}

const TableOfContents = memo(function TableOfContents({ content = {} }: { content?: Record<string, any> }) {
  const sections = noteSections.filter((section) => hasRenderableContent(section.key, content[section.key]))

  const sectionIds = sections.map((s) => s.id)
  const activeId = useActiveSection(sectionIds)

  if (!sections.length) {
    return null
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-36 w-[240px] rounded-[2rem] border border-brand-border bg-white p-5 shadow-brand">
        <p className="brand-label">On this page</p>
        <nav aria-label="Table of contents" className="mt-4">
          <ul className="space-y-2">
            {sections.map((section) => {
              const isActive = activeId === section.id
              return (
                <li key={section.key}>
                  <a
                    href={`#${section.id}`}
                    className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-orangeSoft text-brand-orange shadow-sm ring-1 ring-brand-orange/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-ink'
                    }`}
                  >
                    {section.title}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
})

export default TableOfContents
