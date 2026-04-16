import { noteSections } from './NoteContent'

function hasContent(value: any): boolean {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value != null
}

export default function TableOfContents({ content = {} }: { content?: Record<string, any> }) {
  const sections = noteSections.filter((section) => hasContent(content[section.key]))

  if (!sections.length) {
    return null
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-36 w-[240px] rounded-[2rem] border border-brand-border bg-white p-5 shadow-brand">
        <p className="brand-label">On this page</p>
        <nav aria-label="Table of contents" className="mt-4">
          <ul className="space-y-2">
            {sections.map((section) => (
              <li key={section.key}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-brand-ink"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
