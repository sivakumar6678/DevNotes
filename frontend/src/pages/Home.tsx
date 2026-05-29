import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Layers, Lightbulb, Zap } from 'lucide-react'
import { getTechnologies } from '../api/api'
import { PrimaryLoader } from '../components/Loader'
import { usePageTitle } from '../hooks/usePageTitle'
import type { Technology } from '../types'

const ACCENT_COLORS = ['bg-orange-500', 'bg-amber-400', 'bg-slate-900', 'bg-orange-300']

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pick a technology',
    description: 'Choose from JavaScript, HTML, CSS, or MySQL. Each technology has a structured curriculum with modules and topics.',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Choose your depth',
    description: 'Every topic is written in multiple versions — simple, industry, interview, and more. Pick the level that matches where you are.',
    icon: Lightbulb,
  },
  {
    step: '03',
    title: 'Read and compare',
    description: 'Read through structured sections — definition, core concepts, code examples, best practices. Compare versions side by side.',
    icon: BookOpen,
  },
]

export default function Home() {
  usePageTitle()
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
    <div className="mx-auto max-w-7xl space-y-20 px-6 lg:px-8">
      {/* ───── Hero ───── */}
      <section className="brand-panel brand-grid overflow-hidden py-16">
        <div className="grid gap-10 px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
          <div className="space-y-6">
            <p className="brand-label">VelStack Learning Platform</p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-ink sm:text-6xl">
              Learn dev concepts from multiple angles — beginner to interview&#8209;ready
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-brand-muted">
              Every topic has multiple versions. Pick the depth that matches where you are right now — basic theory, real-world usage, or interview preparation.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="brand-pill">Multi-version notes</span>
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-brand-goldSoft px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                Structured for clarity
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/technologies" className="brand-button-primary">
                Browse Curriculum
              </Link>
              <Link to="/about" className="brand-button-secondary">
                How it works
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] bg-brand-ink p-6 text-white shadow-float">
              <p className="text-sm uppercase tracking-[0.26em] text-slate-300">Same topic, multiple depths</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Simple', desc: 'Core idea in plain language' },
                  { label: 'Industry', desc: 'How it works in production' },
                  { label: 'Interview', desc: 'What interviewers expect' },
                  { label: 'Revision', desc: 'Quick refresher format' },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl px-4 py-3 ${
                      index === 1 ? 'bg-brand-orange text-white' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className={`mt-1 text-xs ${index === 1 ? 'text-orange-100' : 'text-slate-400'}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-amber-200 bg-[linear-gradient(135deg,_#fff7ed,_#fefce8)] p-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-amber-700">What makes it different</p>
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                Instead of one explanation for everyone, every topic is written across basic, real-world, and interview contexts — so the same note stays useful as you grow.
              </p>
              <div className="mt-5 h-px bg-gradient-to-r from-amber-300 via-orange-300 to-transparent" />
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Structured sections: definition, core concepts, code examples, common mistakes, best practices, and interview notes — all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="space-y-10">
        <div className="text-center">
          <p className="brand-label">How It Works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-ink sm:text-4xl">
            Three steps to structured learning
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-brand-muted">
            No scattered tutorials, no 40-minute videos. Pick a topic, choose your depth, and read focused, well-structured notes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="rounded-[1.75rem] border border-brand-border bg-white p-7 shadow-brand transition hover:-translate-y-1 hover:shadow-float">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orangeSoft text-brand-orange">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold text-brand-orange">{item.step}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-brand-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-brand-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Technologies ───── */}
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="brand-label">Curriculum</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-ink">
              Start from the foundations that matter most
            </h2>
          </div>
          <Link to="/technologies" className="text-sm font-semibold text-brand-orange hover:text-orange-700 transition">
            View all →
          </Link>
        </div>

        {loading ? (
          <PrimaryLoader className="min-h-[220px]" label="Loading technologies" />
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
                  {tech.description || `Explore the structured curriculum and modules for ${tech.name}.`}
                </p>
                <Link to={`/topics/${tech.slug}`} className="mt-5 inline-flex items-center text-sm font-semibold text-brand-orange group-hover:underline">
                  Explore topics →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-brand-border py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-brand-orangeSoft">
              <span className="absolute h-5 w-[2px] rounded-full bg-brand-orange" />
              <span className="absolute top-1.5 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-brand-orange" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-brand-ink">VelStack</p>
              <p className="text-xs text-brand-muted">Structured learning for developers</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm font-medium text-brand-muted">
            <Link to="/technologies" className="hover:text-brand-ink transition">Technologies</Link>
            <Link to="/about" className="hover:text-brand-ink transition">About</Link>
            <Link to="/login" className="hover:text-brand-ink transition">Login</Link>
          </nav>
          <p className="text-xs text-brand-muted">© {new Date().getFullYear()} VelStack. Built for developers.</p>
        </div>
      </footer>
    </div>
  )
}
