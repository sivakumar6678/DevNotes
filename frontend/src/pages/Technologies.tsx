import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTechnologies } from '../api/api'
import type { Technology } from '../types'

export default function Technologies() {
  const navigate = useNavigate()
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
        if (!cancelled) {
          setTechnologies(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load technologies.')
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <section className="brand-panel p-8">
        <p className="brand-label">Step 1</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          Choose a technology
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
          Start with a technology, then drill into focused topics and notes built for calm, structured learning.
        </p>
      </section>

      {loading ? <p className="text-sm text-brand-muted">Loading technologies...</p> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!loading && !error ? (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {technologies.map((technology) => (
            <button
              key={technology.slug}
              type="button"
              onClick={() => navigate(`/topics/${technology.slug}`)}
              className="rounded-[1.75rem] border border-brand-border bg-white p-6 text-left shadow-brand transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-float"
            >
              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-200" />
              <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-brand-ink">{technology.name}</h2>
              <p className="mt-3 text-sm leading-7 text-brand-muted">
                Open the learning path for {technology.name}.
              </p>
              <span className="mt-5 inline-flex text-sm font-semibold text-brand-orange">View topics</span>
            </button>
          ))}
        </section>
      ) : null}
    </div>
  )
}
