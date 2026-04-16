import { Link } from 'react-router-dom'
import { categoryGroups } from '../data/docsData'

export default function Categories() {
  return (
    <div className="space-y-8">
      <section className="brand-panel p-8">
        <p className="brand-label">Learning paths</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          Browse by learning area
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
          Explore focused tracks built like a product docs system, with clean entry points for each subject area.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {categoryGroups.map((group) => (
          <article key={group.title} className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-brand">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">{group.title}</h2>
              <span className="rounded-full bg-brand-goldSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                Path
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {group.items.map((item) => (
                <Link
                  key={item}
                  to="/technologies"
                  className="rounded-2xl border border-brand-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-brand-orangeSoft hover:text-brand-ink hover:shadow-sm"
                >
                  {item}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
