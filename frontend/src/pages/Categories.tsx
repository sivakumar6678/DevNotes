import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTechnologies } from '../api/api'
import type { Technology } from '../types'

export default function Categories() {
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTechnologies() {
      try {
        setLoading(true)
        setError('')
        const data = await getTechnologies()
        console.log('Technologies fetched for Categories:', data)
        if (!cancelled) {
          setTechnologies(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load technologies.')
          console.error(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadTechnologies()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8 mx-auto max-w-7xl px-6 lg:px-8">
      <section className="brand-panel p-8">
        <p className="brand-label">Learning paths</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          Browse by learning area
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
          Explore focused tracks built like a product docs system, with clean entry points for each subject area.
        </p>
      </section>

      {loading ? (
        <div className="text-center text-sm text-brand-muted py-12">Loading technologies...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : technologies.length === 0 ? (
        <div className="rounded-[1.75rem] border border-brand-border bg-white p-12 text-center shadow-brand">
          <p className="text-lg font-medium text-brand-ink">No curriculum found. Please create a technology first.</p>
          <Link to="/curriculum" className="mt-4 inline-block text-brand-orange font-semibold">
            Go to Curriculum Builder
          </Link>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-brand">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">Technologies</h2>
              <span className="rounded-full bg-brand-goldSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                Path
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {technologies.map((tech) => (
                <Link
                  key={tech.slug}
                  to={`/topics/${tech.slug}`}
                  className="rounded-2xl border border-brand-border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-brand-orangeSoft hover:text-brand-ink hover:shadow-sm"
                >
                  {tech.name}
                </Link>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  )
}
