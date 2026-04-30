import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTechnologies } from '../api/api'
import type { Technology } from '../types'

const ACCENT_COLORS = ['bg-orange-500', 'bg-amber-400', 'bg-slate-900', 'bg-orange-300']

export default function Home() {
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
        console.log('Technologies fetched for Home:', data)
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
    <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
      <section className="brand-panel brand-grid overflow-hidden py-16">
        <div className="grid gap-10 px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div className="space-y-6">
            <p className="brand-label">VelStack Learning Platform</p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-ink sm:text-6xl">
              Structured notes that feel like a real developer product
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-brand-muted">
              Learn HTML, CSS, JavaScript, and MySQL through a layered path: basic, real-world, production, and interview. Built for readability, repetition, and practical growth.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="brand-pill">Basic to interview-ready</span>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-brand-goldSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                Focused on clarity
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/technologies" className="brand-button-primary">
                Start Learning
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] bg-brand-ink p-6 text-white shadow-float">
              <p className="text-sm uppercase tracking-[0.26em] text-slate-300">Layered learning</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {['Basic', 'Real-world', 'Production', 'Interview'].map((item, index) => (
                  <span
                    key={item}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                      index === 3 ? 'bg-brand-orange text-white' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-amber-200 bg-[linear-gradient(135deg,_#fff7ed,_#fefce8)] p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-amber-700">Brand Promise</p>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                Calm docs experience, strong developer readability, and just enough identity to feel like a serious startup platform.
              </p>
              <div className="mt-5 h-px bg-gradient-to-r from-amber-300 via-orange-300 to-transparent" />
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Orange drives action. Gold marks progression. Slate protects readability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="brand-label">Core topics</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
              Start from the foundations that matter most
            </h2>
          </div>
        </div>

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
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {technologies.map((tech, index) => (
              <article
                key={tech.slug}
                className="group rounded-[1.75rem] border border-brand-border bg-white p-5 shadow-brand transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-float"
              >
                <div className={`h-2 w-20 rounded-full ${ACCENT_COLORS[index % ACCENT_COLORS.length]}`} />
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-brand-ink">{tech.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  Explore the curriculum and modules for {tech.name}.
                </p>
                <Link to={`/topics/${tech.slug}`} className="mt-5 inline-flex items-center text-sm font-semibold text-brand-orange">
                  Explore topic
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
