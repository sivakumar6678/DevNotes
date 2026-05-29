import { memo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { preloadNote } from '../hooks/useNote'
import { DEFAULT_VERSION } from '../constants'
import type { AdjacentTopics } from '../hooks/useAdjacentTopics'

/**
 * TopicNavigation — renders "Previous" and "Next" topic links
 * at the bottom of a note for sequential learning flow.
 */
const TopicNavigation = memo(function TopicNavigation({
  prev,
  next,
}: AdjacentTopics) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Topic navigation"
      className="mt-10 grid gap-4 border-t border-slate-100 pt-8 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          to={`/notes/${prev.slug}`}
          onMouseEnter={() => preloadNote(prev.slug, DEFAULT_VERSION)}
          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-brand"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-orange" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Previous</p>
            <p className="mt-1 truncate text-sm font-semibold text-brand-ink group-hover:text-brand-orange transition">
              {prev.name}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          to={`/notes/${next.slug}`}
          onMouseEnter={() => preloadNote(next.slug, DEFAULT_VERSION)}
          className="group flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-brand sm:text-right"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Next</p>
            <p className="mt-1 truncate text-sm font-semibold text-brand-ink group-hover:text-brand-orange transition">
              {next.name}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-orange" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
})

export default TopicNavigation
